/**
 * pios-gate — the gate as a feature extension of openspec (plain JS:
 * node refuses type-stripping under node_modules, so installed bins must
 * not be TypeScript).
 *
 *   pios-gate grant <slug> <artifact-id>
 *                               the canonical grant — the declared word
 *                               id, inspect's row number, or the
 *                               generated file (artifact/section id-path
 *                               for sub-grants); structure and gated
 *                               sections checked before stamping
 *   pios-gate act <slug>       the next act in one line — derived at read
 *                              time, never stored; what renderers relay
 *   pios-gate next <slug>       the uniform act — grants the first
 *                               ungranted artifact in declared sequence;
 *                               every verb-less schema's step verb
 *   pios-gate <verb> <slug>    an x-grant-verb the change's schema
 *                               declares (vocabulary from data, not code)
 *   pios-gate approve <slug> [artifact-id]
 *                               canonical stamp; none given = all
 *                               remaining artifacts on a gated schema, legacy
 *                               status-only otherwise)
 *   pios-gate confirm <slug>    permits verdict-line [x] flips
 *   pios-gate pending           the cockpit — every change, next acts
 *   pios-gate inspect <slug>    one change, verbose (own verb: `show`
 *                               stays openspec's passthrough)
 *   pios-gate focus             teaching: focus is a session instrument
 *   pios-gate pause|resume      teaching: pause is a session act — say
 *                               "pause 30m" in the session
 *   pios-gate help              the gate's own usage (bare invocation too)
 *   pios-gate <anything else>   exec openspec <argv> verbatim, exit code
 *                               intact — exec, never interpretation —
 *                               EXCEPT grant-shaped verbs (any schema's
 *                               x-grant-verb): those resolve or fail loudly,
 *                               never passthrough (live-caught 2026-10-23)
 *
 * Reserved words never forward. Human terminal only: the gate's
 * approval-touch guard blocks tool-call invocations of every grant
 * surface, reserved or declared.
 */
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  artifactForGrantVerb,
  completionLine,
  findOpenspecRoot,
  grantedSet,
  grantArtifact,
  grantVerbVocabulary,
  pendingAct,
  pendingReport,
  readChangeMeta,
  resolveChangeSchema,
  schemaIsGated,
  showReport,
  utcNowStamp,
  writeChangeMeta,
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

const doGrant = (root, s, artifactId) => {
  const result = grantArtifact(root, s, artifactId);
  if (!result.ok) {
    console.error(result.error);
    process.exit(1);
  }
  console.log(
    result.completed
      ? `granted ${s} · ${result.granted} · all artifacts granted — status: approved · at ${result.at}${result.verdict ? ` · next: tick '${result.verdict}' then: pios-gate confirm ${s}` : ''}`
      : `granted ${s} · ${result.granted} · at ${result.at}${result.next ? ` · next: ${result.next}` : ''}`,
  );
  process.exit(0);
};

if (command === 'pending') {
  console.log(pendingReport(rootOf()));
  process.exit(0);
}

if (command === 'inspect') {
  const root = rootOf();
  changeOrDie(root, slug, 'usage: pios-gate inspect <change-slug>');
  console.log(showReport(root, slug));
  process.exit(0);
}

if (command === 'focus') {
  console.log('focus is a session instrument — set it with your cockpit/status tools (openspec_focus), not the terminal');
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

  pios-gate pending                     the cockpit — every change, next acts
  pios-gate inspect <slug>              one change, verbose
  pios-gate grant <slug> <artifact-id>  canonical grant (id · row# · file · artifact/section)
  pios-gate next <slug>                 the uniform act: first ungranted artifact
  pios-gate act <slug>                  the next act in one line — for humans and renderers
  pios-gate <verb> <slug>               an x-grant-verb the change's schema declares
  pios-gate approve <slug> [artifact]   canonical stamp — legacy whole-change only
  pios-gate confirm <slug>              permits the declared verdict-line flip
  pios-gate pause|resume                teaching: pause is a session act — say it in the session
  pios-gate validate <args>             openspec's structure lint (passthrough)
  pios-gate <anything else>             exec openspec verbatim, exit code intact

Grants are human-terminal: approve, confirm, grant, next, and every
declared verb refuse tool-call invocations.`);
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
// time, never stored; what renderers relay (placement, never truth)
if (command === 'act') {
  const root = rootOf();
  changeOrDie(root, slug, 'usage: pios-gate act <change-slug>');
  const meta = readChangeMeta(root, slug);
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
  console.log(pendingAct(root, slug, resolution.schema, grantedSet(meta)) ?? completionLine(resolution.schema, meta));
  process.exit(0);
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
    const verbs = resolution.schema.artifacts
      .filter((a) => a.grantVerb)
      .map((a) => a.grantVerb)
      .join(', ');
    console.error(`pios-gate: '${meta.schema}' is gated — approve is per-step:`);
    console.error(`   pios-gate <verb> ${slug}   (verbs: ${verbs})`);
    console.error(`   pios-gate grant ${slug} <step-id>`);
    process.exit(1);
  }
  writeChangeMeta(root, slug, { status: 'approved', approved_at: at });
  console.log(`approved ${slug} · at ${at}`);
  process.exit(0);
}

// schema-declared verb: pios-gate <x-grant-verb> <slug>
// Grant-shaped input never falls through to openspec verbatim
// (live-caught 2026-10-23: the silent skip let openspec answer
// "unknown command" for the schema's own verbs).
if (command && slug) {
  const root = findOpenspecRoot(process.cwd());
  const vocab = root ? grantVerbVocabulary(root) : new Map();
  if (vocab.has(command)) {
    if (!root) {
      console.error('pios-gate: no openspec/changes/ found (walked up from cwd)');
      process.exit(1);
    }
    if (!existsSync(join(root, 'changes', slug))) {
      console.error(`no such change: ${slug} (under ${root}/changes/)`);
      process.exit(1);
    }
    const meta = readChangeMeta(root, slug);
    const resolution = resolveChangeSchema(root, meta.schema);
    if (!resolution.ok) {
      console.error(`pios-gate: schema problem for '${slug}' — ${resolution.reason}`);
      process.exit(1);
    }
    if (!schemaIsGated(resolution.schema)) {
      console.error(`pios-gate: schema '${meta.schema}' declares no gates — use: pios-gate approve ${slug}`);
      process.exit(1);
    }
    const artifact = artifactForGrantVerb(resolution.schema, command);
    if (!artifact) {
      const verbs = resolution.schema.artifacts
        .filter((a) => a.grantVerb)
        .map((a) => a.grantVerb)
        .join(', ');
      console.error(`pios-gate: '${command}' is declared by schema '${vocab.get(command)}', not by '${meta.schema}' — verbs here: ${verbs}`);
      process.exit(1);
    }
    doGrant(root, slug, artifact.id);
  }
}

if (command === 'confirm') {
  const root = rootOf();
  changeOrDie(root, slug, 'usage: pios-gate confirm <change-slug>');
  const at = utcNowStamp();
  writeChangeMeta(root, slug, { validated: at, validated_at: at });
  console.log(`confirmed ${slug} · at ${at}`);
  process.exit(0);
}

// everything else: exec openspec verbatim — no arg rewriting, ever —
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
