/**
 * gate-lib — plain-JS core for the terminal CLIs (no TypeScript: node
 * refuses type-stripping inside node_modules, so npm-installed bins must
 * be runnable as plain JS).
 *
 * Meta format contract: flat `key: value` lines — the same format
 * src/approval.ts reads/writes; the contract test in pios-wrapper.test.ts
 * proves the two implementations agree.
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

// ── phase gates ────────────────────────────────────────────────────────
// Plain-JS mirrors of src/schema.ts (contract-tested): the schema reader,
// the grant ladder, and the structure checkers the CLI shares with the
// session guard.

export const GRANT_VERBS = ['propose', 'deal', 'plan', 'order', 'execute'];

const KEY_LINE = /^([A-Za-z_][\w-]*):\s*(.*)$/u;
const ARTIFACT_ENTRY = /^-\s+(.*)$/u;
const FLOW_LIST = /^\[(.*)\]$/u;

function parseListValue(raw, blockItems) {
  const flow = FLOW_LIST.exec(raw.trim());
  if (raw.trim().length > 0 && flow) {
    return flow[1].split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }
  if (raw.trim().length > 0) return [raw.trim()];
  return blockItems.map((s) => s.trim()).filter((s) => s.length > 0);
}

export function parseSchemaYaml(content, source) {
  const lines = content.split('\n');
  let name = '';
  const artifacts = [];
  let current;
  let pendingKey;
  let pendingBlockItems = [];
  let inBlockScalar = false;
  let blockIndent = -1;

  const flushPending = () => {
    if (current && pendingKey) {
      const value = parseListValue('', pendingBlockItems);
      if (pendingKey === 'x-requires-approval') current.requiresApproval = value;
      else if (pendingKey === 'x-sections') current.sections = value;
      else if (pendingKey === 'x-lines') current.lines = value;
    }
    pendingKey = undefined;
    pendingBlockItems = [];
  };

  for (const line of lines) {
    const indent = line.length - line.trimStart().length;
    if (inBlockScalar) {
      if (line.trim().length === 0 || indent > blockIndent) continue;
      inBlockScalar = false;
    }
    if (line.trim().length === 0) continue;

    const entry = ARTIFACT_ENTRY.exec(line.trimStart());
    if (entry) {
      if (pendingKey) {
        pendingBlockItems.push(entry[1].trim());
        continue;
      }
      const rest = KEY_LINE.exec(entry[1].trim());
      if (rest && rest[1] === 'id') {
        flushPending();
        current = { id: rest[2].trim(), generates: '', requiresApproval: [], sections: [], lines: [] };
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
      current = { id: '', generates: '', requiresApproval: [], sections: [], lines: [] };
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
    if (k === 'x-requires-approval' || k === 'x-sections' || k === 'x-lines') {
      flushPending();
      if (v.trim().length > 0) {
        const value = parseListValue(v, []);
        if (k === 'x-requires-approval') current.requiresApproval = value;
        else if (k === 'x-sections') current.sections = value;
        else current.lines = value;
      } else {
        pendingKey = k;
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
  }
  return { name, artifacts: real };
}

function configDir() {
  return process.env.OPENSPEC_CONFIG_DIR ?? process.env.XDG_CONFIG_HOME ?? join(homeDir(), '.config');
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

export function schemaIsGated(schema) {
  return schema.artifacts.some((a) => a.requiresApproval.length > 0);
}

export function ladderComplete(schema, approvedSet) {
  return schema.artifacts.every((a) => approvedSet.has(a.id));
}

export function rungForGrantVerb(schema, verb) {
  const index = GRANT_VERBS.indexOf(verb);
  if (index < 0) return undefined;
  return schema.artifacts[index];
}

export function sectionHeadingPresent(text, section) {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`^#{2,}\\s*${escaped}\\s*$`, 'mu').test(text);
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

/** Stamp one rung: strict order, file must exist, declared structure must
 *  be present. Returns { ok, granted, completed } or { ok: false, error }. */
export function grantRung(root, slug, rungId) {
  const meta = readChangeMeta(root, slug);
  const resolution = resolveChangeSchema(root, meta.schema);
  if (!resolution.ok || !schemaIsGated(resolution.schema)) {
    return { ok: false, error: `schema declares no gates (${resolution.ok ? resolution.schema.name : resolution.reason}) — use: pios-gate approve ${slug}` };
  }
  const schema = resolution.schema;
  const index = schema.artifacts.findIndex((a) => a.id === rungId);
  if (index < 0) return { ok: false, error: `no rung '${rungId}' in schema ${schema.name}` };
  const approved = phasesApprovedSet(meta);
  if (approved.has(rungId)) return { ok: false, error: `rung '${rungId}' already granted ${meta[`granted_${rungId}`] ?? ''}`.trim() };
  const predecessor = schema.artifacts.slice(0, index).find((a) => !approved.has(a.id));
  if (predecessor) {
    const verb = GRANT_VERBS[schema.artifacts.indexOf(predecessor)] ?? 'approve';
    return { ok: false, error: `strict order — grant '${predecessor.id}' first: pios-gate ${verb} ${slug}` };
  }
  const artifact = schema.artifacts[index];
  const file = join(root, 'changes', slug, artifact.generates);
  if (!existsSync(file)) {
    return { ok: false, error: `${artifact.generates} not drafted yet — you approve what you read` };
  }
  const text = readFileSync(file, 'utf8');
  const missing = [
    ...artifact.sections.filter((s) => !sectionHeadingPresent(text, s)),
    ...artifact.lines.filter((l) => !lineKeyPresent(text, l)),
  ];
  if (missing.length > 0) {
    return { ok: false, error: `${artifact.generates} missing declared structure: ${missing.join(' · ')}` };
  }
  const at = utcNowStamp();
  approved.add(rungId);
  const values = { phases_approved: [...approved].join(','), [`granted_${rungId}`]: at };
  const completed = ladderComplete(schema, approved);
  if (completed) Object.assign(values, { status: 'approved', approved_at: at });
  writeChangeMeta(root, slug, values);
  return { ok: true, granted: rungId, completed, verb: GRANT_VERBS[index] ?? 'approve', at };
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

    let rungLine = '';
    let nextAct = '';
    if (gated) {
      const schema = resolution.schema;
      const approved = phasesApprovedSet(meta);
      const marks = schema.artifacts.map((a) => (approved.has(a.id) ? '✓' : existsSync(join(changesDir, dir.name, a.generates)) ? '◻' : '·')).join('');
      const nextIndex = schema.artifacts.findIndex((a) => !approved.has(a.id));
      const ladder = `[${schema.name}] ${marks} ${status}`;
      if (nextIndex >= 0) {
        const next = schema.artifacts[nextIndex];
        const verb = GRANT_VERBS[nextIndex] ?? 'approve';
        const drafted = existsSync(join(changesDir, dir.name, next.generates));
        nextAct = drafted
          ? `  next: read ${next.generates} → grant: pios-gate ${verb} ${dir.name}`
          : `  next: awaiting draft of ${next.generates} (rung ${next.id})`;
      }
      rungLine = `${ladder}\n${nextAct}`;
    }

    const counterFile = gated
      ? join(changesDir, dir.name, resolution.schema.artifacts[resolution.schema.artifacts.length - 1].generates)
      : join(changesDir, dir.name, '4-tasks.md');
    let open = 0;
    let humanWait = false;
    if (existsSync(counterFile)) {
      const tasks = readFileSync(counterFile, 'utf8');
      open = (tasks.match(/^- \[ \]/gmu) ?? []).length;
      humanWait = /^- \[ \][^\n]*Human validation/mu.test(tasks);
    }
    const approvedSuffix = meta.approved_at ? ` · approved ${meta.approved_at}` : '';
    if (gated && status !== 'approved') {
      rows.push(`${dir.name.padEnd(36)}${rungLine}${approvedSuffix}`);
    } else {
      const legacyNeed =
        status !== 'approved'
          ? 'needs approve'
          : humanWait && !meta.validated
            ? 'needs confirm (human-validation step open)'
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
  const lines = [`mission: ${slug} · schema: ${schema.name} · status: ${meta.status ?? 'no-meta'}`];
  if (meta.phases_approved) lines.push(`phases_approved: ${meta.phases_approved}`);
  schema.artifacts.forEach((a, i) => {
    const file = join(root, 'changes', slug, a.generates);
    const drafted = existsSync(file);
    const granted = approved.has(a.id) ? `✓ granted ${meta[`granted_${a.id}`] ?? ''}`.trimEnd() : '◻ ungranted';
    let structure = '';
    if (drafted && (a.sections.length > 0 || a.lines.length > 0)) {
      const text = readFileSync(file, 'utf8');
      const missing = [
        ...a.sections.filter((s) => !sectionHeadingPresent(text, s)),
        ...a.lines.filter((l) => !lineKeyPresent(text, l)),
      ];
      structure = missing.length > 0 ? ` · missing: ${missing.join(' · ')}` : ' · structure ✓';
    }
    lines.push(`  ${String(i + 1).padStart(2)} ${a.id.padEnd(13)} ${a.generates.padEnd(17)} ${drafted ? 'drafted' : '—'} · ${granted}${structure}`);
  });
  if (schemaIsGated(schema)) {
    const nextIndex = schema.artifacts.findIndex((a) => !approved.has(a.id));
    if (nextIndex >= 0) {
      const next = schema.artifacts[nextIndex];
      lines.push(
        existsSync(join(root, 'changes', slug, next.generates))
          ? `next human act: read ${next.generates} → grant: pios-gate ${GRANT_VERBS[nextIndex] ?? 'approve'} ${slug}`
          : `next human act: awaiting draft of ${next.generates} (rung ${next.id})`,
      );
    } else {
      lines.push(`ladder complete — ${meta.validated ? 'validated' : 'Human validation pending'}`);
    }
  }
  return lines.join('\n');
}
