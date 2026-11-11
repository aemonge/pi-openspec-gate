/**
 * The gate — one tool_call handler, the law of disjoint questions:
 * another layer owns permission; this gate owns declaredness.
 *
 * Decision order for every mutating call:
 *   1. exempt?    (path-scoped, every target path covered) → record fact, pass
 *   2. focused?   (this session or inherited from parent)  → attribute, pass
 *   3. declared?  (a schema-declared phrase in the human's own message — assistant text never declares; latch consumed) → debt line, pass
 *   4. otherwise  → block, exact copy, all three remedies
 * Creation commands (openspec new/init) pass ungated.
 * Handler failure blocks the call as a fail-safe.
 */
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { existsSync as exists } from 'node:fs';
import { dirname, join } from 'node:path';

import { appendDebtLine, appendAttributionReceipt } from './attribution.ts';
import {
  changeIsApproved,
  changeMetaPath,
  grantedSet,
  readChangeMeta,
  writeChangeMeta,
} from './approval.ts';
import { classifyMutation } from './classifier.ts';
import type { GateConfig } from './config.ts';
import { FACT, utcNow, type FactAppender } from './facts.ts';
import {
  findOpenspecRoot,
  findSessionFile,
  focusIsActive,
  parseDelegationEnv,
  readFocusFromSessionFile,
  readRoomFocus,
  readSessionFocus,
  hasActiveChanges,
  type ActiveFocus,
} from './focus.ts';
import { extractPaths } from './paths.ts';
import { matchExemption } from './exemptions.ts';
import {
  artifactForFilename,
  capabilityUnlocked,
  receiptArtifactFor,
  resolveChangeSchema,
  scanDeclares,
  schemaIsGated,
  schemaVerdictLine,
  scanSchemaNames,
  sectionTitles,
  writesUnlocked,
  type Schema,
} from './schema.ts';

/** The unaccounted block — agent-facing by construction: a stop directive
 *  opens it (the refusal is final; a flailing agent burns turns debugging a
 *  terminal block), every remedy names its exact instrument (the gate reads
 *  one focus entry type — a guessed cockpit/status tool satisfies nothing;
 *  the create remedy names the resolvable schemas, not a placeholder;
 *  the declare remedy names the SPEAKER — relay to the human, whose reply
 *  says one of the exact x-declares phrases, because an assistant's own
 *  message never declares — live-caught 2026-10-27 ×2: a cold agent read
 *  the old agent-addressed "say …" as its own instruction and parsed
 *  "human words only" as a style note, retrying the phrase unbolded), a
 *  why-line names the offending bash segment (one unclassifiable segment
 *  in a read-only chain must not read as "every shell call is refused"),
 *  remedies are state-aware (nothing focusable → no focus line; no
 *  declared phrases → no declare line; no resolvable schemas →
 *  placeholder), and subagent sessions get a relay-upward line (focus is
 *  inherited, never self-served). The same builder carries the
 *  research-window variants — one remedy language everywhere. */
export function blockUnaccounted(options?: {
  headline?: string;
  lead?: string;
  subagent?: boolean;
  focusable?: boolean;
  schemas?: string[];
  declares?: string[];
  offender?: string;
  /** the focus names a change that left changes/ (archived, removed) */
  dangling?: string;
}): string {
  const lines = [
    options?.headline ?? '⛔ unaccounted mutation — no active change',
    '   stop:    this refusal is final — do not retry, do not investigate; act on one remedy or relay them to the human',
  ];
  if (options?.lead) {
    lines.push(`   ${options.lead}`);
  }
  if (options?.offender) {
    lines.push(`   why:     segment '${options.offender}' is not classified read-only — read-only commands still pass`);
  }
  if (options?.focusable !== false) {
    lines.push('   focus:   openspec_focus → action: set, change: <slug>   (a change that exists in openspec/changes/)');
  }
  if (options?.dangling) {
    lines.push(`   dangling: focused change '${options.dangling}' was archived or removed — re-aim focus at a live change`);
  }
  const schemaName =
    options?.schemas && options.schemas.length > 0 ? options.schemas.join('|') : '<schema-name>';
  lines.push(`   create:  openspec new change <slug> --schema ${schemaName}`);
  const phrases = [...(options?.declares ?? [])].sort();
  if (phrases.length > 0) {
    lines.push(
      `   declare: relay to the human — their reply says one of ${phrases.map((p) => `"${p}"`).join(' · ')} (an assistant's own message never declares); recorded as declared work, proceeds`,
    );
  }
  if (options?.subagent) {
    lines.push('   subagent: focus is inherited from your parent session — relay this block upward, do not self-serve');
  }
  return lines.join('\n');
}

export const BLOCK_MESSAGE = blockUnaccounted();

export const BLOCK_APPROVAL_TOUCH = [
  '⛔ approval is human-terminal only',
  '   the assistant cannot approve or validate — ask the human',
].join('\n');

export const BLOCK_HUMANGATE = [
  '⛔ human-validation flip requires a human act',
  '   tick it yourself — your hand, your file — or reply literally: VALID',
  '   then: eospec close',
].join('\n');

export const BLOCK_ARCHIVE = [
  '⛔ archive requires an approved change',
  '   the human closes it: eospec close   ← your terminal',
  '   or pass --i-am-the-human',
].join('\n');

export const BLOCK_UNAPPROVED = [
  '⛔ focused change is not approved — attribution is not approval',
  '   advance: eospec approve   ← your terminal',
  '   docs:    openspec/** stays exempt — drafting is never blocked',
].join('\n');

export function blockArtifactApproval(slug: string, missing: string[]): string {
  const grant = `eospec approve`;
  return [
    `⛔ phase gate — ${missing.join(', ')} not granted yet`,
    `   grant:   ${grant}   ← your terminal`,
    '   docs:    the schema gates this artifact (x-requires-approval)',
  ].join('\n');
}

/** The advance command for a gated change: the human verb itself. */
export function advanceCommand(schema: Schema, approved: Set<string>, slug: string): string | undefined {
  const nextRung = schema.artifacts.find((a) => !approved.has(a.id));
  if (!nextRung) return undefined;
  return `eospec approve`;
}

/** State-aware archive block: a gated change is advanced by its own act.
 *  Falls back to the completion copy once everything is granted
 *  (completion lag). */
export function blockArchiveState(slug: string, schema: Schema, approved: Set<string>): string {
  const advance = advanceCommand(schema, approved, slug);
  if (!advance) return BLOCK_ARCHIVE;
  return [
    '⛔ archive requires an approved change',
    `   advance: ${advance}   ← your terminal`,
    '   or pass --i-am-the-human',
  ].join('\n');
}

/** State-aware unapproved block, same law as blockArchiveState. */
export function blockUnapprovedState(slug: string, schema: Schema, approved: Set<string>): string {
  const advance = advanceCommand(schema, approved, slug);
  if (!advance) return BLOCK_UNAPPROVED;
  return [
    '⛔ focused change is not approved — attribution is not approval',
    `   advance: ${advance}   ← your terminal`,
    '   docs:    openspec/** stays exempt — drafting is never blocked',
  ].join('\n');
}

export function blockArtifactSections(filename: string, missing: string[]): string {
  return [
    `⛔ phase gate — ${filename} is missing declared structure`,
    `   missing: ${missing.join(' · ')}`,
    '   add it — the grant will refuse to stamp until it exists',
  ].join('\n');
}

export function blockArtifactWritten(filename: string, missing: string[]): string {
  return [
    `⛔ phase gate — ${filename} awaits declared evidence`,
    `   missing: ${missing.join(' · ')}`,
    '   draft those first — the schema declares the creation sequence (x-requires-written)',
  ].join('\n');
}

export function blockResearchWindow(slug: string, grantCommand: string): string {
  return [
    `⛔ research window closed — '${slug}' has not reached its research step`,
    `   grant:   ${grantCommand}   ← your terminal`,
    '   the schema declares when research opens (x-unlocks: [research])',
  ].join('\n');
}

/** A human declaration latches exactly one declared mutation. The
 *  vocabulary is data: only x-declares phrases of resolvable schemas
 *  latch — and only from user messages; assistant text never declares,
 *  but a phrase in an assistant message is NOTICED (below) so the next
 *  block can correct the attempt instead of leaving the agent to guess
 *  at formatting. */
const DECLARE_MAX_LENGTH = 200;
const SELF_DECLARE_MAX_LENGTH = 2000;

const declareCache = new Map<string, RegExp | null>();
function declarePhrases(openspecRoot: string): RegExp | null {
  if (declareCache.has(openspecRoot)) return declareCache.get(openspecRoot) ?? null;
  const phrases = [...scanDeclares(openspecRoot)];
  let pattern: RegExp | null = null;
  if (phrases.length > 0) {
    const alternation = phrases
      .sort((a, b) => b.length - a.length)
      .map((p) => p.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
      .join('|');
    pattern = new RegExp(`\\b(?:${alternation})\\b`, 'iu');
  }
  declareCache.set(openspecRoot, pattern);
  return pattern;
}

/** Research instruments the `research` capability class gates. Defaults:
 *  the web/docs tool set; config `unlocks.research` replaces either side
 *  (tools + bash command verbs like graphify, wget). */
const RESEARCH_TOOLS_DEFAULT = new Set(['web_explore', 'web_search', 'web_fetch', 'resolve-library-id', 'query-docs']);

function researchCallMatches(toolName: string, bashCommand: string, config: GateConfig): boolean {
  const conf = config.unlocks?.research;
  const tools = conf?.tools ? new Set(conf.tools) : RESEARCH_TOOLS_DEFAULT;
  if (tools.has(toolName)) return true;
  const verbs = conf?.commands ?? [];
  if (bashCommand.length > 0 && verbs.length > 0) {
    const first = bashCommand.trim().split(/\s+/u)[0] ?? '';
    return verbs.some((v) => first === v);
  }
  return false;
}

/** A literal "VALID" reply latches exactly one human-gate flip. */
const VALID_PATTERN = /\bVALID\b/u;
const VALID_MAX_LENGTH = 200;

/** A literal human pause/resume latches the session permit. Duration
 *  grammar X{h,m,s} is MANDATORY — the word is the law: pause, never
 *  stop ("pause 999h" clamps to the configured ceiling). The latch is
 *  human-reply only, exactly like the VALID latch above it. */
const PAUSE_PATTERN = /\b(?:eospec\s+|pios-gate\s+)?pause\s+(\d+)\s*(h|m|s)\b/i;
const RESUME_PATTERN = /\b(?:eospec\s+|pios-gate\s+)?resume\b/i;
const PAUSE_CEILING_DEFAULT = 4 * 3_600_000;

/** Any tool-call attempt to reach the approval surface — blocked before
 *  all else. Reserved surface: eospec approve|close — the gate's own
 *  human verbs — plus pause|resume (arming a yield is a human act too).
 *  The migration-window bin name pios-gate stays guarded for the same
 *  verbs until the package cut kills it, as does the old package bin's
 *  approve|validate. The declared-verb scan died with the verb zoo
 *  (human ruling 2026-11-10).
 *  `eospec -- validate` forwards to openspec's structure lint and is NOT
 *  touch-guarded. */
const APPROVAL_TOUCH_RESERVED =
  /(?:\b(?:eospec|pios-gate)(?:\.\w+)?\s+(?:approve|close|pause|resume)|\bpi-openspec-gate(?:\.\w+)?\s+(?:approve|validate))\b/u;
const ARCHIVE_PATTERN = /\bopenspec\s+archive\b/u;
const ARCHIVE_FLAG = /--i-am-the-human\b/u;
const HUMAN_GATE_FLIP_PATTERN = /^\s*[-*]\s*\[[xX]\][^\n]*$/mu;
const CHANGE_FROM_PATH_PATTERN = /(?:^|\/)changes\/([^/]+)\//u;

/** True when the text flips the schema-declared verdict line to complete. */
export function flipsVerdictLine(text: string, verdictLine: string): boolean {
  const declared = new RegExp(verdictLine.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'iu');
  for (const line of text.split('\n')) {
    if (HUMAN_GATE_FLIP_PATTERN.test(line) && declared.test(line)) return true;
  }
  return false;
}

/** A declared H2 section heading, present anywhere in the text. Headings
 *  are prose, not identifiers — the match is case-insensitive. */
export function sectionHeadingPresent(text: string, section: string): boolean {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`^#{2,}\\s*${escaped}\\s*$`, 'imu').test(text);
}

/** A declared top-level `Key:` line, present anywhere in the text. */
export function lineKeyPresent(text: string, key: string): boolean {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`^${escaped}:`, 'mu').test(text);
}

type SessionDirLike = { getSessionDir?: () => string };

export type GateState = {
  declarationWords: string | undefined;
  inheritedFocus: ActiveFocus | undefined;
  validationPermit: boolean;
  /** session pause permit — epoch-ms expiry, armed by a human reply only */
  pauseUntil?: number;
  /** witnessed-but-unresolved creation; stamped on message_end (below) */
  pendingCreation?: { slug: string; root: string; tool: string; at: string };
  /** an assistant message carried a declare phrase (self-declaration
   *  attempt, latch refused); the correction rides the next block once */
  selfDeclareNoticed?: string;
};

export function createGate(pi: ExtensionAPI, config: GateConfig): void {
  const approval = config.approval ?? {
    enforce: false,
    humanGateSteps: false,
    archiveGuard: false,
    stampCreations: false,
  };
  const state: GateState = {
    declarationWords: undefined,
    inheritedFocus: undefined,
    validationPermit: false,
  };
  const configReadOnlyTools = new Set(config.readOnlyTools ?? []);

  /** The self-declare correction rides exactly one block: a declare phrase
   *  in an assistant message means the agent tried to declare itself — the
   *  latch refused (user messages only) and stayed SILENT, so the agent
   *  guessed at formatting and retried (live-caught 2026-10-27 ×2: bold,
   *  then bare). The next block says what actually happened. */
  const withDeclareNote = (reason: string): string => {
    if (!state.selfDeclareNoticed) return reason;
    state.selfDeclareNoticed = undefined; // one-shot: the correction rides one block
    return `${reason}\n   note:    a declare phrase appeared in an assistant message — declarations latch only from the human; relay the phrases upward, never say them yourself`;
  };

  const annotationsOf = (toolName: string) =>
    (pi.getAllTools?.() ?? []).find((tool) => tool.name === toolName)?.annotations;

  const appendFact: FactAppender = (customType, data) => {
    pi.appendEntry(customType, data);
  };

  const openspecRootOf = (cwd: string): string | undefined => findOpenspecRoot(cwd);

  const activeFocus = (sessionManager: unknown, cwd: string): ActiveFocus | undefined => {
    // 0. the room file — one aim per room, whatever surface wrote it
    const roomRoot = openspecRootOf(cwd);
    const room = roomRoot ? readRoomFocus(roomRoot) : undefined;
    if (room) return room;
    // 1. this session's focus facts
    const own = readSessionFocus(sessionManager as never);
    if (own) return own;
    // 2. inherited from parent session (subagent)
    if (state.inheritedFocus) return state.inheritedFocus;
    return undefined;
  };

  pi.on('session_start', (_event, ctx) => {
    // Federated inheritance: subagent children carry PI_SUBAGENT_DELEGATION.
    const delegation = parseDelegationEnv(process.env.PI_SUBAGENT_DELEGATION);
    if (delegation?.parentSessionId) {
      // getSessionDir() may return the sessions root OR the per-cwd session
      // directory one level below it — try each candidate root until the
      // parent's file resolves (bounded: ≤3 scans).
      const sessionDir = (ctx.sessionManager as SessionDirLike | undefined)?.getSessionDir?.();
      const roots = [...(sessionDir ? [sessionDir, dirname(sessionDir)] : []), joinDefaultSessionRoot()];
      let parentFile: string | undefined;
      for (const root of roots) {
        parentFile = findSessionFile(root, delegation.parentSessionId);
        if (parentFile) break;
      }
      const focus = parentFile ? readFocusFromSessionFile(parentFile) : undefined;
      if (focus) {
        state.inheritedFocus = { ...focus, inheritedFrom: delegation.parentSessionId };
        appendFact(FACT.inherited, {
          parentSessionId: delegation.parentSessionId,
          change: focus.change,
          taskId: focus.taskId,
          at: utcNow(),
        });
      }
    }
  });

  // Declaration latch: the human's own words, user messages only.
  pi.on('message_end', (event, ctx) => {
    // resolve witnessed creations BEFORE anything else: the stamp lands
    // only after the call ran (dir exists) — pre-creating the dir broke
    // `openspec new`'s scaffolder ("already exists" error, no docs written)
    if (state.pendingCreation) {
      const { slug, root, tool, at } = state.pendingCreation;
      state.pendingCreation = undefined;
      if (exists(join(root, 'changes', slug))) {
        writeChangeMeta(root, slug, { 'x-status': 'proposed', 'x-created_by': 'assistant' }, { onlyIfAbsent: true });
        appendFact(FACT.creationStamped, { change: slug, tool, at });
      }
    }
    const message = (event as { message?: { role?: unknown; content?: unknown } }).message;
    if (!message) return;
    const content = message.content;
    const text =
      typeof content === 'string'
        ? content
        : Array.isArray(content)
          ? content
              .map((part) =>
                part && typeof part === 'object' && 'text' in part && typeof (part as { text?: unknown }).text === 'string'
                  ? (part as { text: string }).text
                  : '',
              )
              .join(' ')
          : '';
    const declareRoot = openspecRootOf((ctx as { cwd?: string } | undefined)?.cwd ?? process.cwd());
    const phrases = declareRoot ? declarePhrases(declareRoot) : null;
    if (message.role === 'assistant') {
      // self-declaration attempt: the latch refuses by construction (user
      // messages only) — record it and let the next block carry the
      // correction, so the agent stops guessing at formatting
      // (live-caught 2026-10-27 ×2: said bold, then bare)
      if (phrases && text.length > 0 && text.length <= SELF_DECLARE_MAX_LENGTH && phrases.test(text)) {
        state.selfDeclareNoticed = text.trim().replace(/\s+/gu, ' ').slice(0, 120);
        appendFact(FACT.selfDeclare, { words: state.selfDeclareNoticed, at: utcNow() });
      }
      return;
    }
    if (message.role !== 'user') return;
    if (text.length === 0 || text.length > DECLARE_MAX_LENGTH) return;
    if (phrases && phrases.test(text)) {
      state.declarationWords = text.trim().replace(/\s+/gu, ' ').slice(0, 120);
    }
    if (VALID_PATTERN.test(text)) {
      state.validationPermit = true; // one human-gate flip, latched
    }
    const resumeMatch = RESUME_PATTERN.test(text);
    const pauseMatch = PAUSE_PATTERN.exec(text);
    if (resumeMatch) {
      if (state.pauseUntil !== undefined) appendFact(FACT.pause, { kind: 'resumed', at: utcNow() });
      state.pauseUntil = undefined;
    }
    if (pauseMatch) {
      const amount = Number(pauseMatch[1]);
      const unit = pauseMatch[2]!.toLowerCase();
      const unitMs = unit === 'h' ? 3_600_000 : unit === 'm' ? 60_000 : 1_000;
      const ceiling = config.approval.pauseCeiling ?? PAUSE_CEILING_DEFAULT;
      state.pauseUntil = Date.now() + Math.min(amount * unitMs, ceiling);
      appendFact(FACT.pause, { kind: 'armed', until: state.pauseUntil, at: utcNow() });
    }
  });

  pi.on('tool_call', async (event, ctx) => {
    const toolName: string = event.toolName;
    const input: unknown = event.input;
    const cwd: string = ctx.cwd ?? process.cwd();

    // 0. instruments — the gate never gates its own accounting layer
    if (config.accountingTools?.includes(toolName)) {
      appendFact(FACT.instrument, { tool: toolName, at: utcNow() });
      return undefined;
    }

    // 0.5 approval-touch guard — no path, latch, or exemption may reach the
    // approval surface; runs before classification because a piped-to-
    // read-only form would otherwise classify as non-mutating
    const bashCommand =
      input !== null && typeof input === 'object' && !Array.isArray(input)
        ? String((input as Record<string, unknown>).command ?? '')
        : '';
    if (bashCommand) {
      const touchRoot = openspecRootOf(cwd);
      if (APPROVAL_TOUCH_RESERVED.test(bashCommand)) {
        appendFact(FACT.unapproved, { kind: 'approval-touch', tool: toolName, paths: [], at: utcNow() });
        return { block: true, reason: BLOCK_APPROVAL_TOUCH };
      }
    }

    const verdict = classifyMutation(toolName, input, annotationsOf(toolName), configReadOnlyTools);

    // the pause permit — armed by a human reply only (the latch sits on
    // user messages; assistant text and tool calls can never arm it, and
    // the touch guard above already ran and stays absolute: pause yields
    // the work fences, never the approval surface). Shape A: unaccounted
    // still refuses — no landing place, no pause. Expired lazily.
    const nowMs = Date.now();
    if (state.pauseUntil !== undefined && nowMs >= state.pauseUntil) {
      state.pauseUntil = undefined;
      appendFact(FACT.pause, { kind: 'expired', at: utcNow() });
    }
    const paused = state.pauseUntil !== undefined && nowMs < state.pauseUntil;
    const openspecRoot = openspecRootOf(cwd);

    // creation stamping — assistant-witnessed `openspec new change <slug>`
    // (or its `pios-gate` wrapper form): the change enters the world as
    // proposed + audited. The stamp itself lands on message_end, after the
    // call ran — pre-creating the dir broke openspec's scaffolder.
    if (verdict.creation && approval.stampCreations) {
      const slug = /\b(?:eospec|pios-gate|pi-openspec-gate|openspec)\s+new\s+change\s+([a-z0-9][a-z0-9-]*)/iu.exec(bashCommand)?.[1];
      const root = openspecRootOf(cwd);
      if (slug && root) {
        state.pendingCreation = { slug, root, tool: toolName, at: utcNow() };
      }
    }
    if (!verdict.mutating) {
      // 0.85 research window — research instruments are WORK: with a
      // focused change they open at the schema-declared step
      // (x-unlocks: [research]); with NO active change they block with the
      // same state-aware remedies as the mutation block — void research is
      // unaccounted work (live-caught 2026-10-27 walk #2: a cold agent ran
      // a whole research phase — the investigate artifact's substance — in
      // the void, because the window keyed on focus alone, and the old copy
      // even advertised the escape: "research without a focused change
      // stays free — clear the focus"). Reads that are not research
      // instruments stay free.
      if (!paused && approval.phaseGates && openspecRoot && researchCallMatches(toolName, bashCommand, config)) {
        const focusNow = activeFocus(ctx.sessionManager, cwd);
        if (focusNow && focusIsActive(focusNow, openspecRoot)) {
          const meta = readChangeMeta(openspecRoot, focusNow.change);
          const res = resolveChangeSchema(openspecRoot, meta.raw.schema);
          if (
            res.ok &&
            res.schema.artifacts.some((a) => a.unlocks.includes('research')) &&
            !capabilityUnlocked(res.schema, grantedSet(meta), 'research')
          ) {
            const bearer = res.schema.artifacts.find((a) => a.unlocks.includes('research'))!;
            const grant = `eospec approve`;
            appendFact(FACT.phasegate, {
              kind: 'research-window',
              tool: toolName,
              change: focusNow.change,
              at: utcNow(),
            });
            return { block: true, reason: withDeclareNote(blockResearchWindow(focusNow.change, grant)) };
          }
        } else {
          appendFact(FACT.phasegate, { kind: 'research-void', tool: toolName, at: utcNow() });
          return {
            block: true,
            reason: withDeclareNote(
              blockUnaccounted({
                headline: '⛔ research window closed — no active change',
                lead: 'research instruments are work — they open at a schema-declared step, or the human declares',
                subagent: parseDelegationEnv(process.env.PI_SUBAGENT_DELEGATION) !== undefined,
                focusable: hasActiveChanges(openspecRoot),
                schemas: scanSchemaNames(openspecRoot),
                declares: [...scanDeclares(openspecRoot)],
              }),
            ),
          };
        }
      }
      return undefined; // read-only or creation: pass
    }

    const paths = extractPaths(toolName, input, cwd);

    // 0.7 human-gate flip guard — a [x] flip on the schema-declared
    // verdict line needs a human act; runs before exempt (change files
    // are openspec/**)
    if (approval.humanGateSteps && (toolName === 'edit' || toolName === 'write')) {
      const record = input as Record<string, unknown> | null;
      const newText = typeof record?.newText === 'string' ? record.newText : '';
      const content = typeof record?.content === 'string' ? record.content : '';
      const flipSlug =
        paths.map((p) => CHANGE_FROM_PATH_PATTERN.exec(p)?.[1]).find(Boolean) ??
        activeFocus(ctx.sessionManager, cwd)?.change;
      const flipMeta = flipSlug && openspecRoot ? readChangeMeta(openspecRoot, flipSlug) : undefined;
      const flipResolution = flipMeta && openspecRoot ? resolveChangeSchema(openspecRoot, flipMeta.raw.schema) : undefined;
      const verdictLine = flipResolution?.ok ? schemaVerdictLine(flipResolution.schema) : undefined;
      if (
        verdictLine &&
        ((newText && flipsVerdictLine(newText, verdictLine)) || (content && flipsVerdictLine(content, verdictLine)))
      ) {
        const meta = flipMeta;
        if (meta?.validated) {
          appendFact(FACT.humangate, { tool: toolName, paths, permit: 'meta', at: utcNow() });
        } else if (state.validationPermit) {
          state.validationPermit = false; // latch consumed: exactly one flip
          appendFact(FACT.humangate, { tool: toolName, paths, permit: 'valid-latch', at: utcNow() });
        } else {
          appendFact(FACT.humangate, { tool: toolName, paths, permit: 'none', at: utcNow() });
          return { block: true, reason: BLOCK_HUMANGATE };
        }
      }
    }

    // 0.8 archive guard — archiving an unapproved change needs a human flag
    if (!paused && approval.archiveGuard && bashCommand && ARCHIVE_PATTERN.test(bashCommand)) {
      const slug = /\bopenspec\s+archive\s+(?:-[\w-]+\s+)*([a-z0-9][a-z0-9-]*)/iu.exec(bashCommand)?.[1];
      const root = openspecRootOf(cwd);
      const meta = slug && root ? readChangeMeta(root, slug) : undefined;
      const changeExists = slug && root ? exists(changeMetaPath(root, slug).replace(/\.openspec\.yaml$/u, '')) : false;
      if (slug && meta && !changeIsApproved(meta) && !ARCHIVE_FLAG.test(bashCommand)) {
        appendFact(FACT.unapproved, { kind: 'archive', tool: toolName, change: slug, at: utcNow() });
        const resolution = root ? resolveChangeSchema(root, meta.raw.schema) : undefined;
        const reason =
          resolution?.ok && schemaIsGated(resolution.schema)
            ? blockArchiveState(slug, resolution.schema, grantedSet(meta))
            : BLOCK_ARCHIVE;
        return { block: true, reason };
      }
    }

    // 0.9 phase gates — creating a gated artifact requires its declared
    // precedents granted (x-requires-approval), its declared evidence on
    // disk (x-requires-written), and declared sections/lines at birth.
    // Runs BEFORE exempt: change
    // artifacts live in
    // exempt openspec/** territory — the gate is the only carrier of the
    // schema's declarations. Existing files stay editable (grandfathered,
    // receipts flow); bash creations get the approval check (heredoc
    // content is not inspectable — documented, fail-safe on the grant).
    if (!paused && approval.phaseGates && openspecRoot) {
      for (const path of paths) {
        const slug = CHANGE_FROM_PATH_PATTERN.exec(path)?.[1];
        if (!slug) continue;
        if (exists(path)) continue; // creation only
        const meta = readChangeMeta(openspecRoot, slug);
        const resolution = resolveChangeSchema(openspecRoot, meta.raw.schema);
        if (!resolution.ok || !schemaIsGated(resolution.schema)) continue;
        const artifact = artifactForFilename(resolution.schema, path);
        if (!artifact || (artifact.requiresApproval.length === 0 && artifact.requiresWritten.length === 0)) {
          continue; // declares no gates: drafts free
        }
        const approved = grantedSet(meta);
        const missingApproval = artifact.requiresApproval.filter((id) => !approved.has(id));
        if (missingApproval.length > 0) {
          appendFact(FACT.phasegate, {
            kind: 'missing-approval',
            tool: toolName,
            change: slug,
            artifact: artifact.id,
            missing: missingApproval,
            at: utcNow(),
          });
          return { block: true, reason: blockArtifactApproval(slug, missingApproval) };
        }
        // x-requires-written — declared evidence must already exist on disk;
        // evidence, not approval: no grant needed, only the files
        const missingWritten = artifact.requiresWritten
          .map((id) => resolution.schema.artifacts.find((a) => a.id === id)?.generates)
          .filter((file): file is string => file !== undefined)
          .filter((file) => !exists(join(openspecRoot, 'changes', slug, file)));
        if (missingWritten.length > 0) {
          appendFact(FACT.phasegate, {
            kind: 'missing-written',
            tool: toolName,
            change: slug,
            artifact: artifact.id,
            missing: missingWritten,
            at: utcNow(),
          });
          return { block: true, reason: blockArtifactWritten(artifact.generates, missingWritten) };
        }
        if (artifact.requiresApproval.length > 0 && (toolName === 'edit' || toolName === 'write')) {
          const record = input as Record<string, unknown> | null;
          const text =
            typeof record?.newText === 'string'
              ? record.newText
              : typeof record?.content === 'string'
                ? record.content
                : '';
          const missingStructure = [
            ...sectionTitles(artifact).filter((s) => !sectionHeadingPresent(text, s)),
            ...artifact.lines.filter((l) => !lineKeyPresent(text, l)),
          ];
          if (text.length > 0 && missingStructure.length > 0) {
            appendFact(FACT.phasegate, {
              kind: 'missing-sections',
              tool: toolName,
              change: slug,
              artifact: artifact.id,
              missing: missingStructure,
              at: utcNow(),
            });
            return { block: true, reason: blockArtifactSections(artifact.generates, missingStructure) };
          }
        }
      }
    }

    // 1. exempt — path-scoped, always recorded
    const exemption = matchExemption(toolName, paths, config.exempt, cwd);
    if (exemption.exempt) {
      appendFact(FACT.exempt, {
        tool: toolName,
        category: exemption.category ?? 'unknown',
        prefix: exemption.prefix ?? 'unknown',
        paths,
        at: utcNow(),
      });
      return undefined;
    }

    // 2. attributed — the focus names an active change
    const focus = activeFocus(ctx.sessionManager, cwd);
    if (focusIsActive(focus, openspecRoot)) {
      // 2a. approval teeth — attribution is not approval; source mutations
      // on a focused-but-unapproved change block with the terminal remedy
      const meta = readChangeMeta(openspecRoot!, focus.change);
      if (approval.enforce && !paused) {
        // unlock is data: any granted writes-unlock artifact (x-unlocks:
        //  [writes], or the x-unlocks-source alias), else (no declaration)
        // full completion — attribution is not approval
        const unlockResolution = resolveChangeSchema(openspecRoot!, meta.raw.schema);
        const unlocked =
          unlockResolution.ok && schemaIsGated(unlockResolution.schema)
            ? writesUnlocked(unlockResolution.schema, grantedSet(meta))
            : changeIsApproved(meta);
        if (!unlocked) {
          appendFact(FACT.unapproved, {
            kind: 'source-mutation',
            tool: toolName,
            change: focus.change,
            paths,
            at: utcNow(),
          });
          const reason =
            unlockResolution.ok && schemaIsGated(unlockResolution.schema)
              ? withDeclareNote(blockUnapprovedState(focus.change, unlockResolution.schema, grantedSet(meta)))
              : withDeclareNote(BLOCK_UNAPPROVED);
          return { block: true, reason };
        }
      }
      const at = utcNow();
      appendFact(FACT.attributed, {
        tool: toolName,
        change: focus.change,
        taskId: focus.taskId,
        paths,
        basis: verdict.basis,
        at,
      });
      // receipts land where the schema declares (x-receives-receipts,
      // else the completing artifact); undeclared → facts only
      const receiptResolution = resolveChangeSchema(openspecRoot!, meta.raw.schema);
      const receiptTarget = receiptResolution.ok ? receiptArtifactFor(receiptResolution.schema)?.generates : undefined;
      void appendAttributionReceipt(openspecRoot, focus.change, { tool: toolName, paths, at }, receiptTarget);
      return undefined;
    }

    // 3. declared — a human job command latched; one debt line, then it proceeds
    if (state.declarationWords) {
      const words = state.declarationWords;
      state.declarationWords = undefined; // latch consumed: exactly one line
      const at = utcNow();
      appendFact(FACT.declared, { tool: toolName, words, paths, at });
      void appendDebtLine(openspecRoot, words, at);
      return undefined;
    }

    // 4. blocked — visible, exact copy, every remedy that is real in this
    // state: nothing focusable → no focus line; subagent → relay-upward;
    // resolvable schemas named, not a placeholder; the offending bash
    // segment named; a noticed self-declare attempt corrected
    appendFact(FACT.blocked, { tool: toolName, paths, basis: verdict.basis, at: utcNow() });
    const dangling = focus && !focusIsActive(focus, openspecRoot) ? focus.change : undefined;
    return {
      block: true,
      reason: withDeclareNote(
        blockUnaccounted({
          dangling,
          subagent: parseDelegationEnv(process.env.PI_SUBAGENT_DELEGATION) !== undefined,
          focusable: openspecRoot ? hasActiveChanges(openspecRoot) : false,
          schemas: openspecRoot ? scanSchemaNames(openspecRoot) : undefined,
          declares: openspecRoot ? [...scanDeclares(openspecRoot)] : [],
          offender: verdict.offender,
        }),
      ),
    };
  });
}

function joinDefaultSessionRoot(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
  return `${home}/.pi/agent/sessions`;
}
