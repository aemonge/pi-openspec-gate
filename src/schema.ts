/**
 * Schema reader — the only consumer of the gate's x- tags.
 *
 * Resolution mirrors openspec: project-local schemas first
 * (<root>/schemas/<name>/schema.yaml), then the user-global config dir
 * (~/.config/openspec/schemas/<name>/schema.yaml). The openspec CLI
 * strips unknown fields silently (non-strict zod, verified), so this
 * reader owns their validation and fails LOUDLY — a typo in an x- tag is
 * a fact and a block reason, never a silent no-op.
 *
 * The engine carries zero flow knowledge: every verb, gate, section
 * rule, receipt target, verdict line, unlock point, and completion
 * stamp lives here, in data. Declaration phrases (x-declares) too —
 * the human's latch vocabulary is schema data, not engine words.
 * Parsing is line-based (zero deps, house
 * style): block scalars (`instruction: |`) are skipped by indentation,
 * artifacts are collected in declaration order — that order IS the
 * grant sequence. Flow lists (`[a, b]`) and block lists (`- a`) both parse.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export type SectionSpec = {
  /** heading text — bare-string entries use the text as the id */
  id: string;
  /** x-requires-written — sibling sections that must exist before this heading */
  requiresWritten: string[];
  /** x-requires-approval — sibling sections that must bear a sub-grant first */
  requiresApproval: string[];
};

export type Artifact = {
  id: string;
  /** filename relative to the change dir, e.g. "2-proposition.md" */
  generates: string;
  /** x-requires-approval — artifact ids that must be granted before this drafts */
  requiresApproval: string[];
  /** x-requires-written — artifact ids whose files must exist before this drafts */
  requiresWritten: string[];
  /** x-sections — H2 headings; rich entries may declare their own gates */
  sections: SectionSpec[];
  /** x-lines — top-level `Key:` lines the artifact must carry */
  lines: string[];
  /** x-grant / x-grant-verb — the human's terminal alias for granting this artifact */
  grantVerb?: string;
  /** x-verdict-line — the checkbox line only a human may tick */
  verdictLine?: string;
  /** x-receives-receipts — attribution receipts land in this artifact */
  receivesReceipts: boolean;
  /** x-completes — status stamp written when this grant completes the schema */
  completes?: string;
  /** x-unlocks — capability classes this artifact's grant opens (research, writes);
   *  the legacy x-unlocks-source: true folds into [writes] */
  unlocks: string[];
};

export type Schema = {
  name: string;
  /** x-declares — human phrases that latch one declared (bare) mutation */
  declares: string[];
  /** declaration order = grant order */
  artifacts: Artifact[];
};

export type SchemaResolution =
  | { ok: true; schema: Schema; source: string }
  | { ok: false; reason: string };

const KEY_LINE = /^([A-Za-z_][\w-]*):\s*(.*)$/u;
const ARTIFACT_ENTRY = /^-\s+(.*)$/u;
const FLOW_LIST = /^\[(.*)\]$/u;
const WORD_ID = /^[\w-]+$/u;
/** keys a rich x-sections entry may carry — anything else fails loudly */
const SECTION_KEYS = new Set(['id', 'x-requires-written', 'x-requires-approval']);
/** words a schema verb may never shadow — gate CLI surface + openspec passthroughs */
export const RESERVED_WORDS = new Set([
  'approve', 'confirm', 'grant', 'pending', 'inspect', 'focus', 'validate',
  'new', 'init', 'archive', 'list', 'show', 'status', 'help', 'version',
]);

/** capability classes the engine enforces — x-unlocks entries must name one.
 *  The engine owns the classes (what they mean at the tool boundary);
 *  schemas own the timing (which grant opens which). */
const KNOWN_CAPABILITIES = new Set(['research', 'writes']);

function parseList(raw: string, blockItems: string[]): string[] {
  const flow = FLOW_LIST.exec(raw.trim());
  if (raw.trim().length > 0 && flow) {
    return flow[1]!.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }
  if (raw.trim().length > 0) return [raw.trim()];
  return blockItems.map((s) => s.trim()).filter((s) => s.length > 0);
}

function parseFlag(value: string, tag: string, source: string, artifactId: string): boolean {
  if (value.toLowerCase() === 'true') return true;
  throw new Error(`${source}: artifact '${artifactId}' ${tag} must be true (or absent)`);
}

/** One `- ` entry under x-sections, plus its deeper-indented keys. */
type SectionChunk = { head: string; keys: { key: string; value: string }[] };

function buildSections(chunks: SectionChunk[], source: string, artifactId: string): SectionSpec[] {
  const specs: SectionSpec[] = [];
  for (const chunk of chunks) {
    const spec: SectionSpec = { id: '', requiresWritten: [], requiresApproval: [] };
    const headKey = KEY_LINE.exec(chunk.head.trim());
    if (headKey && headKey[1] === 'id') spec.id = headKey[2]!.trim();
    else if (headKey) {
      throw new Error(
        `${source}: artifact '${artifactId}' x-sections entries start with id or a bare heading — got '${chunk.head}'`,
      );
    } else spec.id = chunk.head.trim();
    for (const { key, value } of chunk.keys) {
      if (!SECTION_KEYS.has(key)) {
        throw new Error(
          `${source}: artifact '${artifactId}' section '${spec.id}' carries unknown key '${key}' (one level only)`,
        );
      }
      if (key === 'id') {
        spec.id = value.trim();
      } else {
        const flow = FLOW_LIST.exec(value.trim());
        if (!flow) {
          throw new Error(
            `${source}: section '${spec.id}' ${key} must be a flow list, e.g. ${key}: [one, two]`,
          );
        }
        const list = flow[1]!.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
        if (key === 'x-requires-written') spec.requiresWritten = list;
        else spec.requiresApproval = list;
      }
    }
    const gated = spec.requiresWritten.length > 0 || spec.requiresApproval.length > 0;
    if (gated && !WORD_ID.test(spec.id)) {
      throw new Error(
        `${source}: gated section '${spec.id}' needs a single-word id (sub-grants address it as ${artifactId}/${spec.id})`,
      );
    }
    if (spec.id.length === 0) throw new Error(`${source}: artifact '${artifactId}' declares a nameless section`);
    specs.push(spec);
  }
  return specs;
}

/** Parse schema YAML into a Schema; throws on structural violations. */
export function parseSchemaYaml(content: string, source: string): Schema {
  const lines = content.split('\n');
  let name = '';
  let declares: string[] = [];
  const artifacts: Artifact[] = [];
  let current: Artifact | undefined;
  let pendingKey: string | undefined;
  let pendingBlockItems: string[] = [];
  let sectionChunks: SectionChunk[] = [];
  let sectionsKeyIndent = -1;

  const newArtifact = (): Artifact => ({
    id: '', generates: '', requiresApproval: [], requiresWritten: [], sections: [], lines: [],
    receivesReceipts: false, unlocks: [],
  });

  const flushPending = () => {
    if (pendingKey === 'x-declares') {
      declares = parseList('', pendingBlockItems);
    } else if (current && pendingKey === 'x-sections') {
      current.sections = buildSections(sectionChunks, source, current.id || '(unnamed)');
    } else if (current && pendingKey) {
      const value = parseList('', pendingBlockItems);
      if (pendingKey === 'x-requires-approval') current.requiresApproval = value;
      else if (pendingKey === 'x-requires-written') current.requiresWritten = value;
      else if (pendingKey === 'x-unlocks') {
        if (current.unlocks.length > 0) {
          throw new Error(`${source}: artifact '${current.id}' declares x-unlocks (or x-unlocks-source) more than once — choose one form`);
        }
        current.unlocks = value;
      }
      else if (pendingKey === 'x-lines') current.lines = value;
    }
    pendingKey = undefined;
    pendingBlockItems = [];
    sectionChunks = [];
    sectionsKeyIndent = -1;
  };

  let inBlockScalar = false;
  let blockIndent = -1;

  for (const line of lines) {
    const indent = line.length - line.trimStart().length;
    if (inBlockScalar) {
      if (line.trim().length === 0 || indent > blockIndent) continue;
      inBlockScalar = false; // dedent ends the block scalar
    }
    if (line.trim().length === 0) continue;

    const entry = ARTIFACT_ENTRY.exec(line.trimStart());
    if (entry) {
      // A deeper entry is a list item of the pending x- key; an entry at
      // or above the key's indent is ALSO a list item unless it is an
      // `id:`-headed artifact start — the un-indented block style
      // (live-caught 2026-10-23: the shipped spec schema's `- idea` under
      // `x-requires-approval:` parsed empty on BOTH sides ⇒ phase gates
      // silently skipped; the bin twin was fixed first, this is the
      // symmetric half, by human ruling "1" — extend the slice).
      const rest = KEY_LINE.exec(entry[1]!.trim());
      const artifactStart = rest !== null && rest[1] === 'id';
      if (pendingKey && (indent > sectionsKeyIndent || !artifactStart)) {
        if (pendingKey === 'x-sections') sectionChunks.push({ head: entry[1]!.trim(), keys: [] });
        else pendingBlockItems.push(entry[1]!.trim());
        continue;
      }
      if (artifactStart) {
        flushPending();
        current = newArtifact();
        current.id = rest[2]!.trim();
        artifacts.push(current);
      }
      continue;
    }

    const key = KEY_LINE.exec(line.trimStart());
    if (!key) continue;
    const [, k, v] = key;
    // block scalar starts: skip its indented body (instructions etc.)
    if (/\|\s*$|>\s*$/u.test(v)) {
      inBlockScalar = true;
      blockIndent = indent;
      continue;
    }
    if (k === 'name') {
      name = v.trim();
      continue;
    }
    if (k === 'x-declares') {
      flushPending();
      if (v.trim().length > 0) declares = parseList(v, []);
      else {
        pendingKey = 'x-declares';
        sectionsKeyIndent = indent; // block items live deeper; anything shallower ends it
      }
      continue;
    }
    if (k === 'artifacts') {
      flushPending();
      current = newArtifact(); // sentinel until first entry
      continue;
    }
    // while collecting rich sections, deeper id/x- keys belong to the
    // last section entry; same-or-shaller indent ends the collection
    if (pendingKey === 'x-sections' && indent > sectionsKeyIndent && (k === 'id' || k.startsWith('x-'))) {
      const last = sectionChunks[sectionChunks.length - 1];
      if (!last) throw new Error(`${source}: x-sections sub-key '${k}' before any section entry`);
      last.keys.push({ key: k, value: v.trim() });
      continue;
    }
    if (!current) continue;
    if (k === 'id') {
      flushPending();
      current.id = v.trim();
      continue;
    }
    if (k === 'generates') {
      current.generates = v.trim();
      continue;
    }
    if (k === 'x-grant-verb' || k === 'x-grant') {
      flushPending();
      const verb = v.trim();
      if (!WORD_ID.test(verb)) throw new Error(`${source}: artifact '${current.id}' ${k} must be one word`);
      if (current.grantVerb !== undefined) {
        throw new Error(`${source}: artifact '${current.id}' declares x-grant and x-grant-verb both — choose one`);
      }
      current.grantVerb = verb;
      continue;
    }
    if (k === 'x-verdict-line') {
      flushPending();
      if (v.trim().length === 0) throw new Error(`${source}: artifact '${current.id}' x-verdict-line needs a value`);
      current.verdictLine = v.trim();
      continue;
    }
    if (k === 'x-completes') {
      flushPending();
      if (v.trim().length === 0) throw new Error(`${source}: artifact '${current.id}' x-completes needs a value`);
      current.completes = v.trim();
      continue;
    }
    if (k === 'x-receives-receipts') {
      flushPending();
      current.receivesReceipts = parseFlag(v.trim(), k, source, current.id);
      continue;
    }
    if (k === 'x-unlocks-source') {
      flushPending();
      if (parseFlag(v.trim(), k, source, current.id)) {
        if (current.unlocks.length > 0) {
          throw new Error(`${source}: artifact '${current.id}' declares x-unlocks and x-unlocks-source both — choose one form`);
        }
        current.unlocks = ['writes'];
      }
      continue;
    }
    if (k === 'x-requires-approval' || k === 'x-requires-written' || k === 'x-unlocks' || k === 'x-sections' || k === 'x-lines') {
      flushPending();
      if (v.trim().length > 0) {
        const value = parseList(v, []);
        if (k === 'x-requires-approval') current.requiresApproval = value;
        else if (k === 'x-requires-written') current.requiresWritten = value;
        else if (k === 'x-unlocks') {
          if (current.unlocks.length > 0) {
            throw new Error(`${source}: artifact '${current.id}' declares x-unlocks (or x-unlocks-source) more than once — choose one form`);
          }
          current.unlocks = value;
        }
        else if (k === 'x-sections') current.sections = value.map((id) => ({ id, requiresWritten: [], requiresApproval: [] }));
        else current.lines = value;
      } else {
        pendingKey = k;
        sectionsKeyIndent = indent; // block items live deeper; anything shallower ends it
        if (k === 'x-sections') sectionChunks = [];
      }
      continue;
    }
    // stray keys are ignored (description, requires, version, …)
  }
  flushPending();

  const artifactsReal = artifacts.filter((a) => a.id.length > 0);
  if (name.length === 0) throw new Error(`${source}: missing name`);
  if (artifactsReal.length === 0) throw new Error(`${source}: no artifacts`);
  for (const phrase of declares) {
    if (phrase.length === 0 || phrase.length > 120) {
      throw new Error(`${source}: x-declares phrases must be 1–120 characters`);
    }
  }
  const ids = new Set<string>();
  for (const a of artifactsReal) {
    if (ids.has(a.id)) throw new Error(`${source}: duplicate artifact id '${a.id}'`);
    ids.add(a.id);
    if (a.generates.length === 0) throw new Error(`${source}: artifact '${a.id}' missing generates`);
  }
  // declaration sequence IS grant sequence: a dependency on a later (or the
  // same) artifact is a graph nothing can ever satisfy — fail loudly
  const orderOf = new Map(artifactsReal.map((a, i) => [a.id, i] as const));
  for (const a of artifactsReal) {
    const selfIndex = orderOf.get(a.id)!;
    for (const [tag, refs] of [
      ['x-requires-approval', a.requiresApproval],
      ['x-requires-written', a.requiresWritten],
    ] as const) {
      for (const req of refs) {
        if (!orderOf.has(req)) {
          throw new Error(`${source}: ${tag} references unknown artifact '${req}'`);
        }
        if (orderOf.get(req)! >= selfIndex) {
          throw new Error(
            `${source}: artifact '${a.id}' ${tag} references '${req}', declared at or after it — dependencies must point to earlier artifacts (declaration sequence is grant sequence)`,
          );
        }
      }
    }
    const sectionIds = new Set<string>();
    for (const s of a.sections) {
      if (sectionIds.has(s.id)) throw new Error(`${source}: duplicate section '${s.id}' in artifact '${a.id}'`);
      sectionIds.add(s.id);
    }
    for (const s of a.sections) {
      for (const ref of [...s.requiresWritten, ...s.requiresApproval]) {
        if (ref === s.id) {
          throw new Error(`${source}: section '${a.id}/${s.id}' cannot require itself`);
        }
        if (!sectionIds.has(ref)) {
          throw new Error(`${source}: section '${a.id}/${s.id}' references unknown sibling section '${ref}'`);
        }
      }
    }
  }
  for (const a of artifactsReal) {
    for (const cap of a.unlocks) {
      if (!KNOWN_CAPABILITIES.has(cap)) {
        throw new Error(`${source}: artifact '${a.id}' x-unlocks names unknown capability '${cap}' — known: ${[...KNOWN_CAPABILITIES].join(', ')}`);
      }
    }
  }
  const verbs = new Map<string, string>();
  for (const a of artifactsReal) {
    if (!a.grantVerb) continue;
    if (RESERVED_WORDS.has(a.grantVerb)) {
      throw new Error(`${source}: x-grant-verb '${a.grantVerb}' is reserved by the gate CLI`);
    }
    const owner = verbs.get(a.grantVerb);
    if (owner) throw new Error(`${source}: x-grant-verb '${a.grantVerb}' declared by '${owner}' and '${a.id}'`);
    verbs.set(a.grantVerb, a.id);
  }
  for (const [tag] of [
    ['x-completes'], ['x-verdict-line'], ['x-receives-receipts'],
  ] as const) {
    const bearers = artifactsReal.filter((a) =>
      tag === 'x-completes' ? a.completes !== undefined
        : tag === 'x-verdict-line' ? a.verdictLine !== undefined
          : a.receivesReceipts,
    );
    if (bearers.length > 1) {
      throw new Error(`${source}: ${tag} declared by ${bearers.map((a) => a.id).join(' and ')} — at most one`);
    }
  }
  return { name, declares, artifacts: artifactsReal };
}

function configDir(): string {
  return process.env.OPENSPEC_CONFIG_DIR ?? process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config');
}

/** openspec's own global schema home (XDG data dir) — where the openspec
 *  CLI actually installs user-global schemas. */
function dataDir(): string {
  return process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share');
}

/** Global schema search dirs: openspec's data home first, then the
 *  config dir (the gate's original global location). */
function globalSchemaDirs(): string[] {
  return [join(dataDir(), 'openspec', 'schemas'), join(configDir(), 'openspec', 'schemas')];
}

/** Resolve a schema by name: project-local first, then openspec's global
 *  data home, then the config dir. */
export function findSchemaFile(openspecRoot: string, schemaName: string): string | undefined {
  const candidates = [
    join(openspecRoot, 'schemas', schemaName, 'schema.yaml'),
    ...globalSchemaDirs().map((dir) => join(dir, schemaName, 'schema.yaml')),
  ];
  return candidates.find((p) => existsSync(p));
}

/** Resolve the schema for a change meta's `schema:` value. */
export function resolveChangeSchema(openspecRoot: string, schemaName: string | undefined): SchemaResolution {
  if (!schemaName) return { ok: false, reason: 'no-schema' };
  const file = findSchemaFile(openspecRoot, schemaName);
  if (!file) return { ok: false, reason: `schema-not-found:${schemaName}` };
  try {
    return { ok: true, schema: parseSchemaYaml(readFileSync(file, 'utf8'), file), source: file };
  } catch (err) {
    return { ok: false, reason: `schema-invalid:${(err as Error).message}` };
  }
}

/** Artifact whose generates filename matches (basename compare). */
export function artifactForFilename(schema: Schema, filename: string): Artifact | undefined {
  const base = filename.split('/').pop() ?? filename;
  return schema.artifacts.find((a) => a.generates === base || a.generates.endsWith(`/${base}`));
}

/** Artifact addressed by a declared x-grant-verb. */
export function artifactForGrantVerb(schema: Schema, verb: string): Artifact | undefined {
  return schema.artifacts.find((a) => a.grantVerb === verb);
}

/** True when any artifact declares any gate — approval or written evidence;
 *  verbs and guards activate only then. */
export function schemaIsGated(schema: Schema): boolean {
  return schema.artifacts.some((a) => a.requiresApproval.length > 0 || a.requiresWritten.length > 0);
}

/** Schema complete when every declared artifact bears a grant (order enforced elsewhere). */
export function allArtifactsGranted(schema: Schema, approved: ReadonlySet<string>): boolean {
  return schema.artifacts.every((a) => approved.has(a.id));
}

/** Declared heading titles, for structure checks. */
export function sectionTitles(artifact: Artifact): string[] {
  return artifact.sections.map((s) => s.id);
}

/** Artifact carrying attribution receipts: the declared target, else the completing artifact. */
export function receiptArtifactFor(schema: Schema): Artifact | undefined {
  return schema.artifacts.find((a) => a.receivesReceipts) ?? schema.artifacts.find((a) => a.completes);
}

/** The single declared verdict line, when any artifact carries one. */
export function schemaVerdictLine(schema: Schema): string | undefined {
  return schema.artifacts.find((a) => a.verdictLine)?.verdictLine;
}

/** Writes (source work) may begin when a declared writes-unlock artifact
 *  bears a grant; schemas declaring none unlock at full completion
 *  (legacy behavior). */
export function writesUnlocked(schema: Schema, approved: ReadonlySet<string>): boolean {
  const unlockers = schema.artifacts.filter((a) => a.unlocks.includes('writes'));
  if (unlockers.length === 0) return allArtifactsGranted(schema, approved);
  return unlockers.some((a) => approved.has(a.id)); // any granted one unlocks
}

/** A capability class is open when any artifact declaring it bears a grant
 *  (monotonic: unlocked stays unlocked). */
export function capabilityUnlocked(schema: Schema, approved: ReadonlySet<string>, capability: string): boolean {
  return schema.artifacts.some((a) => a.unlocks.includes(capability) && approved.has(a.id));
}

/** Sub-grant id path: 'artifact/section'. */
export function parseSectionPath(path: string): { artifactId: string; sectionId: string } | undefined {
  const match = /^([\w-]+)\/([\w-]+)$/u.exec(path);
  return match ? { artifactId: match[1]!, sectionId: match[2]! } : undefined;
}

const declareScanCache = new Map<string, Set<string>>();

/** Every x-declares phrase across the root's resolvable schemas (project
 *  + user-global) — the declaration latch's vocabulary, from data. Cached
 *  per root; unparseable schemas contribute nothing (their own resolution
 *  fails loudly elsewhere). */
export function scanDeclares(openspecRoot: string): Set<string> {
  const cached = declareScanCache.get(openspecRoot);
  if (cached) return cached;
  const phrases = new Set<string>();
  for (const dir of [join(openspecRoot, 'schemas'), ...globalSchemaDirs()]) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = join(dir, entry.name, 'schema.yaml');
      if (!existsSync(file)) continue;
      try {
        for (const phrase of parseSchemaYaml(readFileSync(file, 'utf8'), file).declares) {
          phrases.add(phrase);
        }
      } catch {
        // invalid schema: contributes no phrases; loud failure happens at resolution
      }
    }
  }
  declareScanCache.set(openspecRoot, phrases);
  return phrases;
}

const grantVerbCache = new Map<string, Set<string>>();

/** Every x-grant-verb declared by any resolvable schema (project + user
 *  global) — the approval-touch guard's dynamic vocabulary. Cached per
 *  openspec root for the session; unparseable schemas contribute nothing
 *  (their own resolution fails loudly elsewhere). */
export function scanGrantVerbs(openspecRoot: string): Set<string> {
  const cached = grantVerbCache.get(openspecRoot);
  if (cached) return cached;
  const verbs = new Set<string>();
  for (const dir of [join(openspecRoot, 'schemas'), ...globalSchemaDirs()]) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = join(dir, entry.name, 'schema.yaml');
      if (!existsSync(file)) continue;
      try {
        for (const artifact of parseSchemaYaml(readFileSync(file, 'utf8'), file).artifacts) {
          if (artifact.grantVerb) verbs.add(artifact.grantVerb);
        }
      } catch {
        // invalid schema: contributes no verbs; loud failure happens at resolution
      }
    }
  }
  grantVerbCache.set(openspecRoot, verbs);
  return verbs;
}
