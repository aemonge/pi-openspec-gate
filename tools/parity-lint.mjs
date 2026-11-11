#!/usr/bin/env node
/**
 * parity-lint — the doc↔CLI parity law, executed.
 *
 * Fails the build on drift in either direction:
 *   1. every eospec verb the docs teach must be a verb the bin answers
 *   2. every verb the bin answers must be taught in the README
 *   3. every `eospec <verb>` string in gate source must use an alive verb
 *      (dead verbs may not teach, even in comments that render)
 *   4. the facts src declares and the facts the README documents are the
 *      same set
 *   5. every eospec string example/try.sh asserts uses an alive verb
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const failures = [];
const fail = (msg) => failures.push(msg);

// ── 1. the verbs the bin answers ──────────────────────────────────────
const binSrc = read('bin/eospec.js');
const alive = new Set([...binSrc.matchAll(/command === '([\w-]+)'/g)].map((m) => m[1]));
alive.add('--'); // the escape hatch is part of the surface
if (!alive.has('focus') || !alive.has('approve') || !alive.has('close')) {
  fail(`bin/eospec.js stopped answering the three words: ${[...alive].join(', ')}`);
}

// ── 2. the verbs the docs teach (README fenced invocations) ───────────
const readme = read('README.md');
const taught = new Set();
for (const m of readme.matchAll(/^\s*eospec\s+(--|[\w-]+)/gmu)) taught.add(m[1]);
for (const v of taught) {
  if (!alive.has(v)) fail(`README teaches 'eospec ${v}' — the bin does not answer it`);
}
for (const v of ['focus', 'approve', 'close']) {
  if (!taught.has(v)) fail(`README never teaches 'eospec ${v}' — the bin answers it`);
}

// ── 3. teaching strings across gate source ────────────────────────────
const sourceFiles = ['bin/eospec.js', 'bin/gate-lib.js', 'src/gate.ts', 'src/approval.ts', 'src/focus.ts', 'src/config.ts'];
for (const file of sourceFiles) {
  const text = read(file)
    // prose exemption: the room-file comment is the human's design line,
    // not an invocation ('writes' is an English verb there)
    .replace(/eospec writes, verbs refresh/g, '');
  for (const m of text.matchAll(/eospec\s+([\w-]+)/g)) {
    const v = m[1];
    if (v === 'eospec') continue; // the package name mentioning itself
    if (!alive.has(v)) fail(`${file}: teaching string 'eospec ${v}' — a dead verb renders`);
  }
}

// ── 4. facts parity ───────────────────────────────────────────────────
const factsSrc = new Set([...read('src/facts.ts').matchAll(/'(gate\.[a-z-]+)'/g)].map((m) => m[1]));
const factsDocs = new Set([...readme.matchAll(/`(gate\.[a-z-]+)`/g)].map((m) => m[1]));
for (const f of factsSrc) if (!factsDocs.has(f)) fail(`src/facts.ts declares '${f}' — README never documents it`);
for (const f of factsDocs) if (!factsSrc.has(f)) fail(`README documents '${f}' — src/facts.ts never declares it`);

// ── 5. try.sh assertions ──────────────────────────────────────────────
const trySh = read('example/try.sh');
for (const m of trySh.matchAll(/^expect(?:_fail)? '([^']*)'/gmu)) {
  for (const vm of m[1].matchAll(/eospec\s+([\w-]+)/g)) {
    if (!alive.has(vm[1])) fail(`example/try.sh asserts 'eospec ${vm[1]}' — the bin does not answer it`);
  }
}
for (const m of trySh.matchAll(/"\$GATE"\s+([\w-]+)/g)) {
  if (!alive.has(m[1])) fail(`example/try.sh invokes "$GATE" ${m[1]} — the bin does not answer it`);
}

if (failures.length > 0) {
  console.error(`doc↔CLI parity law violated — ${failures.length} drift(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`doc↔cli parity holds — ${alive.size - 1} verbs, ${factsSrc.size} facts, docs and source agree`);
