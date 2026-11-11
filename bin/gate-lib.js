/**
 * gate-lib — plain-JS core for the terminal CLIs (no TypeScript: node
 * refuses type-stripping inside node_modules, so npm-installed bins must
 * be runnable as plain JS).
 *
 * Meta format contract: flat `key: value` lines — the same format
 * src/approval.ts reads/writes; the contract test in pios-wrapper.test.ts
 * proves the two implementations agree.
 *
 * Schema mirror contract: the x- vocabulary parsing, validation, and
 * helpers below mirror src/schema.ts exactly (contract-tested). The
 * engine carries zero flow knowledge — verbs, section gates, receipt
 * targets, verdict lines, unlock points, declaration phrases, and
 * completion stamps all come from the schema, in data.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export function findOpenspecRoot(start) {
  let dir = start;
  for (let i = 0; i < 40; i += 1) {
    if (existsSync(join(dir, 'openspec', 'changes'))) return join(dir, 'openspec');
    const parent = join(dir, '..');
    if (parent === dir) return undefined;
    dir = parent;
  }
  return undefined;
}

export function changeMetaPath(root, change) {
  return join(root, 'changes', change, '.openspec.yaml');
}

/** Parse flat key: value lines; missing file → {}. */
export function readChangeMeta(root, change) {
  const raw = {};
  const file = changeMetaPath(root, change);
  if (!existsSync(file)) return raw;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/u.exec(line);
    if (m) raw[m[1]] = m[2].trim();
  }
  return raw;
}

/** Set keys, preserving every other line; set-only never overwrites. */
export function writeChangeMeta(root, change, values, options = {}) {
  const file = changeMetaPath(root, change);
  let lines = [];
  if (existsSync(file)) lines = readFileSync(file, 'utf8').split('\n');
  const pending = new Map(Object.entries(values));
  const out = [];
  for (const line of lines) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*):/u.exec(line);
    if (m && pending.has(m[1])) {
      if (!(options.onlyIfAbsent && rawHas(line))) out.push(`${m[1]}: ${pending.get(m[1])}`);
      else out.push(line);
      pending.delete(m[1]);
    } else {
      out.push(line);
    }
  }
  for (const [k, v] of pending) out.push(`${k}: ${v}`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, out.join('\n').replace(/\n*$/u, '\n'), 'utf8');
}

function rawHas(line) {
  return /^([A-Za-z_][A-Za-z0-9_]*):\s*\S+/u.test(line);
}

export function utcNowStamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/u, 'Z');
}

// ── terminal focus (the walk's aim) ───────────────────────────────────

/** The human's terminal focus — one active change per room, one line in
 *  the root. The agent's session focus (openspec_focus) is a separate
 *  store and a separate authority; this file is never written by it. */
export function focusPath(openspecRoot) {
  return join(openspecRoot, '.focus');
}

export function readFocus(openspecRoot) {
  const file = focusPath(openspecRoot);
  if (!existsSync(file)) return undefined;
  const text = readFileSync(file, 'utf8');
  const keyed = /^change:\s*(.+?)\s*$/mu.exec(text);
  if (keyed) return keyed[1];
  const bare = text.trim();
  return bare.length > 0 ? bare : undefined; // legacy one-line form
}

/** Checkbox progress of one artifact file: ticked/total. Empty when the
 *  file is absent or declares no checklist — absence is information. */
function taskProgress(root, slug, file) {
  const path = join(root, 'changes', slug, file);
  if (!existsSync(path)) return '';
  const text = readFileSync(path, 'utf8');
  const total = (text.match(/^\s*[-*]\s*\[[xX ]\]/gmu) ?? []).length;
  if (total === 0) return '';
  const done = (text.match(/^\s*[-*]\s*\[[xX]\]/gmu) ?? []).length;
  return `${done}/${total}`;
}

/** Render the room snapshot for a change — computed at write time from
 *  meta + schema, never stored anywhere else. Fields: change,
 *  artifact-name, artifact-idx, task, next-step. */
function renderRoom(root, slug) {
  const meta = readChangeMeta(root, slug);
  const resolution = resolveChangeSchema(root, meta.schema);
  const fields = { change: slug };
  if (!resolution.ok || !schemaIsGated(resolution.schema)) {
    fields['artifact-name'] = '';
    fields['artifact-idx'] = '';
    fields.task = '';
    fields['next-step'] = 'eospec close';
    return fields;
  }
  const schema = resolution.schema;
  const approved = grantedSet(meta);
  const idx = schema.artifacts.findIndex((a) => !approved.has(a.id));
  const last = receiptArtifactFor(schema) ?? schema.artifacts[schema.artifacts.length - 1];
  if (idx === -1) {
    fields['artifact-name'] = last.generates;
    fields['artifact-idx'] = `${schema.artifacts.length}/${schema.artifacts.length}`;
    fields.task = taskProgress(root, slug, last.generates);
    const verdict = schemaVerdictLine(schema);
    fields['next-step'] = meta.validated ? 'eospec close' : verdict ? `tick '${verdict}' — eospec close` : 'eospec close';
  } else {
    const step = schema.artifacts[idx];
    fields['artifact-name'] = step.generates;
    fields['artifact-idx'] = `${idx + 1}/${schema.artifacts.length}`;
    fields.task = taskProgress(root, slug, step.generates);
    fields['next-step'] = existsSync(join(root, 'changes', slug, step.generates))
      ? 'eospec approve'
      : `draft ${step.generates}`;
  }
  return fields;
}

export function writeFocus(openspecRoot, slug) {
  const fields = renderRoom(openspecRoot, slug);
  const lines = [
    '# one active change per room — eospec writes, verbs refresh',
    `change: ${fields.change}`,
    `artifact-name: ${fields['artifact-name'] || '""'}`,
    `artifact-idx: ${fields['artifact-idx'] || '""'}`,
    `task: ${fields.task || '""'}`,
    `next-step: ${fields['next-step']}`,
  ];
  writeFileSync(focusPath(openspecRoot), `${lines.join('\n')}\n`, 'utf8');
}

/** The act hint for a change: an aimed room says `approve`, everything
 *  else names the aim. The echo teaches the walk without ever assuming
 *  the aim. */
export function actHint(openspecRoot, slug) {
  return readFocus(openspecRoot) === slug ? 'eospec approve' : `eospec focus ${slug}`;
}

// ── schema mirror (x- vocabulary) ──────────────────────────────────────

const KEY_LINE = /^([A-Za-z_][\w-]*):\s*(.*)$/u;
const ARTIFACT_ENTRY = /^-\s+(.*)$/u;
const FLOW_LIST = /^\[(.*)\]$/u;
const WORD_ID = /^[\w-]+$/u;
const SECTION_KEYS = new Set(['id', 'x-requires-written']);
/** capability classes the engine enforces — x-unlocks entries must name one */
const KNOWN_CAPABILITIES = new Set(['research', 'writes']);
export const RESERVED_WORDS = new Set([
  'approve', 'confirm', 'grant', 'next', 'act', 'go', 'done', 'pause', 'resume', 'pending', 'inspect', 'focus', 'validate',
  'new', 'init', 'archive', 'list', 'show', 'status', 'help', 'version',
]);

function parseListValue(raw, blockItems) {
  const flow = FLOW_LIST.exec(raw.trim());
  if (raw.trim().length > 0 && flow) {
    return flow[1].split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }
  if (raw.trim().length > 0) return [raw.trim()];
  return blockItems.map((s) => s.trim()).filter((s) => s.length > 0);
}

function parseFlag(value, tag, source, artifactId) {
  if (value.toLowerCase() === 'true') return true;
  throw new Error(`${source}: artifact '${artifactId}' ${tag} must be true (or absent)`);
}

function buildSections(chunks, source, artifactId) {
  const specs = [];
  for (const chunk of chunks) {
    const spec = { id: '', requiresWritten: [] };
    const headKey = KEY_LINE.exec(chunk.head.trim());
    if (headKey && headKey[1] === 'id') spec.id = headKey[2].trim();
    else if (headKey) {
      throw new Error(`${source}: artifact '${artifactId}' x-sections entries start with id or a bare heading — got '${chunk.head}'`);
    } else spec.id = chunk.head.trim();
    for (const { key, value } of chunk.keys) {
      if (key === 'x-requires-approval') {
        throw new Error(`${source}: artifact '${artifactId}' section '${spec.id}' carries x-requires-approval — retired: the walk stamps whole artifacts`);
      }
      if (!SECTION_KEYS.has(key)) {
        throw new Error(`${source}: artifact '${artifactId}' section '${spec.id}' carries unknown key '${key}' (one level only)`);
      }
      if (key === 'id') {
        spec.id = value.trim();
      } else {
        const flow = FLOW_LIST.exec(value.trim());
        if (!flow) {
          throw new Error(`${source}: section '${spec.id}' ${key} must be a flow list, e.g. ${key}: [one, two]`);
        }
        const list = flow[1].split(',').map((s) => s.trim()).filter((s) => s.length > 0);
        if (key === 'x-requires-written') spec.requiresWritten = list;
      }
    }
    const gated = spec.requiresWritten.length > 0;
    if (gated && !WORD_ID.test(spec.id)) {
      throw new Error(`${source}: gated section '${spec.id}' needs a single-word id (sub-grants address it as ${artifactId}/${spec.id})`);
    }
    if (spec.id.length === 0) throw new Error(`${source}: artifact '${artifactId}' declares a nameless section`);
    specs.push(spec);
  }
  return specs;
}

export function parseSchemaYaml(content, source) {
  const lines = content.split('\n');
  let name = '';
  let declares = [];
  const artifacts = [];
  let current;
  let pendingKey;
  let pendingBlockItems = [];
  let sectionChunks = [];
  let sectionsKeyIndent = -1;

  const newArtifact = () => ({
    id: '', generates: '', requiresApproval: [], requiresWritten: [], sections: [], lines: [],
    receivesReceipts: false, unlocks: [],
  });

  const flushPending = () => {
    if (pendingKey === 'x-declares') {
      declares = parseListValue('', pendingBlockItems);
    } else if (current && pendingKey === 'x-sections') {
      current.sections = buildSections(sectionChunks, source, current.id || '(unnamed)');
    } else if (current && pendingKey) {
      const value = parseListValue('', pendingBlockItems);
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
      inBlockScalar = false;
    }
    if (line.trim().length === 0) continue;

    const entry = ARTIFACT_ENTRY.exec(line.trimStart());
    if (entry) {
      // A deeper entry is a list item of the pending x- key; an entry at
      // or above the key's indent is ALSO a list item unless it is an
      // `id:`-headed artifact start — the un-indented block style
      // (live-caught 2026-10-23: `- idea` under `x-requires-approval:`
      // parsed empty ⇒ schemaIsGated false ⇒ approve fail-open).
      const rest = KEY_LINE.exec(entry[1].trim());
      const artifactStart = rest !== null && rest[1] === 'id';
      if (pendingKey && (indent > sectionsKeyIndent || !artifactStart)) {
        if (pendingKey === 'x-sections') sectionChunks.push({ head: entry[1].trim(), keys: [] });
        else pendingBlockItems.push(entry[1].trim());
        continue;
      }
      if (artifactStart) {
        flushPending();
        current = newArtifact();
        current.id = rest[2].trim();
        artifacts.push(current);
      }
      continue;
    }

    const key = KEY_LINE.exec(line.trimStart());
    if (!key) continue;
    const [, k, v] = key;
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
      if (v.trim().length > 0) declares = parseListValue(v, []);
      else {
        pendingKey = 'x-declares';
        sectionsKeyIndent = indent; // block items live deeper; anything shallower ends it
      }
      continue;
    }
    if (k === 'artifacts') {
      flushPending();
      current = newArtifact();
      continue;
    }
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
      // the walk killed the declared verbs — schemas in the wild carrying
      // the tag parse clean and simply resolve no verb (human ruling
      // 2026-11-10: the echo names every act; go performs it)
      flushPending();
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
        const value = parseListValue(v, []);
        if (k === 'x-requires-approval') current.requiresApproval = value;
        else if (k === 'x-requires-written') current.requiresWritten = value;
        else if (k === 'x-unlocks') {
          if (current.unlocks.length > 0) {
            throw new Error(`${source}: artifact '${current.id}' declares x-unlocks (or x-unlocks-source) more than once — choose one form`);
          }
          current.unlocks = value;
        }
        else if (k === 'x-sections') current.sections = value.map((id) => ({ id, requiresWritten: [] }));
        else current.lines = value;
      } else {
        pendingKey = k;
        sectionsKeyIndent = indent; // block items live deeper; anything shallower ends it
        if (k === 'x-sections') sectionChunks = [];
      }
    }
  }
  flushPending();

  const real = artifacts.filter((a) => a.id.length > 0);
  if (name.length === 0) throw new Error(`${source}: missing name`);
  if (real.length === 0) throw new Error(`${source}: no artifacts`);
  for (const phrase of declares) {
    if (phrase.length === 0 || phrase.length > 120) {
      throw new Error(`${source}: x-declares phrases must be 1–120 characters`);
    }
  }
  const ids = new Set();
  for (const a of real) {
    if (ids.has(a.id)) throw new Error(`${source}: duplicate artifact id '${a.id}'`);
    ids.add(a.id);
    if (a.generates.length === 0) throw new Error(`${source}: artifact '${a.id}' missing generates`);
  }
  // declaration sequence IS grant sequence: a dependency on a later (or the
  // same) artifact is a graph nothing can ever satisfy — fail loudly
  const orderOf = new Map(real.map((a, i) => [a.id, i]));
  for (const a of real) {
    const selfIndex = orderOf.get(a.id);
    for (const [tag, refs] of [
      ['x-requires-approval', a.requiresApproval],
      ['x-requires-written', a.requiresWritten],
    ]) {
      for (const req of refs) {
        if (!orderOf.has(req)) throw new Error(`${source}: ${tag} references unknown artifact '${req}'`);
        if (orderOf.get(req) >= selfIndex) {
          throw new Error(`${source}: artifact '${a.id}' ${tag} references '${req}', declared at or after it — dependencies must point to earlier artifacts (declaration sequence is grant sequence)`);
        }
      }
    }
    const sectionIds = new Set();
    for (const s of a.sections) {
      if (sectionIds.has(s.id)) throw new Error(`${source}: duplicate section '${s.id}' in artifact '${a.id}'`);
      sectionIds.add(s.id);
    }
    for (const s of a.sections) {
      for (const ref of [...s.requiresWritten]) {
        if (ref === s.id) throw new Error(`${source}: section '${a.id}/${s.id}' cannot require itself`);
        if (!sectionIds.has(ref)) throw new Error(`${source}: section '${a.id}/${s.id}' references unknown sibling section '${ref}'`);
      }
    }
  }
  for (const a of real) {
    for (const cap of a.unlocks) {
      if (!KNOWN_CAPABILITIES.has(cap)) {
        throw new Error(`${source}: artifact '${a.id}' x-unlocks names unknown capability '${cap}' — known: ${[...KNOWN_CAPABILITIES].join(', ')}`);
      }
    }
  }
  for (const [bearers, tag] of [
    [real.filter((a) => a.completes !== undefined), 'x-completes'],
    [real.filter((a) => a.verdictLine !== undefined), 'x-verdict-line'],
    [real.filter((a) => a.receivesReceipts), 'x-receives-receipts'],
  ]) {
    if (bearers.length > 1) {
      throw new Error(`${source}: ${tag} declared by ${bearers.map((a) => a.id).join(' and ')} — at most one`);
    }
  }
  return { name, declares, artifacts: real };
}

function configDir() {
  return process.env.OPENSPEC_CONFIG_DIR ?? process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config');
}

/** openspec's own global schema home (XDG data dir). */
function dataDir() {
  return process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share');
}

function globalSchemaDirs() {
  return [join(dataDir(), 'openspec', 'schemas'), join(configDir(), 'openspec', 'schemas')];
}

export function findSchemaFile(openspecRoot, schemaName) {
  const candidates = [
    join(openspecRoot, 'schemas', schemaName, 'schema.yaml'),
    ...globalSchemaDirs().map((dir) => join(dir, schemaName, 'schema.yaml')),
  ];
  return candidates.find((p) => existsSync(p));
}

export function resolveChangeSchema(openspecRoot, schemaName) {
  if (!schemaName) return { ok: false, reason: 'no-schema' };
  const file = findSchemaFile(openspecRoot, schemaName);
  if (!file) return { ok: false, reason: `schema-not-found:${schemaName}` };
  try {
    return { ok: true, schema: parseSchemaYaml(readFileSync(file, 'utf8'), file), source: file };
  } catch (err) {
    return { ok: false, reason: `schema-invalid:${err.message}` };
  }
}

export function artifactForFilename(schema, filename) {
  const base = filename.split('/').pop() ?? filename;
  return schema.artifacts.find((a) => a.generates === base || a.generates.endsWith(`/${base}`));
}


export function schemaIsGated(schema) {
  return schema.artifacts.some((a) => a.requiresApproval.length > 0 || (a.requiresWritten ?? []).length > 0);
}

export function allArtifactsGranted(schema, approvedSet) {
  return schema.artifacts.every((a) => approvedSet.has(a.id));
}

export function sectionTitles(artifact) {
  return artifact.sections.map((s) => s.id);
}

export function receiptArtifactFor(schema) {
  return schema.artifacts.find((a) => a.receivesReceipts) ?? schema.artifacts.find((a) => a.completes);
}

export function schemaVerdictLine(schema) {
  const bearer = schema.artifacts.find((a) => a.verdictLine);
  return bearer ? bearer.verdictLine : undefined;
}

export function writesUnlocked(schema, approvedSet) {
  const unlockers = schema.artifacts.filter((a) => (a.unlocks ?? []).includes('writes'));
  if (unlockers.length === 0) return allArtifactsGranted(schema, approvedSet);
  return unlockers.some((a) => approvedSet.has(a.id));
}

export function capabilityUnlocked(schema, approvedSet, capability) {
  return schema.artifacts.some((a) => (a.unlocks ?? []).includes(capability) && approvedSet.has(a.id));
}


/** The pending human act for a gated change in one line — read → grant,
 *  or awaiting draft; undefined once every artifact is granted and the
 *  completion line takes over. Takes the granted set, not meta: callers
 *  that just stamped pass the updated set. Derived at read time, never
 *  stored: the meta counters stay the only truth. */
export function pendingAct(root, slug, schema, approved) {
  const next = schema.artifacts.find((a) => !approved.has(a.id));
  if (!next) return undefined;
  return existsSync(join(root, 'changes', slug, next.generates))
    ? `read ${next.generates} → ${actHint(root, slug)}`
    : `awaiting draft of ${next.generates} (artifact ${next.id})`;
}

/** The gated change's completion sentence — what remains once every
 *  artifact is granted: validation state, or the declared verdict. */
export function completionLine(schema, meta) {
  const verdictLine = schemaVerdictLine(schema);
  return `all artifacts granted — ${meta.validated ? 'validated' : verdictLine ? `${verdictLine} pending` : 'no verdict declared'}`;
}

// ── structure checkers ─────────────────────────────────────────────────

export function sectionHeadingPresent(text, section) {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`^#{2,}\\s*${escaped}\\s*$`, 'imu').test(text);
}

export function lineKeyPresent(text, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`^${escaped}:`, 'mu').test(text);
}

export function grantedSet(meta) {
  const raw = meta.granted ?? '';
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );
}

/** Stamp the next-named artifact — go's engine. Strict sequence, the
 *  file must exist, declared structure must be present. Returns
 *  { ok, granted, completed } or { ok: false, error }. */
export function grantArtifact(root, slug, artifactRef) {
  const meta = readChangeMeta(root, slug);
  const resolution = resolveChangeSchema(root, meta.schema);
  if (!resolution.ok || !schemaIsGated(resolution.schema)) {
    return { ok: false, error: `schema declares no gates (${resolution.ok ? resolution.schema.name : resolution.reason}) — eospec close closes ungated changes as they stand` };
  }
  const schema = resolution.schema;
  const approved = grantedSet(meta);

  // artifact grant
  const artifact = schema.artifacts.find((a) => a.id === artifactRef);
  if (!artifact) return { ok: false, error: `no artifact '${artifactRef}' in schema ${schema.name}` };
  const file = join(root, 'changes', slug, artifact.generates);
  if (!existsSync(file)) {
    return { ok: false, error: `${artifact.generates} not drafted yet — you approve what you read` };
  }
  // x-requires-written — declared evidence must still be on disk (fail-safe
  // on the stamp: a dependency deleted after its grant refuses this one)
  const unwrittenDeps = artifact.requiresWritten
    .map((id) => schema.artifacts.find((a) => a.id === id)?.generates)
    .filter((dep) => dep !== undefined && !existsSync(join(root, 'changes', slug, dep)));
  if (unwrittenDeps.length > 0) {
    return { ok: false, error: `${artifact.generates} awaits declared evidence: ${unwrittenDeps.join(' · ')} not on disk (x-requires-written)` };
  }
  const text = readFileSync(file, 'utf8');
  const missing = [
    ...sectionTitles(artifact).filter((s) => !sectionHeadingPresent(text, s)),
    ...artifact.lines.filter((l) => !lineKeyPresent(text, l)),
  ];
  if (missing.length > 0) {
    return { ok: false, error: `${artifact.generates} missing declared structure: ${missing.join(' · ')}` };
  }
  const at = utcNowStamp();
  approved.add(artifactRef);
  const values = { granted: [...approved].join(','), [`granted_${artifactRef}`]: at };
  const completed = allArtifactsGranted(schema, approved);
  if (completed) {
    const completing = schema.artifacts.find((a) => a.completes);
    Object.assign(values, { status: completing?.completes ?? 'approved', approved_at: at });
  }
  writeChangeMeta(root, slug, values);
  return {
    ok: true,
    granted: artifactRef,
    completed,
    at,
    next: completed ? undefined : pendingAct(root, slug, schema, approved),
    verdict: completed ? schemaVerdictLine(schema) : undefined,
  };
}

/** Human-terminal cockpit: which changes need a human act. */
export function pendingReport(root) {
  const changesDir = join(root, 'changes');
  const rows = [];
  for (const dir of readdirSync(changesDir, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name === 'archive') continue;
    const meta = readChangeMeta(root, dir.name);
    const status = meta.status ?? 'no-meta';
    const resolution = resolveChangeSchema(root, meta.schema);
    const gated = resolution.ok && schemaIsGated(resolution.schema);

    let open = 0;
    let unhashed = 0;
    let humanWait = false;
    if (gated) {
      const schema = resolution.schema;
      const approved = grantedSet(meta);
      const verdictLine = schemaVerdictLine(schema);
      const counterArtifact = receiptArtifactFor(schema) ?? schema.artifacts[schema.artifacts.length - 1];
      const counterFile = join(changesDir, dir.name, counterArtifact.generates);
      if (existsSync(counterFile)) {
        const tasks = readFileSync(counterFile, 'utf8');
        open = (tasks.match(/^- \[ \]/gmu) ?? []).length;
        // the commit is the receipt: a ticked conventional commit without
        // a hash slot (or an explicit n/a) is visible debt
        const commitTick = /^- \[x\] (?:feat|fix|docs|style|refactor|test|chore|perf|ci|build)\(/u;
        const ledgerLines = tasks.split('\n');
        for (let li = 0; li < ledgerLines.length; li += 1) {
          if (!commitTick.test(ledgerLines[li])) continue;
          const hashLine = ledgerLines[li + 1] ?? '';
          if (!/hash:\s*\S/u.test(hashLine) || /hash:\s*n\/a/u.test(hashLine)) unhashed += 1;
        }
        if (verdictLine) {
          const escaped = verdictLine.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
          humanWait = new RegExp(`^- \\[ \\][^\\n]*${escaped}`, 'mu').test(tasks);
        }
      }
    } else {
      // no declared schema: count open checkboxes across the change's pages
      const changeDir = join(changesDir, dir.name);
      if (existsSync(changeDir)) {
        for (const f of readdirSync(changeDir)) {
          if (!f.endsWith('.md')) continue;
          open += (readFileSync(join(changeDir, f), 'utf8').match(/^- \[ \]/gmu) ?? []).length;
        }
      }
    }
    if (gated) {
      const schema = resolution.schema;
      const approved = grantedSet(meta);
      const marks = schema.artifacts.map((a) => (approved.has(a.id) ? '✓' : existsSync(join(changesDir, dir.name, a.generates)) ? '◻' : '·')).join('');
      const act = pendingAct(root, dir.name, schema, approved);
      const state = meta.validated
        ? `validated ${meta.validated_at ?? ''}`.trim()
        : meta.approved_at
          ? `approved ${meta.approved_at}`
          : (meta.status ?? 'proposed');
      const next = act
        ? `next: ${act}`
        : unhashed > 0
          ? `${unhashed} unhashed commits — eospec close closes after the hash`
          : meta.validated
            ? 'ready to close'
            : `next: ${completionLine(schema, meta)} — eospec close`;
      rows.push(`${dir.name.padEnd(28)}${marks} ${state} · ${next}`);
    } else {
      const need =
        status !== 'approved'
          ? 'aim first — eospec close closes ungated rooms'
          : humanWait && !meta.validated
            ? 'tick the verdict — eospec close closes it'
            : open > 0
              ? `${open} open tasks`
              : unhashed > 0
                ? `${unhashed} unhashed commits`
                : 'ready to close';
      rows.push(`${dir.name.padEnd(28)}${status.padEnd(10)}${need}`);
    }
  }
  return rows.length === 0 ? 'nothing pending — no active changes' : rows.join('\n');
}

