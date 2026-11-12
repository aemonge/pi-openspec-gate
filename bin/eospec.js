/**
 * eospec — openspec, extended: three words, then openspec.
 *
 *   eospec focus <change>   aim the room at a change
 *   eospec focus            the room + every change, one line each
 *   eospec approve          approve the next pending step of the aim
 *   eospec close            tick-checked close: validate, archive, release
 *
 *   eospec -- <args>        everything after -- is openspec, verbatim
 *   eospec help             this
 *
 * Anything else execs openspec verbatim, exit code intact — never
 * interpretation. A bare change name aims the room (resolved, never
 * interpreted — unknown names keep the passthrough below).
 *
 * approve and close are human-terminal: the pi gate refuses any
 * assistant tool call that names them (the watcher's stamp-surface
 * guard); the bin never sees those invocations.
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
  resolveChangeSchema,
  schemaIsGated,
  schemaVerdictLine,
  utcNowStamp,
  writeChangeMeta,
  writeFocus,
} from './gate-lib.js';

const [command, ...rest] = process.argv.slice(2);

const rootOf = () => {
  const root = findOpenspecRoot(process.cwd());
  if (!root) {
    console.error('no openspec/changes/ found (walked up from cwd)');
    process.exit(2);
  }
  return root;
};

/** The walk's aim — write focus, then teach what the next approve does. */
const aimFocus = (root, target) => {
  writeFocus(root, target);
  const meta = readChangeMeta(root, target);
  const resolution = resolveChangeSchema(root, meta.schema);
  const act = resolution.ok && schemaIsGated(resolution.schema)
    ? (pendingAct(root, target, resolution.schema, grantedSet(meta)) ?? completionLine(resolution.schema, meta))
    : 'no gates — eospec close closes it as it stands';
  console.log(`focused ${target} · next: ${act}`);
  process.exit(0);
};

/** The sidecar's receipt count — the trail the walk left, named at close. */
const receiptCount = (root, slug) => {
  try {
    const file = join(root, 'changes', slug, '.ledger');
    const n = (readFileSync(file, 'utf8').match(/^  gate-attributed/gmu) ?? []).length;
    return n > 0 ? ` · receipts: ${n}` : '';
  } catch {
    return '';
  }
};

/** The stamp echo — what was approved, and what the next approve does.
 *  The room snapshot re-renders with the stamp: verbs refresh. */
const doApprove = (root, slug, artifactId) => {
  const result = grantArtifact(root, slug, artifactId);
  if (!result.ok) {
    console.error(result.error);
    process.exit(1);
  }
  writeFocus(root, slug);
  console.log(
    result.completed
      ? `approved ${slug} · ${result.granted} · all steps approved — status: approved · at ${result.at}${result.verdict ? ` · next: tick '${result.verdict}' then: eospec close` : ''}`
      : `approved ${slug} · ${result.granted} · at ${result.at}${result.next ? ` · next: ${result.next}` : ''}`,
  );
  process.exit(0);
};

const exitPassthrough = (args) => {
  const filtered = args.filter((a) => a !== '--i-am-the-human');
  const result = spawnSync('openspec', filtered, { stdio: 'inherit' });
  if (result.error) {
    console.error(`eospec: cannot exec openspec (${result.error.message}) — is it on PATH?`);
    process.exit(127);
  }
  process.exit(result.status ?? 1);
};

// the escape hatch: after --, openspec verbatim — bypassing even
// bare-change-name interception
if (command === '--') exitPassthrough(rest);

// the gate introduces itself: bare invocation and help print eospec
// usage — never openspec's banner under this name
if (!command || command === 'help' || command === '--help' || command === '-h') {
  console.log(`eospec — openspec, extended: three words, then openspec

  eospec focus <change>   aim the room at a change
  eospec focus            the room + every change, one line each
  eospec approve          approve the next pending step of the aim
  eospec close            tick-checked close: validate, archive, release

  eospec -- <args>        everything after -- is openspec, verbatim
  eospec help             this

Anything else runs openspec verbatim, exit code intact.
approve and close are human-terminal — the pi gate refuses the
assistant's tool calls that name them.`);
  process.exit(0);
}

// the aim: focus <change>
if (command === 'focus' && rest[0]) {
  const root = rootOf();
  const target = rest[0];
  if (!existsSync(join(root, 'changes', target))) {
    console.error(`no such change: ${target} (under ${root}/changes/)`);
    process.exit(2);
  }
  aimFocus(root, target);
}

// the room: bare focus — where the room points, every change's pending
// state; the aimed snapshot re-renders on every read (verbs refresh)
if (command === 'focus') {
  const root = rootOf();
  const focused = readFocus(root);
  if (focused && existsSync(join(root, 'changes', focused))) {
    try { writeFocus(root, focused); } catch { /* a stale snapshot never blocks the view */ }
  }
  console.log(focused ? `aim: ${focused}` : 'nothing aimed — eospec focus <change>');
  console.log(pendingReport(root));
  process.exit(0);
}

// the advance: approve the next pending step of the aimed change — the
// same grantArtifact checks as every surface; verdict wall and archive
// discipline intact (archiving fires only via close)
if (command === 'approve') {
  const root = rootOf();
  const focused = readFocus(root);
  if (!focused) {
    console.error('nothing aimed — eospec focus <change>');
    process.exit(1);
  }
  if (!existsSync(join(root, 'changes', focused))) {
    console.error('the aim is stale — the change is gone — eospec focus <change>');
    process.exit(1);
  }
  const meta = readChangeMeta(root, focused);
  const resolution = resolveChangeSchema(root, meta.schema);
  if (!resolution.ok || !schemaIsGated(resolution.schema)) {
    console.error(`eospec: '${focused}' has no gates — eospec close closes it as it stands`);
    process.exit(1);
  }
  const pending = pendingAct(root, focused, resolution.schema, grantedSet(meta));
  if (!pending) {
    if (!meta['x-validated']) {
      const verdict = schemaVerdictLine(resolution.schema);
      console.error(`all artifacts granted — next: tick '${verdict ?? 'the verdict'}' then: eospec close`);
      process.exit(1);
    }
    console.error(`validated ${focused} — nothing to approve: eospec close`);
    process.exit(1);
  }
  const nextArtifact = resolution.schema.artifacts.find((a) => !grantedSet(meta).has(a.id));
  doApprove(root, focused, nextArtifact.id);
}

// the close: after the human ticks the verdict — validated, archived,
// aim released. One word for the whole ending; the tick stays human-only.
if (command === 'close') {
  const root = rootOf();
  const focused = readFocus(root);
  if (!focused) {
    console.error('nothing aimed — eospec focus <change>');
    process.exit(1);
  }
  if (!existsSync(join(root, 'changes', focused))) {
    console.error('the aim is stale — the change is gone — eospec focus <change>');
    process.exit(1);
  }
  const meta = readChangeMeta(root, focused);
  const resolution = resolveChangeSchema(root, meta.schema);
  if (!resolution.ok || !schemaIsGated(resolution.schema)) {
    // ungated room: nothing to walk — close IS the judgment
    const at = utcNowStamp();
    writeChangeMeta(root, focused, { 'x-status': 'approved', 'x-approved_at': at, 'x-validated': at, 'x-validated_at': at });
    console.log(`closed ${focused} · ungated — approved, validated · archiving${receiptCount(root, focused)}`);
    const archive = spawnSync('openspec', ['archive', focused], { stdio: 'inherit' });
    if (archive.status === 0) {
      try { unlinkSync(focusPath(root)); } catch { /* the aim already died with the change */ }
      console.log(`the archival commit is yours: git add -A && git commit -m "chore(openspec): ${focused} archived"`);
    }
    process.exit(archive.status ?? 1);
  }
  const ungranted = resolution.schema.artifacts.filter(
    (a) => !grantedSet(meta).has(a.id) && !(a.optional && !existsSync(join(root, 'changes', focused, a.generates))),
  );
  if (ungranted.length > 0) {
    console.error(`not closed — ${ungranted.length} artifact(s) ungranted (${ungranted.map((a) => a.id).join(', ')}) — eospec approve`);
    process.exit(1);
  }
  const verdict = schemaVerdictLine(resolution.schema);
  if (verdict && !meta['x-validated']) {
    const bearer = resolution.schema.artifacts.find((a) => a.verdictLine);
    const ledger = bearer ? join(root, 'changes', focused, bearer.generates) : undefined;
    const unticked = ledger && existsSync(ledger)
      ? new RegExp(`^- \\[ \\][^\\n]*${verdict.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}`, 'mu').test(readFileSync(ledger, 'utf8'))
      : true;
    if (unticked) {
      console.error(`not closed — tick '${verdict}' in ${bearer?.generates ?? 'the ledger'} first, then: eospec close`);
      process.exit(1);
    }
  }
  const at = utcNowStamp();
  writeChangeMeta(root, focused, { 'x-validated': at, 'x-validated_at': at });
  console.log(`closed ${focused} · validated · archiving${receiptCount(root, focused)}`);
  const archive = spawnSync('openspec', ['archive', focused], { stdio: 'inherit' });
  if (archive.status === 0) {
    try { unlinkSync(focusPath(root)); } catch { /* the aim already died with the change */ }
    console.log(`the archival commit is yours: git add -A && git commit -m "chore(openspec): ${focused} archived"`);
  }
  process.exit(archive.status ?? 1);
}

// archive: the passthrough plus the fence — the aim dies with the change
// (the close unlink law, mirrored) and the commit is taught, never taken
if (command === 'archive') {
  const root = findOpenspecRoot(process.cwd());
  const result = spawnSync('openspec', process.argv.slice(2).filter((a) => a !== '--i-am-the-human'), { stdio: 'inherit' });
  if (result.status === 0) {
    const slug = rest[0];
    if (root && slug) {
      const focused = readFocus(root);
      if (focused === slug) {
        try { unlinkSync(focusPath(root)); } catch { /* the aim already died with the change */ }
      }
    }
    console.log(`the archival commit is yours: git add -A && git commit -m "chore(openspec): ${slug ?? 'archive'} archived"`);
  }
  process.exit(result.status ?? 1);
}

// everything else: exec openspec verbatim — no arg rewriting, ever —
// EXCEPT a bare change name, which aims the room (resolved, never
// interpreted — unknown names keep the passthrough)
if (command && rest.length === 0) {
  const root = findOpenspecRoot(process.cwd());
  if (root && existsSync(join(root, 'changes', command))) aimFocus(root, command);
}
// EXCEPT gate-side flags: --i-am-the-human is the archive guard's escape
// hatch (the hook honors it and steps aside); openspec would reject it as
// unknown, so the wrapper keeps it off the argv it forwards
exitPassthrough(process.argv.slice(2));
