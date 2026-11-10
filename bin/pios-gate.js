/**
 * pios-gate — the gate as a feature extension of openspec (plain JS:
 * node refuses type-stripping under node_modules, so installed bins must
 * not be TypeScript).
 *
 *   the walk — the vocabulary, four words, one for human and AI alike:
 *   pios-gate <slug>            aim — focus a change (and see its act)
 *   pios-gate go                advance — stamp the next step of the
 *                               focused change
 *   pios-gate list              the cockpit — every change, next acts
 *   pios-gate done              the close — after the human ticks the
 *                               verdict: validated, archived, focus dies
 *
 *   Older verbs (act, inspect, grant, next, focus, approve, confirm,
 *   pending) keep answering for scripts and sessions that learned them —
 *   they are undocumented compatibility, never features.
 *
 *   Anything else execs openspec verbatim, exit code intact — never
 *   interpretation.
 *
 * Reserved words never forward. Human terminal only: aim, go, done,
 * confirm, grant, next, and approve refuse tool-call invocations.
 */
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

import {
  completionLine,
  findOpenspecRoot,
  grantedSet,
  grantArtifact,
  pendingAct,
  pendingReport,
  readChangeMeta,
  readFocus,
  focusPath,
  receiptArtifactFor,
  resolveChangeSchema,
  schemaIsGated,
  schemaVerdictLine,
  utcNowStamp,
  writeChangeMeta,
  writeFocus,
} from './gate-lib.js';

const [command, slug] = process.argv.slice(2);

const rootOf = () => {
  const root = findOpenspecRoot(process.cwd());
  if (!root) {
    console.error('no openspec/changes/ found (walked up from cwd)');
    process.exit(2);
  }
  return root;
};

const changeOrDie = (root, s, usage) => {
  if (!s) {
    console.error(usage);
    process.exit(2);
  }
  if (!existsSync(join(root, 'changes', s))) {
    console.error(`no such change: ${s} (under ${root}/changes/)`);
    process.exit(2);
  }
};

/** The walk's aim — write focus, then teach what the next go will do. */
const aimFocus = (root, target) => {
  writeFocus(root, target);
  const meta = readChangeMeta(root, target);
  const resolution = resolveChangeSchema(root, meta.schema);
  const act = resolution.ok && schemaIsGated(resolution.schema)
    ? (pendingAct(root, target, resolution.schema, grantedSet(meta)) ?? completionLine(resolution.schema, meta))
    : 'no gates — pios-gate done closes it as it stands';
  console.log(`focused ${target} · next: ${act}`);
  process.exit(0);
};

const doGrant = (root, s, artifactId) => {
  const result = grantArtifact(root, s, artifactId);
  if (!result.ok) {
    console.error(result.error);
    process.exit(1);
  }
  console.log(
    result.completed
      ? `granted ${s} · ${result.granted} · all artifacts granted — status: approved · at ${result.at}${result.verdict ? ` · next: tick '${result.verdict}' then: pios-gate done` : ''}`
      : `granted ${s} · ${result.granted} · at ${result.at}${result.next ? ` · next: ${result.next}` : ''}`,
  );
  process.exit(0);
};

if (command === 'list') {
  console.log(pendingReport(rootOf()));
  process.exit(0);
}

// pause/resume are session acts (the permit lives in the session and
// dies with it — arming from a terminal would need a session-id channel
// pi does not expose): the verb teaches, the reply arms
if (command === 'pause' || command === 'resume') {
  console.log(
    command === 'pause'
      ? 'pause is a session act — say "pause 30m" (grammar X{h,m,s}, ceiling 4h) in your session; the permit dies with the session'
      : 'resume is a session act — say "resume" in your session',
  );
  process.exit(0);
}

// the gate introduces itself: bare invocation and help print gate usage —
// never openspec's banner under the gate's name (live-caught 2026-11-04,
// human ruling: no debt, fix now)
if (!command || command === 'help' || command === '--help' || command === '-h') {
  console.log(`pios-gate — the gate as a feature extension of openspec

  pios-gate <slug>    aim — focus a change (and see its act)
  pios-gate go        advance — stamp the next step
  pios-gate list      the cockpit — every change
  pios-gate done      the close — after you tick the verdict:
                      validated, archived, focus released

  pios-gate help      this
  pios-gate <anything else>   exec openspec verbatim, exit code intact

Grants are human-terminal — go and done refuse tool-call invocations.`);
  process.exit(0);
}

// the teacher is gone with the verbs — four words answer everything

// the aim's act in one line — the renderer's relay (stardeck reads one
// line, owns no state); bare only — the walk has no named form for it
if (command === 'act' && !slug) {
  const root = rootOf();
  const focused = readFocus(root);
  if (!focused) {
    console.log('no focus — pios-gate <slug>');
    process.exit(0);
  }
  if (!existsSync(join(root, 'changes', focused))) {
    console.log('focus is stale — pios-gate <slug>');
    process.exit(0);
  }
  const meta = readChangeMeta(root, focused);
  const resolution = resolveChangeSchema(root, meta.schema);
  if (!resolution.ok || !schemaIsGated(resolution.schema)) {
    console.log(meta.validated ? 'ready to archive?' : 'no gates — pios-gate done closes it as it stands');
    process.exit(0);
  }
  console.log(pendingAct(root, focused, resolution.schema, grantedSet(meta)) ?? completionLine(resolution.schema, meta));
  process.exit(0);
}

// the walk's advance: stamp the next step of the focused change — same
// grantArtifact checks as every surface; the verdict wall and archive
// discipline intact (archive fires only after the verdict, via done)
if (command === 'go') {
  const root = rootOf();
  const focused = readFocus(root);
  if (!focused) {
    console.error('no focus — pios-gate <slug>');
    process.exit(1);
  }
  if (!existsSync(join(root, 'changes', focused))) {
    console.error('focus is stale — pios-gate <slug>');
    process.exit(1);
  }
  const meta = readChangeMeta(root, focused);
  const resolution = resolveChangeSchema(root, meta.schema);
  if (!resolution.ok || !schemaIsGated(resolution.schema)) {
    console.error(`pios-gate: '${focused}' has no gates — pios-gate done closes it as it stands`);
    process.exit(1);
  }
  const pending = pendingAct(root, focused, resolution.schema, grantedSet(meta));
  if (!pending) {
    if (!meta.validated) {
      const verdict = schemaVerdictLine(resolution.schema);
      console.error(`all artifacts granted — next: tick '${verdict ?? 'the verdict'}' then: pios-gate done`);
      process.exit(1);
    }
    console.error(`validated ${focused} — nothing to advance: pios-gate done`);
    process.exit(1);
  }
  const nextArtifact = resolution.schema.artifacts.find((a) => !grantedSet(meta).has(a.id));
  doGrant(root, focused, nextArtifact.id);
}

// the close: after the human ticks the verdict — validated, archived.
// One word for the whole ending; the tick before it stays human-only.
if (command === 'done') {
  const root = rootOf();
  const focused = readFocus(root);
  if (!focused) {
    console.error('no focus — pios-gate <slug>');
    process.exit(1);
  }
  if (!existsSync(join(root, 'changes', focused))) {
    console.error('focus is stale — pios-gate <slug>');
    process.exit(1);
  }
  const meta = readChangeMeta(root, focused);
  const resolution = resolveChangeSchema(root, meta.schema);
  if (!resolution.ok || !schemaIsGated(resolution.schema)) {
    // ungated room: nothing to walk — done IS the judgment
    const at = utcNowStamp();
    writeChangeMeta(root, focused, { status: 'approved', approved_at: at, validated: at, validated_at: at });
    console.log(`done ${focused} · ungated — approved, validated · archiving`);
    const archive = spawnSync('openspec', ['archive', focused], { stdio: 'inherit' });
    if (archive.status === 0) {
      try { unlinkSync(focusPath(root)); } catch { /* the aim already died with the change */ }
    }
    process.exit(archive.status ?? 1);
  }
  const ungranted = resolution.schema.artifacts.filter((a) => !grantedSet(meta).has(a.id));
  if (ungranted.length > 0) {
    console.error(`not done — ${ungranted.length} artifact(s) ungranted (${ungranted.map((a) => a.id).join(', ')}) — pios-gate go`);
    process.exit(1);
  }
  const verdict = schemaVerdictLine(resolution.schema);
  if (verdict && !meta.validated) {
    const bearer = receiptArtifactFor(resolution.schema);
    const ledger = bearer ? join(root, 'changes', focused, bearer.generates) : undefined;
    const unticked = ledger && existsSync(ledger)
      ? new RegExp(`^- \\[ \\][^\\n]*${verdict.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}`, 'mu').test(readFileSync(ledger, 'utf8'))
      : true;
    if (unticked) {
      console.error(`not done — tick '${verdict}' in ${bearer?.generates ?? 'the ledger'} first, then: pios-gate done`);
      process.exit(1);
    }
  }
  const at = utcNowStamp();
  writeChangeMeta(root, focused, { validated: at, validated_at: at });
  console.log(`done ${focused} · validated · archiving`);
  const archive = spawnSync('openspec', ['archive', focused], { stdio: 'inherit' });
  if (archive.status === 0) {
    try { unlinkSync(focusPath(root)); } catch { /* the aim already died with the change */ }
  }
  process.exit(archive.status ?? 1);
}

// everything else: exec openspec verbatim — no arg rewriting, ever —
// EXCEPT the walk's aim: a bare change name focuses (resolved, never
// interpreted — unknown names keep the passthrough below)
if (command && !slug) {
  const root = findOpenspecRoot(process.cwd());
  if (root && existsSync(join(root, 'changes', command))) aimFocus(root, command);
}
// EXCEPT gate-side flags: --i-am-the-human is the archive guard's escape
// hatch (the hook honors it and steps aside); openspec would reject it as
// unknown, so the wrapper keeps it off the argv it forwards
// (live-caught 2026-11-04: the hatch broke at its own exec)
const passthroughArgs = process.argv.slice(2).filter((a) => a !== '--i-am-the-human');
const result = spawnSync('openspec', passthroughArgs, { stdio: 'inherit' });
if (result.error) {
  console.error(`pios-gate: cannot exec openspec (${result.error.message}) — is it on PATH?`);
  process.exit(127);
}
process.exit(result.status ?? 1);
