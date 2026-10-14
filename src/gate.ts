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

import { appendDebtLine, appendAttributionReceipt } from './attribution.ts';
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

/** A human "do it" latches exactly one declared mutation. */
const DECLARE_PATTERN = /\bdo\s+it\b/iu;
const DECLARE_MAX_LENGTH = 200;

type SessionDirLike = { getSessionDir?: () => string };

export type GateState = {
  declarationWords: string | undefined;
  inheritedFocus: ActiveFocus | undefined;
};

export function createGate(pi: ExtensionAPI, config: GateConfig): void {
  const state: GateState = { declarationWords: undefined, inheritedFocus: undefined };

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
      const sessionDir = (ctx.sessionManager as SessionDirLike | undefined)?.getSessionDir?.();
      const root = sessionDir ?? joinDefaultSessionRoot();
      const parentFile = findSessionFile(root, delegation.parentSessionId);
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

    const verdict = classifyMutation(toolName, input, annotationsOf(toolName));
    if (!verdict.mutating) return undefined; // read-only or creation: pass

    const paths = extractPaths(toolName, input, cwd);
    const openspecRoot = openspecRootOf(cwd);

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
