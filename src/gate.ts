/**
 * The gate — one tool_call handler, the law of disjoint questions:
 * another layer owns permission; this gate owns declaredness.
 *
 * Decision order for every mutating call:
 *   1. exempt?    (path-scoped, every target path covered) → record fact, pass
 *   2. focused?   (this session or inherited from parent)  → attribute, pass
 *   3. declared?  (human said "do it", latch consumed)      → debt line, pass
 *   4. otherwise  → block, exact copy, all three remedies
 * Creation commands (openspec new/init) pass ungated.
 * Handler failure blocks the call as a fail-safe.
 */
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { existsSync as exists } from 'node:fs';
import { dirname } from 'node:path';

import { appendDebtLine, appendAttributionReceipt } from './attribution.ts';
import {
  changeIsApproved,
  changeMetaPath,
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
  readSessionFocus,
  type ActiveFocus,
} from './focus.ts';
import { extractPaths } from './paths.ts';
import { matchExemption } from './exemptions.ts';

export const BLOCK_MESSAGE = [
  '⛔ unaccounted mutation — no active change',
  '   focus:   set the focus fact via your cockpit/status tool',
  '   create:  openspec new change <slug> --schema ramona-plan',
  '   or say "do it" — recorded as declared work, proceeds',
].join('\n');

export const BLOCK_APPROVAL_TOUCH = [
  '⛔ approval is human-terminal only',
  '   the assistant cannot approve or validate — ask the human',
].join('\n');

export const BLOCK_HUMANGATE = [
  '⛔ human-validation flip requires a human act',
  '   validate: pi-openspec-gate validate <slug>   ← your terminal',
  '   or reply literally: VALID',
].join('\n');

export const BLOCK_ARCHIVE = [
  '⛔ archive requires an approved change',
  '   approve: pi-openspec-gate approve <slug>   ← your terminal',
  '   or pass --i-am-the-human',
].join('\n');

export const BLOCK_UNAPPROVED = [
  '⛔ focused change is not approved — attribution is not approval',
  '   approve: pi-openspec-gate approve <slug>   ← your terminal',
  '   docs:    openspec/** stays exempt — drafting is never blocked',
].join('\n');

/** A human "do it" latches exactly one declared mutation. */
const DECLARE_PATTERN = /\bdo\s+it\b/iu;
const DECLARE_MAX_LENGTH = 200;

/** A literal "VALID" reply latches exactly one human-gate flip. */
const VALID_PATTERN = /\bVALID\b/u;
const VALID_MAX_LENGTH = 200;

/** Any tool-call attempt to run the approval CLI — blocked before all else. */
const APPROVAL_TOUCH_PATTERN = /pi-openspec-gate(?:\.\w+)?\s+(?:approve|validate)\b/u;
const ARCHIVE_PATTERN = /\bopenspec\s+archive\b/u;
const ARCHIVE_FLAG = /--i-am-the-human\b/u;
const HUMAN_GATE_FLIP_PATTERN = /^\s*[-*]\s*\[[xX]\][^\n]*$/mu;
const HUMAN_GATE_LINE_PATTERN = /human\s+validation/iu;
const CHANGE_FROM_PATH_PATTERN = /(?:^|\/)changes\/([^/]+)\//u;

/** True when the text flips a "Human validation" step to complete. */
export function flipsHumanValidationStep(text: string): boolean {
  for (const line of text.split('\n')) {
    if (HUMAN_GATE_FLIP_PATTERN.test(line) && HUMAN_GATE_LINE_PATTERN.test(line)) return true;
  }
  return false;
}

type SessionDirLike = { getSessionDir?: () => string };

export type GateState = {
  declarationWords: string | undefined;
  inheritedFocus: ActiveFocus | undefined;
  validationPermit: boolean;
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

  const annotationsOf = (toolName: string) =>
    (pi.getAllTools?.() ?? []).find((tool) => tool.name === toolName)?.annotations;

  const appendFact: FactAppender = (customType, data) => {
    pi.appendEntry(customType, data);
  };

  const openspecRootOf = (cwd: string): string | undefined => findOpenspecRoot(cwd);

  const activeFocus = (sessionManager: unknown, cwd: string): ActiveFocus | undefined => {
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
  pi.on('message_end', (event) => {
    const message = (event as { message?: { role?: unknown; content?: unknown } }).message;
    if (!message || message.role !== 'user') return;
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
    if (text.length === 0 || text.length > DECLARE_MAX_LENGTH) return;
    if (DECLARE_PATTERN.test(text)) {
      state.declarationWords = text.trim().replace(/\s+/gu, ' ').slice(0, 120);
    }
    if (VALID_PATTERN.test(text)) {
      state.validationPermit = true; // one human-gate flip, latched
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
    if (bashCommand && APPROVAL_TOUCH_PATTERN.test(bashCommand)) {
      appendFact(FACT.unapproved, { kind: 'approval-touch', tool: toolName, paths: [], at: utcNow() });
      return { block: true, reason: BLOCK_APPROVAL_TOUCH };
    }

    const verdict = classifyMutation(toolName, input, annotationsOf(toolName), configReadOnlyTools);

    // creation stamping — assistant-witnessed `openspec new change <slug>`:
    // the change enters the world as proposed + audited; human-terminal
    // creations are invisible to the gate and stay unstamped
    if (verdict.creation && approval.stampCreations) {
      const slug = /\bopenspec\s+new\s+change\s+([a-z0-9][a-z0-9-]*)/iu.exec(bashCommand)?.[1];
      const root = openspecRootOf(cwd);
      if (slug && root) {
        writeChangeMeta(root, slug, { status: 'proposed', created_by: 'assistant' }, { onlyIfAbsent: true });
        appendFact(FACT.creationStamped, { change: slug, tool: toolName, at: utcNow() });
      }
    }
    if (!verdict.mutating) return undefined; // read-only or creation: pass

    const paths = extractPaths(toolName, input, cwd);
    const openspecRoot = openspecRootOf(cwd);

    // 0.7 human-gate flip guard — a [x] flip on a "Human validation" line
    // needs a human act; runs before exempt (tasks files are openspec/**)
    if (approval.humanGateSteps && (toolName === 'edit' || toolName === 'write')) {
      const record = input as Record<string, unknown> | null;
      const newText = typeof record?.newText === 'string' ? record.newText : '';
      const content = typeof record?.content === 'string' ? record.content : '';
      if ((newText && flipsHumanValidationStep(newText)) || (content && flipsHumanValidationStep(content))) {
        const slug =
          paths.map((p) => CHANGE_FROM_PATH_PATTERN.exec(p)?.[1]).find(Boolean) ??
          activeFocus(ctx.sessionManager, cwd)?.change;
        const meta = slug && openspecRoot ? readChangeMeta(openspecRoot, slug) : undefined;
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
    if (approval.archiveGuard && bashCommand && ARCHIVE_PATTERN.test(bashCommand)) {
      const slug = /\bopenspec\s+archive\s+(?:-[\w-]+\s+)*([a-z0-9][a-z0-9-]*)/iu.exec(bashCommand)?.[1];
      const root = openspecRootOf(cwd);
      const meta = slug && root ? readChangeMeta(root, slug) : undefined;
      const changeExists = slug && root ? exists(changeMetaPath(root, slug).replace(/\.openspec\.yaml$/u, '')) : false;
      if (slug && meta && !changeIsApproved(meta) && !ARCHIVE_FLAG.test(bashCommand)) {
        appendFact(FACT.unapproved, { kind: 'archive', tool: toolName, change: slug, at: utcNow() });
        return { block: true, reason: BLOCK_ARCHIVE };
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
      if (approval.enforce) {
        const meta = readChangeMeta(openspecRoot!, focus.change);
        if (!changeIsApproved(meta)) {
          appendFact(FACT.unapproved, {
            kind: 'source-mutation',
            tool: toolName,
            change: focus.change,
            paths,
            at: utcNow(),
          });
          return { block: true, reason: BLOCK_UNAPPROVED };
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
      void appendAttributionReceipt(openspecRoot, focus.change, { tool: toolName, paths, at });
      return undefined;
    }

    // 3. declared — the human said "do it"; one debt line, then it proceeds
    if (state.declarationWords) {
      const words = state.declarationWords;
      state.declarationWords = undefined; // latch consumed: exactly one line
      const at = utcNow();
      appendFact(FACT.declared, { tool: toolName, words, paths, at });
      void appendDebtLine(openspecRoot, words, at);
      return undefined;
    }

    // 4. blocked — visible, exact copy, all three remedies
    appendFact(FACT.blocked, { tool: toolName, paths, basis: verdict.basis, at: utcNow() });
    return { block: true, reason: BLOCK_MESSAGE };
  });
}

function joinDefaultSessionRoot(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
  return `${home}/.pi/agent/sessions`;
}
