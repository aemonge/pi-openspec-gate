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
 * Parsing is line-based (zero deps, house style): block scalars
 * (`instruction: |`) are skipped by indentation, artifacts are collected
 * in declaration order — that order IS the ladder. Flow lists
 * (`[a, b]`) and block lists (`- a` on following lines) both parse.
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export type PhaseArtifact = {
  id: string;
  /** filename relative to the change dir, e.g. "2-proposition.md" */
  generates: string;
  /** x-requires-approval — rung ids that must be granted before this drafts */
  requiresApproval: string[];
  /** x-sections — H2 headings the artifact may not be born without */
  sections: string[];
  /** x-lines — top-level `Key:` lines the artifact must carry */
  lines: string[];
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

function parseList(raw: string, blockItems: string[]): string[] {
  const flow = FLOW_LIST.exec(raw.trim());
  if (raw.trim().length > 0 && flow) {
    return flow[1]!.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }
  if (raw.trim().length > 0) return [raw.trim()];
  return blockItems.map((s) => s.trim()).filter((s) => s.length > 0);
}

/** Parse schema YAML into a MissionSchema; throws on structural violations. */
export function parseSchemaYaml(content: string, source: string): MissionSchema {
  const lines = content.split('\n');
  let name = '';
  const artifacts: PhaseArtifact[] = [];
  let current: PhaseArtifact | undefined;
  let pendingKey: string | undefined;
  let pendingBlockItems: string[] = [];

  const flushPending = () => {
    if (current && pendingKey) {
      const value = parseList('', pendingBlockItems);
      if (pendingKey === 'x-requires-approval') current.requiresApproval = value;
      else if (pendingKey === 'x-sections') current.sections = value;
      else if (pendingKey === 'x-lines') current.lines = value;
    }
    pendingKey = undefined;
    pendingBlockItems = [];
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
      if (pendingKey) {
        pendingBlockItems.push(entry[1]!.trim()); // block-list item of a pending x- key
        continue;
      }
      const rest = KEY_LINE.exec(entry[1]!.trim());
      if (rest && rest[1] === 'id') {
        flushPending();
        current = { id: rest[2]!.trim(), generates: '', requiresApproval: [], sections: [], lines: [] };
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
      current = { id: '', generates: '', requiresApproval: [], sections: [], lines: [] }; // sentinel until first entry
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
        const value = parseList(v, []);
        if (k === 'x-requires-approval') current.requiresApproval = value;
        else if (k === 'x-sections') current.sections = value;
        else current.lines = value;
      } else {
        pendingKey = k; // block list items follow
      }
      continue;
    }
    // stray list items with no pending key are ignored
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

/** True when any artifact declares a gate — verbs and guards activate only then. */
export function schemaIsGated(schema: MissionSchema): boolean {
  return schema.artifacts.some((a) => a.requiresApproval.length > 0);
}

/** Ladder complete when every declared rung bears a grant (order enforced elsewhere). */
export function ladderComplete(schema: MissionSchema, approved: ReadonlySet<string>): boolean {
  return schema.artifacts.every((a) => approved.has(a.id));
}

/** Grant verbs, positional: propose stamps rung 1 … execute stamps rung 5. */
export const GRANT_VERBS = ['propose', 'deal', 'plan', 'order', 'execute'] as const;
export type GrantVerb = (typeof GRANT_VERBS)[number];

export function rungForGrantVerb(schema: MissionSchema, verb: GrantVerb): PhaseArtifact | undefined {
  const index = GRANT_VERBS.indexOf(verb);
  if (index < 0) return undefined;
  return schema.artifacts[index];
}
