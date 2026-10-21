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
 * stamp lives here, in data. Parsing is line-based (zero deps, house
 * style): block scalars (`instruction: |`) are skipped by indentation,
 * artifacts are collected in declaration order — that order IS the
 * ladder. Flow lists (`[a, b]`) and block lists (`- a`) both parse.
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

export type PhaseArtifact = {
  id: string;
  /** filename relative to the change dir, e.g. "2-proposition.md" */
  generates: string;
  /** x-requires-approval — artifact ids that must be granted before this drafts */
  requiresApproval: string[];
  /** x-sections — H2 headings; rich entries may declare their own gates */
  sections: SectionSpec[];
  /** x-lines — top-level `Key:` lines the artifact must carry */
  lines: string[];
  /** x-grant-verb — the human's terminal alias for granting this artifact */
  grantVerb?: string;
  /** x-verdict-line — the checkbox line only a human may tick */
  verdictLine?: string;
  /** x-receives-receipts — attribution receipts land in this artifact */
  receivesReceipts: boolean;
  /** x-completes — status stamp written when this grant completes the ladder */
  completes?: string;
  /** x-unlocks-source — this artifact's grant begins source work */
  unlocksSource: boolean;
};

export type MissionSchema = {
  name: string;
  /** declaration order = ladder order */
  artifacts: PhaseArtifact[];
};

export type SchemaResolution =
  | { ok: true; schema: MissionSchema; source: string }
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

/** Parse schema YAML into a MissionSchema; throws on structural violations. */
export function parseSchemaYaml(content: string, source: string): MissionSchema {
  const lines = content.split('\n');
  let name = '';
  const artifacts: PhaseArtifact[] = [];
  let current: PhaseArtifact | undefined;
  let pendingKey: string | undefined;
  let pendingBlockItems: string[] = [];
  let sectionChunks: SectionChunk[] = [];
  let sectionsKeyIndent = -1;

  const newArtifact = (): PhaseArtifact => ({
    id: '', generates: '', requiresApproval: [], sections: [], lines: [],
    receivesReceipts: false, unlocksSource: false,
  });

  const flushPending = () => {
    if (current && pendingKey === 'x-sections') {
      current.sections = buildSections(sectionChunks, source, current.id || '(unnamed)');
    } else if (current && pendingKey) {
      const value = parseList('', pendingBlockItems);
      if (pendingKey === 'x-requires-approval') current.requiresApproval = value;
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
      if (pendingKey && indent > sectionsKeyIndent) {
        // a deeper entry is a list item of the pending x- key; anything
        // at or above its indent ends the block and starts a new artifact
        if (pendingKey === 'x-sections') sectionChunks.push({ head: entry[1]!.trim(), keys: [] });
        else pendingBlockItems.push(entry[1]!.trim());
        continue;
      }
      const rest = KEY_LINE.exec(entry[1]!.trim());
      if (rest && rest[1] === 'id') {
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
    if (k === 'x-grant-verb') {
      flushPending();
      const verb = v.trim();
      if (!WORD_ID.test(verb)) throw new Error(`${source}: artifact '${current.id}' x-grant-verb must be one word`);
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
      current.unlocksSource = parseFlag(v.trim(), k, source, current.id);
      continue;
    }
    if (k === 'x-requires-approval' || k === 'x-sections' || k === 'x-lines') {
      flushPending();
      if (v.trim().length > 0) {
        const value = parseList(v, []);
        if (k === 'x-requires-approval') current.requiresApproval = value;
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
  const ids = new Set<string>();
  for (const a of artifactsReal) {
    if (ids.has(a.id)) throw new Error(`${source}: duplicate artifact id '${a.id}'`);
    ids.add(a.id);
    if (a.generates.length === 0) throw new Error(`${source}: artifact '${a.id}' missing generates`);
  }
  for (const a of artifactsReal) {
    for (const req of a.requiresApproval) {
      if (!ids.has(req)) {
        throw new Error(`${source}: x-requires-approval references unknown artifact '${req}'`);
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
  return { name, artifacts: artifactsReal };
}

function configDir(): string {
  return process.env.OPENSPEC_CONFIG_DIR ?? process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config');
}

/** Resolve a schema by name: project-local first, then user-global. */
export function findSchemaFile(openspecRoot: string, schemaName: string): string | undefined {
  const candidates = [
    join(openspecRoot, 'schemas', schemaName, 'schema.yaml'),
    join(configDir(), 'openspec', 'schemas', schemaName, 'schema.yaml'),
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
export function artifactForFilename(schema: MissionSchema, filename: string): PhaseArtifact | undefined {
  const base = filename.split('/').pop() ?? filename;
  return schema.artifacts.find((a) => a.generates === base || a.generates.endsWith(`/${base}`));
}

/** Artifact addressed by a declared x-grant-verb. */
export function artifactForGrantVerb(schema: MissionSchema, verb: string): PhaseArtifact | undefined {
  return schema.artifacts.find((a) => a.grantVerb === verb);
}

/** True when any artifact declares a gate — verbs and guards activate only then. */
export function schemaIsGated(schema: MissionSchema): boolean {
  return schema.artifacts.some((a) => a.requiresApproval.length > 0);
}

/** Ladder complete when every declared rung bears a grant (order enforced elsewhere). */
export function ladderComplete(schema: MissionSchema, approved: ReadonlySet<string>): boolean {
  return schema.artifacts.every((a) => approved.has(a.id));
}

/** Declared heading titles, for structure checks. */
export function sectionTitles(artifact: PhaseArtifact): string[] {
  return artifact.sections.map((s) => s.id);
}

/** Artifact carrying attribution receipts: the declared target, else the completing artifact. */
export function receiptArtifactFor(schema: MissionSchema): PhaseArtifact | undefined {
  return schema.artifacts.find((a) => a.receivesReceipts) ?? schema.artifacts.find((a) => a.completes);
}

/** The single declared verdict line, when any artifact carries one. */
export function schemaVerdictLine(schema: MissionSchema): string | undefined {
  return schema.artifacts.find((a) => a.verdictLine)?.verdictLine;
}

/** Source work may begin when a declared unlock artifact bears a grant;
 *  schemas declaring none unlock at ladder completion (legacy behavior). */
export function unlockGranted(schema: MissionSchema, approved: ReadonlySet<string>): boolean {
  const unlockers = schema.artifacts.filter((a) => a.unlocksSource);
  if (unlockers.length === 0) return ladderComplete(schema, approved);
  return unlockers.some((a) => approved.has(a.id)); // any granted one unlocks
}

/** Sub-grant id path: 'artifact/section'. */
export function parseSectionPath(path: string): { artifactId: string; sectionId: string } | undefined {
  const match = /^([\w-]+)\/([\w-]+)$/u.exec(path);
  return match ? { artifactId: match[1]!, sectionId: match[2]! } : undefined;
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
  for (const dir of [join(openspecRoot, 'schemas'), join(configDir(), 'openspec', 'schemas')]) {
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
