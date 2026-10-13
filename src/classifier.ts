/**
 * Mutation classifier — owned by this gate, exported for any future reader.
 *
 * Order of decision:
 *   1. tool annotations — readOnlyHint === true  → not mutating
 *   2. known tool names — read-only set / mutating set
 *   3. bash             → verb scan (mutating verbs, read-only verbs)
 *   4. anything else    → mutating (fail-safe: unknown = mutating)
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

const READ_ONLY_TOOLS = new Set(['read', 'grep', 'find', 'ls', 'skill', 'glob']);
const MUTATING_TOOLS = new Set(['edit', 'write', 'multi_edit', 'applypatch']);

const BASH_MUTATING_PATTERNS: readonly { pattern: RegExp; basis: string }[] = [
  { pattern: />>?|tee\b|\bsed\s+(-\w*\s+)*-i\b|\bpatch\b|\btruncate\b/u, basis: 'bash.write-redirect-or-inplace' },
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

const BASH_READ_ONLY_PATTERN =
  /(?:^|[;&|]\s*|\$\(\s*)(?:pwd|echo|printf|cat|head|tail|less|more|ls|ll|stat|file|which|command\s+-v|type|whoami|date|env|printenv|wc|sort|uniq|cut|awk|sed|tr|du|df|free|uname|id|grep|rg|ag|find|fd|tree|diff|cmp|basename|dirname|realpath|readlink|test|\[)\b/u;

const BASH_GIT_READ_ONLY = /\bgit\s+(?:status|diff|log|show|blame|ls-files|ls-remote|rev-parse|describe|reflog|shortlog|whatchanged|annotate)\b/u;

const BASH_OPENSPEC_READ_ONLY = /\bopenspec\s+(?:list|status|show|instructions|schemas|schema|context|validate)\b/u;

const OPENSPEC_CREATION = /\bopenspec\s+(?:new|init)\b/u;

function bashVerdict(command: string): MutationVerdict {
  if (OPENSPEC_CREATION.test(command)) {
    return { mutating: false, basis: 'bash.openspec-creation', creation: true };
  }
  if (BASH_OPENSPEC_READ_ONLY.test(command) || BASH_GIT_READ_ONLY.test(command)) {
    return { mutating: false, basis: 'bash.read-only-verb', creation: false };
  }
  for (const { pattern, basis } of BASH_MUTATING_PATTERNS) {
    if (pattern.test(command)) {
      return { mutating: true, basis, creation: false };
    }
  }
  if (BASH_READ_ONLY_PATTERN.test(command)) {
    return { mutating: false, basis: 'bash.read-only-verb', creation: false };
  }
  return { mutating: true, basis: 'bash.unknown=fail-safe', creation: false };
}

function commandOf(input: unknown): string {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return '';
  const command = (input as Record<string, unknown>).command;
  return typeof command === 'string' ? command : '';
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
): MutationVerdict {
  const tool = toolName.toLowerCase();
  if (annotations?.readOnlyHint === true) {
    return { mutating: false, basis: 'annotations.readOnlyHint', creation: false };
  }
  if (READ_ONLY_TOOLS.has(tool)) {
    return { mutating: false, basis: 'tool.known-read-only', creation: false };
  }
  if (MUTATING_TOOLS.has(tool)) {
    return { mutating: true, basis: `tool.known-mutating:${tool}`, creation: false };
  }
  if (tool === 'bash' || tool === 'shell') {
    const command = commandOf(input);
    if (!command) {
      return { mutating: true, basis: 'bash.empty-command=fail-safe', creation: false };
    }
    return bashVerdict(command);
  }
  return { mutating: true, basis: `tool.unknown=fail-safe:${tool}`, creation: false };
}
