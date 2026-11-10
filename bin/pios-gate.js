/**
 * pios-gate — the gate as a feature extension of openspec (plain JS:
 * node refuses type-stripping under node_modules, so installed bins must
 * not be TypeScript).
 *
 *   the walk — the human's whole vocabulary:
 *   pios-gate <slug>            aim — focus a change (one active per
 *                               room; human authority — never the
 *                               agent's)
 *   pios-gate go                advance — stamp the next step of the
 *                               focused change
 *   pios-gate list              the cockpit — every change, next acts
 *   pios-gate act               the aim's act in one line — derived at
 *                               read time, never stored; what renderers
 *                               relay
 *   pios-gate done              the close — after the human ticks the
 *                               verdict: validated, archived, focus dies
 *
 *   for agents, scripts, renderers:
 *   pios-gate act <slug>        a change's act in one line
 *   pios-gate inspect <slug>    one change, verbose (own verb: `show`
 *                               stays openspec's passthrough)
 *   pios-gate grant <slug> <ref>  stamp by name — ref is the declared
 *                               word id, inspect's row number, the
 *                               generated file, or artifact/section
 *   pios-gate next <slug>       the advance without aiming
 *   pios-gate focus [slug]      show or set the aim
 *   pios-gate approve <slug>    legacy whole-change stamp (ungated only)
 *
 *   the room:
 *   pios-gate pause|resume      session acts — say them in the session
 *   pios-gate <anything else>   exec openspec <argv> verbatim, exit code
 *                               intact — exec, never interpretation
 *
 * Reserved words never forward. Human terminal only: aim, go, done,
 * confirm, grant, next, and approve refuse tool-call invocations.
 */
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

import {
  actHint,
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
  showReport,
  utcNowStamp,
  writeChangeMeta,
  writeFocus,
} from './gate-lib.js';

const [command, slug, artifactArg] = process.argv.slice(2);

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
    : `needs approve — pios-gate approve ${target}`;
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

if (command === 'pending' || command === 'list') {
  console.log(pendingReport(rootOf()));
  process.exit(0);
}

if (command === 'inspect') {
  const root = rootOf();
  changeOrDie(root, slug, 'usage: pios-gate inspect <change-slug>');
  console.log(showReport(root, slug));
  process.exit(0);
}

// the walk's aim: terminal focus — the human's authority, one active
// change per room; the agent's session focus is a separate store
if (command === 'focus') {
  const root = rootOf();
  if (!slug) {
    const current = readFocus(root);
    console.log(current ? `focused ${current}` : 'no focus — pios-gate <slug>');
    process.exit(0);
  }
  changeOrDie(root, slug, 'usage: pios-gate focus <change-slug>');
  aimFocus(root, slug);
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

  the walk:
  pios-gate <slug>            aim — focus a change (and see its act)
  pios-gate go                advance — stamp the next step
  pios-gate list              the cockpit — every change
  pios-gate done              the close — after you tick the verdict:
                              validated, archived, focus released

  for agents, scripts, renderers:
  pios-gate act <slug>        a change's act in one line
  pios-gate inspect <slug>    one change, verbose
  pios-gate grant <slug> <ref>  stamp by name (id · row# · file · artifact/section)
  pios-gate next <slug>       the advance without aiming
  pios-gate confirm <slug>    the verdict, named
  pios-gate focus [slug]      show or set the aim
  pios-gate approve <slug>    legacy whole-change stamp (ungated schemas only)

  the room:
  pios-gate pause|resume      session acts — say them in the session
  pios-gate validate <args>   openspec's structure lint (passthrough)
  pios-gate <anything else>   exec openspec verbatim, exit code intact

Grants are human-terminal — go, confirm, grant, next, and approve refuse
tool-call invocations.`);
  process.exit(0);
}

// canonical grant: pios-gate grant <slug> <artifact-id | row# | file | artifact/section>
if (command === 'grant') {
  const root = rootOf();
  changeOrDie(root, slug, 'usage: pios-gate grant <change-slug> <artifact-id | row# | file | artifact/section>');
  if (!artifactArg) {
    console.error('usage: pios-gate grant <change-slug> <artifact-id | row# | file | artifact/section>');
    process.exit(2);
  }
  doGrant(root, slug, artifactArg);
}

// the teacher: the change's next human act in one line — derived at read
// time, never stored; what renderers relay (placement, never truth).
// Bare `act` resolves the aim — stardeck reads one line, owns no state.
if (command === 'act') {
  const root = rootOf();
  const target = slug ?? readFocus(root);
  if (!target) {
    console.log('no focus — pios-gate <slug>');
    process.exit(0);
  }
  if (!existsSync(join(root, 'changes', target))) {
    if (slug) {
      console.error(`no such change: ${target} (under ${root}/changes/)`);
      process.exit(2);
    }
    console.log('focus is stale — pios-gate <slug>');
    process.exit(0);
  }
  const meta = readChangeMeta(root, target);
  const resolution = resolveChangeSchema(root, meta.schema);
  if (!resolution.ok || !schemaIsGated(resolution.schema)) {
    const status = meta.status ?? 'no-meta';
    console.log(
      status !== 'approved'
        ? 'needs approve'
        : meta.validated
          ? 'ready to archive?'
          : 'needs confirm (verdict open)',
    );
    process.exit(0);
  }
  console.log(pendingAct(root, target, resolution.schema, grantedSet(meta)) ?? completionLine(resolution.schema, meta));
  process.exit(0);
}

// the walk's advance: stamp the next step of the focused change — same
// grantArtifact checks as every surface; the verdict wall and archive
// discipline intact (archive fires only after confirm)
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
    console.error(`pios-gate: '${focused}' declares no gates — use: pios-gate approve ${focused}`);
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
    console.error(`pios-gate: '${focused}' declares no gates — the close is: pios-gate approve ${focused}, then archive`);
    process.exit(1);
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

// the uniform act: grant the first ungranted artifact in declared
// sequence — the step verb every verb-less gated schema already has
if (command === 'next') {
  const root = rootOf();
  changeOrDie(root, slug, 'usage: pios-gate next <change-slug>');
  const meta = readChangeMeta(root, slug);
  const resolution = resolveChangeSchema(root, meta.schema);
  if (!resolution.ok) {
    // no schema is the legacy shape — approve is the true act there
    if (resolution.reason === 'no-schema') {
      console.error(`pios-gate: change '${slug}' declares no schema — use: pios-gate approve ${slug}`);
      process.exit(1);
    }
    console.error(`pios-gate: schema problem for '${slug}' — ${resolution.reason}`);
    process.exit(1);
  }
  if (!schemaIsGated(resolution.schema)) {
    console.error(`pios-gate: schema '${meta.schema}' declares no gates — use: pios-gate approve ${slug}`);
    process.exit(1);
  }
  const approved = grantedSet(meta);
  const nextArtifact = resolution.schema.artifacts.find((a) => !approved.has(a.id));
  if (!nextArtifact) {
    console.error(`pios-gate: '${slug}' has nothing to grant — all artifacts granted`);
    process.exit(1);
  }
  doGrant(root, slug, nextArtifact.id);
}

if (command === 'approve') {
  const root = rootOf();
  changeOrDie(root, slug, `usage: pios-gate approve <change-slug> [artifact-id]`);
  if (artifactArg) {
    doGrant(root, slug, artifactArg);
  }
  const meta = readChangeMeta(root, slug);
  const resolution = resolveChangeSchema(root, meta.schema);
  const at = utcNowStamp();
  if (resolution.ok && schemaIsGated(resolution.schema)) {
    // Human ruling 2026-10-23: approve is per-step on gated schemas — a
    // single approve for all steps is unacceptable, and scoped intent
    // must never approve more than its scope (the fail-open this change
    // cures once let a parse gap land here as a whole-change stamp).
    console.error(`pios-gate: '${meta.schema}' is gated — approve is per-step:`);
    console.error(`   pios-gate go                       # stamps the first ungranted artifact (aim first: pios-gate <slug>)`);
    console.error(`   pios-gate grant ${slug} <step-id>   # or name the step: id · row# · file`);
    process.exit(1);
  }
  writeChangeMeta(root, slug, { status: 'approved', approved_at: at });
  console.log(`approved ${slug} · at ${at}`);
  process.exit(0);
}

if (command === 'confirm') {
  const root = rootOf();
  const target = slug ?? readFocus(root);
  if (!target) {
    console.error('no focus — pios-gate <slug> (or: pios-gate confirm <slug>)');
    process.exit(1);
  }
  if (!existsSync(join(root, 'changes', target))) {
    console.error('focus is stale — pios-gate <slug>');
    process.exit(1);
  }
  const at = utcNowStamp();
  writeChangeMeta(root, target, { validated: at, validated_at: at });
  console.log(`confirmed ${target} · at ${at}`);
  process.exit(0);
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
