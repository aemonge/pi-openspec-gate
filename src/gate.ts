/**
 * The gate — one tool_call handler, the law of disjoint questions:
 * another layer owns permission; this gate owns declaredness.
 *
 * Decision order for every mutating call:
 *   1. exempt?    (path-scoped, every target path covered) → record fact, pass
 *   2. focused?   (this session or inherited from parent)  → attribute, pass
 *   3. declared?  (schema-declared phrase or "do it", latch consumed) → debt line, pass
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
  readSessionFocus,
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
  scanGrantVerbs,
  sectionTitles,
  writesUnlocked,
} from './schema.ts';

export const BLOCK_MESSAGE = [
  '⛔ unaccounted mutation — no active change',
  '   focus:   set the focus fact via your cockpit/status tool',
  '   create:  openspec new change <slug> --schema <schema-name>',
  '   or say the schema-declared phrase or "do it" — recorded as declared work, proceeds',
].join('\n');

export const BLOCK_APPROVAL_TOUCH = [
  '⛔ approval is human-terminal only',
  '   the assistant cannot approve or validate — ask the human',
].join('\n');

export const BLOCK_HUMANGATE = [
  '⛔ human-validation flip requires a human act',
  '   confirm: pios-gate confirm <slug>   ← your terminal',
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

export function blockArtifactApproval(slug: string, missing: string[], verb?: string): string {
  const grant = verb ? `pios-gate ${verb} ${slug}` : `pios-gate approve ${slug} ${missing[0] ?? '<artifact>'}`;
  return [
    `⛔ phase gate — ${missing.join(', ')} not granted yet`,
    `   grant:   ${grant}   ← your terminal`,
    '   docs:    the schema gates this artifact (x-requires-approval)',
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
    '   or:      research without a focused change stays free — clear the focus',
    '   the schema declares when research opens (x-unlocks: [research])',
  ].join('\n');
}

/** A human declaration latches exactly one declared mutation. The
 *  vocabulary is data: every x-declares phrase of any resolvable schema
 *  joins the built-in alias "do it". */
const DECLARE_ALIAS_PATTERN = /\bdo\s+it\b/iu;
const DECLARE_MAX_LENGTH = 200;

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

/** Any tool-call attempt to reach the approval surface — blocked before
 *  all else. Reserved surface: pi-openspec-gate approve|validate (old),
 *  pios-gate approve|confirm|grant (new). Beyond the reserved words the
 *  vocabulary is data: every x-grant-verb declared by any resolvable
 *  schema joins the guard (scanGrantVerbs, cached per root).
 *  `pios-gate validate` forwards to openspec's structure lint and is NOT
 *  touch-guarded. */
const APPROVAL_TOUCH_RESERVED =
  /(?:pi-openspec-gate(?:\.\w+)?\s+(?:approve|validate)|pios-gate(?:\.\w+)?\s+(?:approve|confirm|grant))\b/u;

const verbTouchCache = new Map<string, RegExp | null>();
function approvalTouchVerbs(openspecRoot: string): RegExp | null {
  if (verbTouchCache.has(openspecRoot)) return verbTouchCache.get(openspecRoot) ?? null;
  const verbs = [...scanGrantVerbs(openspecRoot)];
  let pattern: RegExp | null = null;
  if (verbs.length > 0) {
    const alternation = verbs
      .sort((a, b) => b.length - a.length)
      .map((v) => v.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
      .join('|');
    pattern = new RegExp(`pios-gate(?:\\.\\w+)?\\s+(?:${alternation})\\b`, 'u');
  }
  verbTouchCache.set(openspecRoot, pattern);
  return pattern;
}
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
  /** witnessed-but-unresolved creation; stamped on message_end (below) */
  pendingCreation?: { slug: string; root: string; tool: string; at: string };
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
  pi.on('message_end', (event, ctx) => {
    // resolve witnessed creations BEFORE anything else: the stamp lands
    // only after the call ran (dir exists) — pre-creating the dir broke
    // `openspec new`'s scaffolder ("already exists" error, no docs written)
    if (state.pendingCreation) {
      const { slug, root, tool, at } = state.pendingCreation;
      state.pendingCreation = undefined;
      if (exists(join(root, 'changes', slug))) {
        writeChangeMeta(root, slug, { status: 'proposed', created_by: 'assistant' }, { onlyIfAbsent: true });
        appendFact(FACT.creationStamped, { change: slug, tool, at });
      }
    }
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
    const declareRoot = openspecRootOf((ctx as { cwd?: string } | undefined)?.cwd ?? process.cwd());
    const phrases = declareRoot ? declarePhrases(declareRoot) : null;
    if ((phrases && phrases.test(text)) || DECLARE_ALIAS_PATTERN.test(text)) {
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
    if (bashCommand) {
      const touchRoot = openspecRootOf(cwd);
      const verbs = touchRoot ? approvalTouchVerbs(touchRoot) : null;
      if (APPROVAL_TOUCH_RESERVED.test(bashCommand) || (verbs && verbs.test(bashCommand))) {
        appendFact(FACT.unapproved, { kind: 'approval-touch', tool: toolName, paths: [], at: utcNow() });
        return { block: true, reason: BLOCK_APPROVAL_TOUCH };
      }
    }

    const verdict = classifyMutation(toolName, input, annotationsOf(toolName), configReadOnlyTools);
    const openspecRoot = openspecRootOf(cwd);

    // creation stamping — assistant-witnessed `openspec new change <slug>`
    // (or its `pios-gate` wrapper form): the change enters the world as
    // proposed + audited. The stamp itself lands on message_end, after the
    // call ran — pre-creating the dir broke openspec's scaffolder.
    if (verdict.creation && approval.stampCreations) {
      const slug = /\b(?:pios-gate|pi-openspec-gate|openspec)\s+new\s+change\s+([a-z0-9][a-z0-9-]*)/iu.exec(bashCommand)?.[1];
      const root = openspecRootOf(cwd);
      if (slug && root) {
        state.pendingCreation = { slug, root, tool: toolName, at: utcNow() };
      }
    }
    if (!verdict.mutating) {
      // 0.85 research window — schema-declared instruments (x-unlocks:
      //  [research]) open at their artifact's grant. Reads stay free unless
      //  a FOCUSED change's schema declares the window — idle research is
      //  never gated
      if (approval.phaseGates && openspecRoot) {
        const focusNow = activeFocus(ctx.sessionManager, cwd);
        if (focusNow && focusIsActive(focusNow, openspecRoot)) {
          const meta = readChangeMeta(openspecRoot, focusNow.change);
          const res = resolveChangeSchema(openspecRoot, meta.raw.schema);
          if (
            res.ok &&
            res.schema.artifacts.some((a) => a.unlocks.includes('research')) &&
            !capabilityUnlocked(res.schema, grantedSet(meta), 'research') &&
            researchCallMatches(toolName, bashCommand, config)
          ) {
            const bearer = res.schema.artifacts.find((a) => a.unlocks.includes('research'))!;
            const grant = bearer.grantVerb
              ? `pios-gate ${bearer.grantVerb} ${focusNow.change}`
              : `pios-gate grant ${focusNow.change} ${bearer.id}`;
            appendFact(FACT.phasegate, {
              kind: 'research-window',
              tool: toolName,
              change: focusNow.change,
              at: utcNow(),
            });
            return { block: true, reason: blockResearchWindow(focusNow.change, grant) };
          }
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

    // 0.9 phase gates — creating a gated artifact requires its declared
    // precedents granted (x-requires-approval), its declared evidence on
    // disk (x-requires-written), and declared sections/lines at birth.
    // Runs BEFORE exempt: change
    // artifacts live in
    // exempt openspec/** territory — the gate is the only carrier of the
    // schema's declarations. Existing files stay editable (grandfathered,
    // receipts flow); bash creations get the approval check (heredoc
    // content is not inspectable — documented, fail-safe on the grant).
    if (approval.phaseGates && openspecRoot) {
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
          const verb = resolution.schema.artifacts.find((a) => a.id === missingApproval[0])?.grantVerb;
          appendFact(FACT.phasegate, {
            kind: 'missing-approval',
            tool: toolName,
            change: slug,
            artifact: artifact.id,
            missing: missingApproval,
            at: utcNow(),
          });
          return { block: true, reason: blockArtifactApproval(slug, missingApproval, verb) };
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
      if (approval.enforce) {
        // unlock is data: any granted writes-unlock artifact (x-unlocks:
        //  [writes], legacy x-unlocks-source), else (no declaration) full
        // completion — attribution is not approval
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

    // 4. blocked — visible, exact copy, all three remedies
    appendFact(FACT.blocked, { tool: toolName, paths, basis: verdict.basis, at: utcNow() });
    return { block: true, reason: BLOCK_MESSAGE };
  });
}

function joinDefaultSessionRoot(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
  return `${home}/.pi/agent/sessions`;
}
