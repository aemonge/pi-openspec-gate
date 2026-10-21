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
 * targets, verdict lines, unlock points, and completion stamps all come
 * from the schema, in data.
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

// ── schema mirror (x- vocabulary) ──────────────────────────────────────

const KEY_LINE = /^([A-Za-z_][\w-]*):\s*(.*)$/u;
const ARTIFACT_ENTRY = /^-\s+(.*)$/u;
const FLOW_LIST = /^\[(.*)\]$/u;
const WORD_ID = /^[\w-]+$/u;
const SECTION_KEYS = new Set(['id', 'x-requires-written', 'x-requires-approval']);
export const RESERVED_WORDS = new Set([
  'approve', 'confirm', 'grant', 'pending', 'inspect', 'focus', 'validate',
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
    const spec = { id: '', requiresWritten: [], requiresApproval: [] };
    const headKey = KEY_LINE.exec(chunk.head.trim());
    if (headKey && headKey[1] === 'id') spec.id = headKey[2].trim();
    else if (headKey) {
      throw new Error(`${source}: artifact '${artifactId}' x-sections entries start with id or a bare heading — got '${chunk.head}'`);
    } else spec.id = chunk.head.trim();
    for (const { key, value } of chunk.keys) {
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
        else spec.requiresApproval = list;
      }
    }
    const gated = spec.requiresWritten.length > 0 || spec.requiresApproval.length > 0;
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
  const artifacts = [];
  let current;
  let pendingKey;
  let pendingBlockItems = [];
  let sectionChunks = [];
  let sectionsKeyIndent = -1;

  const newArtifact = () => ({
    id: '', generates: '', requiresApproval: [], sections: [], lines: [],
    receivesReceipts: false, unlocksSource: false,
  });

  const flushPending = () => {
    if (current && pendingKey === 'x-sections') {
      current.sections = buildSections(sectionChunks, source, current.id || '(unnamed)');
    } else if (current && pendingKey) {
      const value = parseListValue('', pendingBlockItems);
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
      inBlockScalar = false;
    }
    if (line.trim().length === 0) continue;

    const entry = ARTIFACT_ENTRY.exec(line.trimStart());
    if (entry) {
      if (pendingKey && indent > sectionsKeyIndent) {
        // a deeper entry is a list item of the pending x- key; anything
        // at or above its indent ends the block and starts a new artifact
        if (pendingKey === 'x-sections') sectionChunks.push({ head: entry[1].trim(), keys: [] });
        else pendingBlockItems.push(entry[1].trim());
        continue;
      }
      const rest = KEY_LINE.exec(entry[1].trim());
      if (rest && rest[1] === 'id') {
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
        const value = parseListValue(v, []);
        if (k === 'x-requires-approval') current.requiresApproval = value;
        else if (k === 'x-sections') current.sections = value.map((id) => ({ id, requiresWritten: [], requiresApproval: [] }));
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
  const ids = new Set();
  for (const a of real) {
    if (ids.has(a.id)) throw new Error(`${source}: duplicate artifact id '${a.id}'`);
    ids.add(a.id);
    if (a.generates.length === 0) throw new Error(`${source}: artifact '${a.id}' missing generates`);
  }
  for (const a of real) {
    for (const req of a.requiresApproval) {
      if (!ids.has(req)) throw new Error(`${source}: x-requires-approval references unknown artifact '${req}'`);
    }
    const sectionIds = new Set();
    for (const s of a.sections) {
      if (sectionIds.has(s.id)) throw new Error(`${source}: duplicate section '${s.id}' in artifact '${a.id}'`);
      sectionIds.add(s.id);
    }
    for (const s of a.sections) {
      for (const ref of [...s.requiresWritten, ...s.requiresApproval]) {
        if (ref === s.id) throw new Error(`${source}: section '${a.id}/${s.id}' cannot require itself`);
        if (!sectionIds.has(ref)) throw new Error(`${source}: section '${a.id}/${s.id}' references unknown sibling section '${ref}'`);
      }
    }
  }
  const verbs = new Map();
  for (const a of real) {
    if (!a.grantVerb) continue;
    if (RESERVED_WORDS.has(a.grantVerb)) {
      throw new Error(`${source}: x-grant-verb '${a.grantVerb}' is reserved by the gate CLI`);
    }
    const owner = verbs.get(a.grantVerb);
    if (owner) throw new Error(`${source}: x-grant-verb '${a.grantVerb}' declared by '${owner}' and '${a.id}'`);
    verbs.set(a.grantVerb, a.id);
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
  return { name, artifacts: real };
}

function configDir() {
  return process.env.OPENSPEC_CONFIG_DIR ?? process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config');
}

export function findSchemaFile(openspecRoot, schemaName) {
  const candidates = [
    join(openspecRoot, 'schemas', schemaName, 'schema.yaml'),
    join(configDir(), 'openspec', 'schemas', schemaName, 'schema.yaml'),
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

export function artifactForGrantVerb(schema, verb) {
  return schema.artifacts.find((a) => a.grantVerb === verb);
}

export function schemaIsGated(schema) {
  return schema.artifacts.some((a) => a.requiresApproval.length > 0);
}

export function ladderComplete(schema, approvedSet) {
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

export function unlockGranted(schema, approvedSet) {
  const unlockers = schema.artifacts.filter((a) => a.unlocksSource);
  if (unlockers.length === 0) return ladderComplete(schema, approvedSet);
  return unlockers.some((a) => approvedSet.has(a.id));
}

export function parseSectionPath(path) {
  const m = /^([\w-]+)\/([\w-]+)$/u.exec(path);
  return m ? { artifactId: m[1], sectionId: m[2] } : undefined;
}

/** The terminal command granting an artifact: declared verb, else the
 *  id-addressed canonical form. */
export function grantHint(schema, artifactId, slug) {
  const artifact = schema.artifacts.find((a) => a.id === artifactId);
  if (artifact?.grantVerb) return `pios-gate ${artifact.grantVerb} ${slug}`;
  return `pios-gate approve ${slug} ${artifactId}`;
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

export function phasesApprovedSet(meta) {
  const raw = meta.phases_approved ?? '';
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );
}

/** Stamp one artifact (id or artifact/section id-path): strict
 *  sequence, file must exist, declared structure must be present, gated
 *  sections must bear sub-grants. Returns { ok, granted, completed } or
 *  { ok: false, error }. */
export function grantRung(root, slug, rungId) {
  const meta = readChangeMeta(root, slug);
  const resolution = resolveChangeSchema(root, meta.schema);
  if (!resolution.ok || !schemaIsGated(resolution.schema)) {
    return { ok: false, error: `schema declares no gates (${resolution.ok ? resolution.schema.name : resolution.reason}) — use: pios-gate approve ${slug}` };
  }
  const schema = resolution.schema;
  const approved = phasesApprovedSet(meta);

  // sub-grant: artifact/section id-path
  const sectionPath = parseSectionPath(rungId);
  if (sectionPath) {
    const artifact = schema.artifacts.find((a) => a.id === sectionPath.artifactId);
    if (!artifact) return { ok: false, error: `no artifact '${sectionPath.artifactId}' in schema ${schema.name}` };
    const section = artifact.sections.find((s) => s.id === sectionPath.sectionId);
    if (!section) {
      const grantable = artifact.sections.filter((s) => WORD_ID.test(s.id)).map((s) => `${artifact.id}/${s.id}`);
      return {
        ok: false,
        error: `no section '${sectionPath.sectionId}' in artifact '${artifact.id}'${grantable.length > 0 ? ` — grantable: ${grantable.join(' · ')}` : ' (no addressable sections)'}`,
      };
    }
    if (approved.has(rungId)) return { ok: false, error: `artifact '${rungId}' already granted ${meta[`granted_${rungId.replace('/', '_')}`] ?? ''}`.trim() };
    const file = join(root, 'changes', slug, artifact.generates);
    if (!existsSync(file)) return { ok: false, error: `${artifact.generates} not drafted yet — you approve what you read` };
    const text = readFileSync(file, 'utf8');
    if (!sectionHeadingPresent(text, section.id)) {
      return { ok: false, error: `${artifact.generates} has no '${section.id}' section yet — write it before granting` };
    }
    const unwritten = section.requiresWritten.filter((sib) => !sectionHeadingPresent(text, sib));
    if (unwritten.length > 0) {
      return { ok: false, error: `in sequence — write ${unwritten.map((s) => `'${s}'`).join(', ')} before granting ${artifact.id}/${section.id}` };
    }
    const ungranted = section.requiresApproval.filter((sib) => !approved.has(`${artifact.id}/${sib}`));
    if (ungranted.length > 0) {
      return { ok: false, error: `in sequence — grant '${artifact.id}/${ungranted[0]}' first: pios-gate grant ${slug} ${artifact.id}/${ungranted[0]}` };
    }
    const at = utcNowStamp();
    approved.add(rungId);
    writeChangeMeta(root, slug, {
      phases_approved: [...approved].join(','),
      [`granted_${rungId.replace('/', '_')}`]: at,
    });
    return { ok: true, granted: rungId, completed: false, at };
  }

  // artifact grant
  const index = schema.artifacts.findIndex((a) => a.id === rungId);
  if (index < 0) return { ok: false, error: `no artifact '${rungId}' in schema ${schema.name}` };
  if (approved.has(rungId)) return { ok: false, error: `artifact '${rungId}' already granted ${meta[`granted_${rungId}`] ?? ''}`.trim() };
  const predecessor = schema.artifacts.slice(0, index).find((a) => !approved.has(a.id));
  if (predecessor) {
    return { ok: false, error: `in sequence — grant '${predecessor.id}' first: ${grantHint(schema, predecessor.id, slug)}` };
  }
  const artifact = schema.artifacts[index];
  const file = join(root, 'changes', slug, artifact.generates);
  if (!existsSync(file)) {
    return { ok: false, error: `${artifact.generates} not drafted yet — you approve what you read` };
  }
  const text = readFileSync(file, 'utf8');
  const missing = [
    ...sectionTitles(artifact).filter((s) => !sectionHeadingPresent(text, s)),
    ...artifact.lines.filter((l) => !lineKeyPresent(text, l)),
  ];
  if (missing.length > 0) {
    return { ok: false, error: `${artifact.generates} missing declared structure: ${missing.join(' · ')}` };
  }
  const gatedSections = artifact.sections.filter((s) => s.requiresApproval.length > 0 && !approved.has(`${artifact.id}/${s.id}`));
  if (gatedSections.length > 0) {
    return {
      ok: false,
      error: `${artifact.generates} has gated sections awaiting grants: ${gatedSections.map((s) => `${artifact.id}/${s.id}`).join(' · ')} — grant: pios-gate grant ${slug} ${artifact.id}/${gatedSections[0].id}`,
    };
  }
  const at = utcNowStamp();
  approved.add(rungId);
  const values = { phases_approved: [...approved].join(','), [`granted_${rungId}`]: at };
  const completed = ladderComplete(schema, approved);
  if (completed) {
    const completing = schema.artifacts.find((a) => a.completes);
    Object.assign(values, { status: completing?.completes ?? 'approved', approved_at: at });
  }
  writeChangeMeta(root, slug, values);
  return { ok: true, granted: rungId, completed, verb: artifact.grantVerb, at };
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
    let humanWait = false;
    if (gated) {
      const schema = resolution.schema;
      const approved = phasesApprovedSet(meta);
      const verdictLine = schemaVerdictLine(schema);
      const counterArtifact = receiptArtifactFor(schema) ?? schema.artifacts[schema.artifacts.length - 1];
      const counterFile = join(changesDir, dir.name, counterArtifact.generates);
      if (existsSync(counterFile)) {
        const tasks = readFileSync(counterFile, 'utf8');
        open = (tasks.match(/^- \[ \]/gmu) ?? []).length;
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
    const approvedSuffix = meta.approved_at ? ` · approved ${meta.approved_at}` : '';

    if (gated && status !== 'approved') {
      const schema = resolution.schema;
      const approved = phasesApprovedSet(meta);
      const marks = schema.artifacts.map((a) => (approved.has(a.id) ? '✓' : existsSync(join(changesDir, dir.name, a.generates)) ? '◻' : '·')).join('');
      const nextIndex = schema.artifacts.findIndex((a) => !approved.has(a.id));
      let nextAct = '';
      if (nextIndex >= 0) {
        const next = schema.artifacts[nextIndex];
        const drafted = existsSync(join(changesDir, dir.name, next.generates));
        nextAct = drafted
          ? `  next: read ${next.generates} → grant: ${grantHint(schema, next.id, dir.name)}`
          : `  next: awaiting draft of ${next.generates} (artifact ${next.id})`;
      }
      rows.push(`${dir.name.padEnd(36)}[${schema.name}] ${marks} ${status}${approvedSuffix}\n${nextAct}`);
    } else {
      const legacyNeed =
        status !== 'approved'
          ? 'needs approve'
          : humanWait && !meta.validated
            ? 'needs confirm (verdict open)'
            : open > 0
              ? `${open} open steps`
              : 'ready to archive?';
      rows.push(`${dir.name.padEnd(36)}${status.padEnd(10)}${legacyNeed}${approvedSuffix}`);
    }
  }
  return rows.length === 0 ? 'nothing pending — no active changes' : rows.join('\n');
}

/** Verbose one-mission view: rungs, drafts, grants, structure, next act. */
export function showReport(root, slug) {
  const meta = readChangeMeta(root, slug);
  const resolution = resolveChangeSchema(root, meta.schema);
  if (!resolution.ok) {
    return [`mission: ${slug}`, `  schema: ${meta.schema ?? 'none'} (${resolution.reason})`, `  status: ${meta.status ?? 'no-meta'}`].join('\n');
  }
  const schema = resolution.schema;
  const approved = phasesApprovedSet(meta);
  const verdictLine = schemaVerdictLine(schema);
  const lines = [`mission: ${slug} · schema: ${schema.name} · status: ${meta.status ?? 'no-meta'}`];
  if (meta.phases_approved) lines.push(`phases_approved: ${meta.phases_approved}`);
  schema.artifacts.forEach((a, i) => {
    const file = join(root, 'changes', slug, a.generates);
    const drafted = existsSync(file);
    const granted = approved.has(a.id) ? `✓ granted ${meta[`granted_${a.id}`] ?? ''}`.trimEnd() : '◻ ungranted';
    const subGrants = a.sections
      .filter((s) => approved.has(`${a.id}/${s.id}`))
      .map((s) => `${a.id}/${s.id} ✓`);
    let structure = '';
    if (drafted && (a.sections.length > 0 || a.lines.length > 0)) {
      const text = readFileSync(file, 'utf8');
      const missing = [
        ...sectionTitles(a).filter((s) => !sectionHeadingPresent(text, s)),
        ...a.lines.filter((l) => !lineKeyPresent(text, l)),
      ];
      structure = missing.length > 0 ? ` · missing: ${missing.join(' · ')}` : ' · structure ✓';
    }
    lines.push(`  ${String(i + 1).padStart(2)} ${a.id.padEnd(13)} ${a.generates.padEnd(17)} ${drafted ? 'drafted' : '—'} · ${granted}${structure}`);
    if (subGrants.length > 0) lines.push(`     sections: ${subGrants.join(' · ')}`);
  });
  if (schemaIsGated(schema)) {
    const nextIndex = schema.artifacts.findIndex((a) => !approved.has(a.id));
    if (nextIndex >= 0) {
      const next = schema.artifacts[nextIndex];
      lines.push(
        existsSync(join(root, 'changes', slug, next.generates))
          ? `next human act: read ${next.generates} → grant: ${grantHint(schema, next.id, slug)}`
          : `next human act: awaiting draft of ${next.generates} (artifact ${next.id})`,
      );
    } else {
      lines.push(`ladder complete — ${meta.validated ? 'validated' : verdictLine ? `${verdictLine} pending` : 'no verdict declared'}`);
    }
  }
  return lines.join('\n');
}
