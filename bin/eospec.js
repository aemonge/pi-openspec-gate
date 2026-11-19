/**
 * eospec — openspec, extended: three words, then openspec.
 *
 *   eospec new [slug]       birth a mini-plan — timestamped slug, auto-focus
 *   eospec focus <change>   aim the room at a change
 *   eospec focus            the room: every change [n/m tasks], a TTY picks
 *   eospec approve [--all]  the one gate — draft → coding (slices: advance/all)
 *   eospec close [--force]  tasks + verdict ticked — validate, archive, release
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
import { createInterface } from 'node:readline';
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  completionLine,
  findOpenspecRoot,
  grantedSet,
  grantArtifact,
  parsePlan,
  pendingAct,
  pendingRows,
  readChangeMeta,
  readFocus,
  focusPath,
  resolveChangeSchema,
  schemaIsGated,
  schemaVerdictLine,
  sectionHeadingPresent,
  sectionTitles,
  utcNowStamp,
  writeChangeMeta,
  writeFocus,
} from './gate-lib.js';

// the verdict registry: one unticked-check, shared by approve and close —
// an open tick on the bearer is the one lock both words must honor
const verdictUnticked = (ledger, verdict) =>
  !existsSync(ledger) ||
  new RegExp(`^- \\[ \\][^\\n]*${verdict.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}`, 'mu').test(readFileSync(ledger, 'utf8'));

// the ledger lint: the three walls the instructions teach, checked where
// they bind — each offense names its line. One: a commit tick without a
// hash beneath it (a tick without a hash is not done). Two: execute's
// slice titles must mirror the plan's, one for one. Three: exactly one
// verdict line — the schema-declared one — and it is the last countable
// checkbox in the ledger.
const ledgerOffenses = (ledgerText, planPath, verdict) => {
  const offenses = [];
  const lines = ledgerText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*-\s+\[[xX]\]\s+\w+\([\w.-]+\):/.test(lines[i])) {
      const next = lines.slice(i + 1).find((l) => l.trim().length > 0) ?? '';
      if (!/^\s+hash:\s+\S/.test(next)) {
        offenses.push(`a tick without a hash is not done — line ${i + 1}: ${lines[i].trim()}`);
      }
    }
  }
  if (planPath && existsSync(planPath)) {
    const sliceTitles = (text, level) =>
      [...text.matchAll(new RegExp(`^${level}\\s+(Slice[^*(\\n]*)`, 'gmu'))].map((m) => m[1].trim());
    const plan = readFileSync(planPath, 'utf8');
    const planSlices = sliceTitles(plan, '###');
    const ledgerSlices = sliceTitles(ledgerText, '##');
    if (planSlices.length !== ledgerSlices.length || planSlices.some((t, i) => ledgerSlices[i] !== t)) {
      offenses.push(`the ledger's slices must mirror the plan's — plan: [${planSlices.join(' · ')}] vs ledger: [${ledgerSlices.join(' · ')}]`);
    }
  }
  const verdictLines = verdict
    ? lines.filter((l) => /^\s*-\s+\[[xX ]\]/.test(l) && new RegExp(verdict.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'iu').test(l))
    : [];
  const checkboxes = lines.filter((l) => /^\s*-\s+\[[xX ]\]/.test(l));
  if (verdict && (verdictLines.length !== 1 || checkboxes[checkboxes.length - 1] !== verdictLines[0])) {
    offenses.push(`exactly one '${verdict}' line, and it must be the last countable checkbox`);
  }
  return offenses;
};

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

/** One micro row — [n/m tasks] and the state the human's verb addresses. */
const microRow = (root, slug, meta, artifact) => {
  const file = join(root, 'changes', slug, artifact.generates);
  const plan = parsePlan(existsSync(file) ? readFileSync(file, 'utf8') : '', artifact.verdictLine);
  const total = plan.open + plan.done;
  const counts = total > 0 ? `[${plan.done}/${total} tasks]` : '[no tasks yet]';
  const granted = grantedSet(meta).has(artifact.id);
  const unlocked = Math.max(0, Number(meta['x-slice'] ?? '0'));
  const current = plan.slices[unlocked - 1];
  const upcoming = plan.slices[unlocked];
  const boundary = plan.sliceGates && granted && current && current.open === 0 && upcoming;
  let next;
  if (!granted) next = 'draft — eospec approve';
  else if (boundary) next = `slice '${current.title}' done — eospec approve`;
  else if (plan.open === 0) next = `tick '${artifact.verdictLine ?? 'hands-on'}' — eospec close`;
  else next = `coding — ${plan.open} open`;
  return `${slug}  ${counts} · ${next}`;
};

/** The room's rows — one line per active change: micro plans show
 *  [n/m tasks] and their state; legacy walks keep their pendingReport
 *  rows (marks, unhashed debts, the next act). */
const roomRows = (root) => {
  const rows = [];
  const dir = join(root, 'changes');
  let names = [];
  try {
    names = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'archive')
      .map((d) => d.name);
  } catch {
    return rows;
  }
  const legacy = pendingRows(root);
  for (const slug of names) {
    const meta = readChangeMeta(root, slug);
    const resolution = resolveChangeSchema(root, meta.schema);
    if (resolution.ok && resolution.schema.name === 'micro') {
      rows.push({ slug, line: microRow(root, slug, meta, resolution.schema.artifacts[0]) });
      continue;
    }
    const found = legacy.find((row) => row.slug === slug);
    rows.push({
      slug,
      line: found ? found.line : `${slug}  ${meta['x-status'] ?? 'no-meta'} · eospec close closes it as it stands`,
    });
  }
  return rows;
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

  eospec new [slug]        birth a mini-plan — timestamped slug, auto-focus
  eospec focus <change>    aim the room at a change
  eospec focus             the room: every change [n/m tasks], a TTY picks
  eospec approve [--all]   the one gate — draft → coding (slices: advance/all)
  eospec close [--force]   tasks + verdict ticked — validate, archive, release

  eospec -- <args>        everything after -- is openspec, verbatim
  eospec help             this

Anything else runs openspec verbatim, exit code intact.
approve and close are human-terminal — the pi gate refuses the
assistant's tool calls that name them.`);
  process.exit(0);
}

// frictionless birth: eospec new [change] [slug] — timestamped slug when
// omitted, the room's default schema (config.yaml, micro fallback), and
// the aim follows the birth: drafting starts immediately
if (command === 'new') {
  const root = rootOf();
  const named = rest[0] === 'change' ? rest[1] : rest[0];
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const slug = named || `m-${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  let schema = 'micro';
  try {
    schema = /^schema:\s*(\S+)/m.exec(readFileSync(join(root, 'config.yaml'), 'utf8'))?.[1] ?? schema;
  } catch { /* the fallback is the law: micro */ }
  const result = spawnSync('openspec', ['new', 'change', slug, '--schema', schema], { stdio: 'inherit' });
  if (result.status === 0 && !existsSync(join(root, 'changes', slug))) {
    // the scaffolder claimed success but no change landed — never aim a ghost
    console.error(`eospec: the scaffolder ran but ${slug} never appeared — check openspec new`);
    result.status = 1;
  }
  if (result.status === 0) {
    try { writeFocus(root, slug); } catch { /* a lost snapshot never blocks the birth */ }
    console.log(`aimed ${slug} — draft openspec/changes/${slug}/plan.md, then: eospec approve`);
  }
  process.exit(result.status ?? 1);
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

// the room: bare focus — where the room points, every active change one
// line each ([n/m tasks]); a TTY picks a number and aims it. The aimed
// snapshot re-renders on every read (verbs refresh)
if (command === 'focus') {
  const root = rootOf();
  const focused = readFocus(root);
  if (focused && existsSync(join(root, 'changes', focused))) {
    try { writeFocus(root, focused); } catch { /* a stale snapshot never blocks the view */ }
  }
  console.log(focused ? `aim: ${focused}` : 'nothing aimed — eospec focus <change>');
  const rows = roomRows(root);
  if (rows.length === 0) {
    console.log('nothing pending — no active changes — eospec new <slug> starts one');
    process.exit(0);
  }
  rows.forEach((row, i) => {
    console.log(`  ${i + 1}  ${row.line}`);
  });
  if (!process.stdin.isTTY) process.exit(0);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl.question('aim at # (enter skips): ', (answer) => {
    rl.close();
    const pick = Number(answer.trim());
    if (Number.isInteger(pick) && pick >= 1 && pick <= rows.length) aimFocus(root, rows[pick - 1].slug);
    process.exit(0);
  });
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
  // micro — the one-artifact law: the first approve opens coding (the
  // plan must exist with at least one open task); later approves advance
  // slices (opt-in) or report the walk; --all unlocks every slice at once
  if (resolution.ok && resolution.schema.name === 'micro') {
    const artifact = resolution.schema.artifacts[0];
    const planPath = join(root, 'changes', focused, artifact.generates);
    if (!existsSync(planPath)) {
      console.error(`not approved — ${focused}/${artifact.generates} is not drafted yet — you approve what you read`);
      process.exit(1);
    }
    const text = readFileSync(planPath, 'utf8');
    const plan = parsePlan(text, artifact.verdictLine);
    const missing = sectionTitles(artifact).filter((section) => !sectionHeadingPresent(text, section));
    if (missing.length > 0) {
      console.error(`not approved — plan.md missing declared structure: ${missing.join(' · ')}`);
      process.exit(1);
    }
    const at = utcNowStamp();
    const receipt = () => {
      const ledger = join(root, 'changes', focused, '.ledger');
      const prior = existsSync(ledger) ? readFileSync(ledger, 'utf8') : '';
      const glue = prior.length > 0 && !prior.endsWith('\n') ? '\n' : '';
      writeFileSync(ledger, `${prior}${glue}  human-approve · eospec approve · at ${at}\n`, 'utf8');
    };
    if (!grantedSet(meta).has(artifact.id)) {
      if (plan.open === 0) {
        console.error('not approved — plan.md has no open tasks to approve — you approve what you read');
        process.exit(1);
      }
      const granted = grantedSet(meta);
      granted.add(artifact.id);
      const stamps = {
        'x-granted': [...granted].join(','),
        [`x-granted_${artifact.id}`]: at,
        'x-status': 'approved',
        'x-approved_at': at,
      };
      if (plan.sliceGates) stamps['x-slice'] = '1';
      writeChangeMeta(root, focused, stamps);
      receipt();
      writeFocus(root, focused);
      const total = plan.open + plan.done;
      console.log(`approved ${focused} · plan · coding open — ${plan.open} task(s)/${total} · at ${at} · next: tick tasks in plan.md, then: eospec close`);
      process.exit(0);
    }
    if (plan.sliceGates) {
      const unlocked = Math.max(0, Number(meta['x-slice'] ?? '0'));
      const upcoming = plan.slices[unlocked];
      if (rest.includes('--all') && unlocked < plan.slices.length) {
        writeChangeMeta(root, focused, { 'x-slice': String(plan.slices.length) });
        receipt();
        writeFocus(root, focused);
        console.log(`approved ${focused} · all ${plan.slices.length} slice(s) unlocked · at ${at} · next: tick tasks, then: eospec close`);
        process.exit(0);
      }
      if (upcoming) {
        writeChangeMeta(root, focused, { 'x-slice': String(unlocked + 1) });
        receipt();
        writeFocus(root, focused);
        console.log(`approved ${focused} · slice '${upcoming.title}' unlocked · at ${at} · next: tick its tasks — eospec approve at the next boundary, or: eospec approve --all`);
        process.exit(0);
      }
    }
    if (plan.open > 0) {
      const total = plan.open + plan.done;
      console.log(`coding open — ${plan.done}/${total} tasks done · eospec approve advances slices; eospec close ends after hands-on`);
      process.exit(0);
    }
    console.error(`tasks done — hands-on validation then: eospec close${plan.verdictTicked === false ? ` — tick '${artifact.verdictLine}' in ${artifact.generates} (your pass, your tick)` : ''}`);
    process.exit(1);
  }
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
  if (nextArtifact.verdictLine && verdictUnticked(join(root, 'changes', focused, nextArtifact.generates), nextArtifact.verdictLine)) {
    console.error(`not approved — tick '${nextArtifact.verdictLine}' in ${nextArtifact.generates} first — the verdict is yours, the registry remembers it`);
    process.exit(1);
  }
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
  // micro — the close law: every task ticked, the verdict ticked by the
  // human (--force skips both), a human-close receipt, then the archive
  if (resolution.ok && resolution.schema.name === 'micro') {
    const force = rest.includes('--force');
    const artifact = resolution.schema.artifacts[0];
    const planPath = join(root, 'changes', focused, artifact.generates);
    const plan = parsePlan(existsSync(planPath) ? readFileSync(planPath, 'utf8') : '', artifact.verdictLine);
    if (!grantedSet(meta).has(artifact.id) && !force) {
      console.error(`not closed — '${focused}' was never approved — eospec approve`);
      process.exit(1);
    }
    if (plan.open > 0 && !force) {
      console.error(`not closed — ${plan.open} task(s) open — finish them, or: eospec close --force`);
      process.exit(1);
    }
    if (plan.verdictTicked === false && !force) {
      console.error(`not closed — tick '${artifact.verdictLine}' in ${artifact.generates} first — your hands-on pass, your tick — or: eospec close --force`);
      process.exit(1);
    }
    const at = utcNowStamp();
    writeChangeMeta(root, focused, { 'x-validated': at, 'x-validated_at': at });
    const ledger = join(root, 'changes', focused, '.ledger');
    const prior = existsSync(ledger) ? readFileSync(ledger, 'utf8') : '';
    const glue = prior.length > 0 && !prior.endsWith('\n') ? '\n' : '';
    writeFileSync(ledger, `${prior}${glue}  human-close · eospec close · at ${at}\n`, 'utf8');
    console.log(`closed ${focused} · validated · archiving${receiptCount(root, focused)}`);
    const archive = spawnSync('openspec', ['archive', focused], { stdio: 'inherit' });
    if (archive.status === 0) {
      try { unlinkSync(focusPath(root)); } catch { /* the aim already died with the change */ }
      console.log(`the archival commit is yours: git add -A && git commit -m "chore(openspec): ${focused} archived"`);
    }
    process.exit(archive.status ?? 1);
  }
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
  const bearer = resolution.schema.artifacts.find((a) => a.verdictLine);
  if (verdict && !meta['x-validated']) {
    const ledger = bearer ? join(root, 'changes', focused, bearer.generates) : undefined;
    const unticked = ledger ? verdictUnticked(ledger, verdict) : true;
    if (unticked) {
      console.error(`not closed — tick '${verdict}' in ${bearer?.generates ?? 'the ledger'} first, then: eospec close`);
      process.exit(1);
    }
  }
  const at = utcNowStamp();
  const planPath = bearer ? join(root, 'changes', focused, '3-plan.md') : undefined;
  const ledgerPath = bearer ? join(root, 'changes', focused, bearer.generates) : undefined;
  const ledgerText = ledgerPath && existsSync(ledgerPath) ? readFileSync(ledgerPath, 'utf8') : '';
  const offenses = bearer ? ledgerOffenses(ledgerText, planPath, verdict) : [];
  if (offenses.length > 0) {
    console.error(`not closed — the ledger owes its own laws:\n${offenses.map((o) => `  - ${o}`).join('\n')}\n  fix the lines, then: eospec close`);
    process.exit(1);
  }
  writeChangeMeta(root, focused, {
    'x-validated': at,
    'x-validated_at': at,
    ...(bearer ? { [`x-validated_${bearer.id}`]: at } : {}),
  });
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
