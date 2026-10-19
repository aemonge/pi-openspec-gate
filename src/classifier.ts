/**
 * Mutation classifier — owned by this gate, exported for any future reader.
 *
 * Order of decision:
 *   1. tool annotations — readOnlyHint === true  → not mutating
 *   2. known tool names — read-only set / mutating set / config read-only set
 *   3. lsp_fix          → input-aware (write !== true = preview, not mutating)
 *   4. bash|shell|powershell → segment split (conjunction): every segment
 *      must independently classify read-only or creation; mutating-anywhere
 *      beats read-only-anywhere; unknown grammar fails safe
 *   5. anything else    → mutating (fail-safe: unknown = mutating)
 *
 * Research instruments (web, docs, graph reads, memory reads) are *known*
 * read-only tools, not judgments: the fail-safe stays untouched for
 * genuinely unknown tools. No tool in the current ecosystem declares
 * annotations, so the known sets + config are the live mechanism.
 *
 * openspec change creation (`openspec new` / `openspec init`) is classified
 * as creation, not an unaccounted mutation: creating a change is the act of
 * entering the ladder and is never gated (plan: light-change flow, later
 * slice — creation must not block entry into declaredness).
 */

export type MutationVerdict = {
  mutating: boolean;
  /** Human-readable basis, recorded on facts. Never fuzzy. */
  basis: string;
  /** true when the call is ladder entry (openspec new/init), skipped by the gate. */
  creation: boolean;
};

const READ_ONLY_TOOLS = new Set([
  // Pi core
  'read',
  'grep',
  'find',
  'ls',
  // research instruments: web (pi-web-agent), docs (context7), lsp reads,
  // Engram memory reads (gentle-engram)
  'web_explore',
  'web_search',
  'web_fetch',
  'resolve-library-id',
  'query-docs',
  'lsp_diagnostics',
  'mem_search',
  'mem_context',
  'mem_get_observation',
  'mem_timeline',
  'mem_stats',
  'mem_list_projects',
  'mem_current_project',
  'mem_doctor',
  'mem_review',
]);
const MUTATING_TOOLS = new Set(['edit', 'write']);

// Mutating patterns come in two tiers.
//
// OPERATOR tier — mutation operators detectable locally (redirects,
// in-place edits): checked in EVERY segment, even verb-anchored reads —
// this is what catches `git status > out.txt`, which the old anywhere-
// escapes let pass (they preempted even the redirect scan).
//
// COMMAND tier — mutating command words (rm, npm install, git commit…):
// checked only when the segment's verb did NOT anchor as a known read-only
// verb. A read verb's arguments are data, not commands: `graphify query
// "install flow"` and `git log --grep rm` must pass (same precedent the
// old early-escape served, without the preemption hole).
const BASH_OPERATOR_PATTERNS: readonly { pattern: RegExp; basis: string }[] = [
  // A `>` is a write only when it targets a real sink: fd-redirects to
  // /dev/null and fd duplication (2>&1) discard or shuffle streams; every
  // other >, >>, 2>, &> writes a file.
  {
    pattern: /(?<![\d>])(?:\d)?>>?(?!\s*(?:\/dev\/null|&\d|>))|tee\b|\bsed\s+(-\w*\s+)*-i\b|\bpatch\b|\btruncate\b/u,
    basis: 'bash.write-redirect-or-inplace',
  },
];

const BASH_COMMAND_PATTERNS: readonly { pattern: RegExp; basis: string }[] = [
  { pattern: /\b(?:rm|rmdir|unlink|shred)\b/u, basis: 'bash.remove' },
  { pattern: /\b(?:mv|cp|rsync|install|ln)\s/u, basis: 'bash.move-copy-link' },
  { pattern: /\b(?:mkdir|touch|mknod)\b/u, basis: 'bash.create-filesystem' },
  { pattern: /\b(?:chmod|chown|chgrp|setfacl|attr)\b/u, basis: 'bash.permissions' },
  { pattern: /\bgit\s+(?:commit|push|merge|rebase|reset|revert|checkout|restore|clean|stash|apply|am|cherry-pick|tag|branch|switch|worktree\s+add|submodule\s+(?:add|update))\b/u, basis: 'bash.git-mutation' },
  { pattern: /\b(?:npm|pnpm|yarn|bun)\s+(?:i|install|add|remove|rm|un|uninstall|update|upgrade|link|unlink|ci|create|init|exec|run\s+(?:\w+:)?(?!.*(check|lint|test|typecheck)))\b/u, basis: 'bash.package-manager-mutation' },
  { pattern: /\b(?:cargo|go|pip\d?|python3?\s+-m\s+pip|uv)\s+(?:add|install|remove|uninstall|build|init|new)\b/u, basis: 'bash.toolchain-mutation' },
  { pattern: /\bopenspec\s+(?:update|archive|delete|remove)\b/u, basis: 'bash.openspec-mutation' },
  { pattern: /\b(?:kill|pkill|killall|reboot|shutdown|systemctl\s+(?:start|stop|restart|disable|enable))\b/u, basis: 'bash.process-or-service-mutation' },
  { pattern: /\bcurl\b[^\n]*\b(?:-X\s*(?:POST|PUT|PATCH|DELETE)|--upload-file|-T\s|-d\s|--data)/u, basis: 'bash.http-write' },
];

// Segment-anchored read-only verbs — the verb must lead its segment
// (after VAR=value stripping). The old anywhere-anchored escapes let one
// clean verb launder the rest of a compound command; conjunction closed
// that (per-segment-bash-classification). Quoted program text (sed, awk)
// cannot trip anything: quotes are opaque to the splitter.
const READ_ONLY_VERB_ANCHORED =
  /^(?:pwd|echo|printf|cat|head|tail|less|more|ls|ll|stat|file|which|command\s+-v|type|whoami|date|env|printenv|wc|sort|uniq|cut|awk|sed|tr|du|df|free|uname|id|grep|rg|ag|find|fd|tree|diff|cmp|basename|dirname|realpath|readlink|test|\[)\b/u;

const GIT_READ_ONLY_ANCHORED = /^git\s+(?:status|diff|log|show|blame|ls-files|ls-remote|rev-parse|describe|reflog|shortlog|whatchanged|annotate)\b/u;

const OPENSPEC_READ_ONLY_ANCHORED = /^openspec\s+(?:list|status|show|instructions|schemas|schema|context|validate)\b/u;

// graphify reads: the knowledge-graph CLI's query surface, anchored like
// every other verb. Mutating verbs (update, add, watch, merge-graphs,
// cluster-only, hook install, bare `graphify .`) stay fail-safe/attributed.
const GRAPHIFY_READ_ONLY_ANCHORED = /^graphify\s+(?:query|path|explain|hook\s+status)\b/u;

const OPENSPEC_CREATION_ANCHORED = /^openspec\s+(?:new|init)\b/u;

// Leading VAR=value tokens are stripped before the verb anchors —
// ergonomics only (LC_ALL=C sort): the verb after them is still fully
// checked.
const ASSIGNMENT_PREFIX = /^(?:[A-Za-z_]\w*=(?:"[^"]*"|'[^']*'|[^\s'"]+)\s+)+/u;

function stripAssignments(segment: string): string {
  return segment.replace(ASSIGNMENT_PREFIX, '');
}

export type SplitResult = {
  segments: string[];
  /** true when the command uses grammar the splitter refuses to interpret */
  grammarUnsafe: boolean;
};

/**
 * Split a shell command into segments on unquoted `;` `&&` `||` `|` `&`
 * and newlines. Single/double quotes are opaque (nothing inside splits or
 * trips); backslash escapes its next char (line continuations included);
 * `#` comments (word-start only) skip to newline; `&` never separates
 * redirect grammar (`2>&1`, `&>`, `>&`); `$( ` `<(` `>(` `<<` and unbalanced
 * quotes mark the command grammar-unsafe. Conservative by construction:
 * what it cannot interpret, it refuses to pass.
 */
export function splitSegments(command: string): SplitResult {
  const segments: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let grammarUnsafe = false;

  const push = () => {
    const trimmed = current.trim();
    if (trimmed) segments.push(trimmed);
    current = '';
  };

  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i]!;
    const next = command[i + 1] ?? '';

    if (inSingle) {
      if (ch === "'") inSingle = false;
      current += ch;
      continue;
    }
    if (inDouble) {
      if (ch === '\\') {
        current += ch + next;
        i += 1;
        continue;
      }
      if (ch === '"') inDouble = false;
      current += ch;
      continue;
    }

    switch (ch) {
      case '\\': // escape: consume the next char verbatim
        current += ch + next;
        i += 1;
        continue;
      case "'":
        inSingle = true;
        current += ch;
        continue;
      case '"':
        inDouble = true;
        current += ch;
        continue;
      case '#':
        // comment only at word start (preceded by whitespace/nothing)
        if (current === '' || /\s$/.test(current)) {
          const nl = command.indexOf('\n', i);
          i = nl === -1 ? command.length : nl - 1;
          continue;
        }
        current += ch;
        continue;
      case ';':
        push();
        continue;
      case '&':
        // redirect grammar: &> / >& / 2>&1 never separate
        if (next === '>' || />\s*$/.test(current)) {
          current += ch;
          continue;
        }
        if (next === '&') i += 1; // &&
        push();
        continue;
      case '|':
        if (next === '|') i += 1; // ||
        push();
        continue;
      case '\n':
        push();
        continue;
      case '$':
        if (next === '(') grammarUnsafe = true;
        current += ch;
        continue;
      case '`':
        grammarUnsafe = true;
        current += ch;
        continue;
      case '<':
        if (next === '(' || next === '<') grammarUnsafe = true;
        current += ch;
        continue;
      case '>':
        if (next === '(') grammarUnsafe = true;
        current += ch;
        continue;
      default:
        current += ch;
    }
  }
  if (inSingle || inDouble) grammarUnsafe = true;
  push();
  return { segments, grammarUnsafe };
}

// Wrapper normalization — `pios-gate …` / `pi-openspec-gate …` (optionally
// behind a path like `./bin/`) is the gate's feature-extension surface: the
// wrapper forwards to openspec, so its subcommands classify exactly like
// the bare forms. Per segment, so compounds work too. The approval verbs
// never get this far in a gated session (touch guard blocks them first).
const WRAPPER_TOKEN = /^(?:[^\s]*\/)?(?:pios-gate|pi-openspec-gate)(?:\.\w+)?\s+/u;

function stripWrapper(segment: string): string {
  return WRAPPER_TOKEN.test(segment) ? segment.replace(WRAPPER_TOKEN, 'openspec ') : segment;
}

function bashVerdict(command: string): MutationVerdict {
  const { segments, grammarUnsafe } = splitSegments(command);
  if (grammarUnsafe) {
    return { mutating: true, basis: 'bash.grammar=fail-safe', creation: false };
  }
  let creation = false;
  for (const segment of segments) {
    for (const { pattern, basis } of BASH_OPERATOR_PATTERNS) {
      if (pattern.test(segment)) {
        return { mutating: true, basis, creation: false };
      }
    }
    const body = stripAssignments(stripWrapper(segment));
    if (OPENSPEC_CREATION_ANCHORED.test(body)) {
      creation = true;
      continue;
    }
    const readVerbed =
      READ_ONLY_VERB_ANCHORED.test(body) ||
      GIT_READ_ONLY_ANCHORED.test(body) ||
      OPENSPEC_READ_ONLY_ANCHORED.test(body) ||
      GRAPHIFY_READ_ONLY_ANCHORED.test(body);
    if (readVerbed) continue; // read verb: arguments are data, not commands
    for (const { pattern, basis } of BASH_COMMAND_PATTERNS) {
      if (pattern.test(body)) {
        return { mutating: true, basis, creation: false };
      }
    }
    return { mutating: true, basis: 'bash.unknown=fail-safe', creation: false };
  }
  if (creation) {
    return { mutating: false, basis: 'bash.openspec-creation', creation: true };
  }
  return { mutating: false, basis: 'bash.read-only-verb', creation: false };
}

function commandOf(input: unknown): string {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return '';
  const command = (input as Record<string, unknown>).command;
  return typeof command === 'string' ? command : '';
}

function wantsWrite(input: unknown): boolean {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return false;
  return (input as Record<string, unknown>).write === true;
}

export type ToolAnnotations = {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
};

export function classifyMutation(
  toolName: string,
  input: unknown,
  annotations?: ToolAnnotations,
  extraReadOnlyTools?: ReadonlySet<string>,
): MutationVerdict {
  const tool = toolName.toLowerCase();
  if (annotations?.readOnlyHint === true) {
    return { mutating: false, basis: 'annotations.readOnlyHint', creation: false };
  }
  if (READ_ONLY_TOOLS.has(tool)) {
    return { mutating: false, basis: 'tool.known-read-only', creation: false };
  }
  if (extraReadOnlyTools?.has(tool)) {
    return { mutating: false, basis: 'tool.config-read-only', creation: false };
  }
  if (MUTATING_TOOLS.has(tool)) {
    return { mutating: true, basis: `tool.known-mutating:${tool}`, creation: false };
  }
  if (tool === 'lsp_fix') {
    // Input-aware: lsp_fix previews by default (write: false); only an
    // explicit write:true mutates files.
    return wantsWrite(input)
      ? { mutating: true, basis: 'tool.lsp-fix-write', creation: false }
      : { mutating: false, basis: 'tool.lsp-fix-preview', creation: false };
  }
  if (tool === 'bash' || tool === 'shell' || tool === 'powershell') {
    const command = commandOf(input);
    if (!command) {
      return { mutating: true, basis: 'bash.empty-command=fail-safe', creation: false };
    }
    return bashVerdict(command);
  }
  return { mutating: true, basis: `tool.unknown=fail-safe:${tool}`, creation: false };
}
