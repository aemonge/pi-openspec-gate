import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { loadGateConfig, parseConfigString } from '../src/config.ts';

/**
 * Covers the live no-arg path that the 2026-10-14 protocol run proved broken:
 * config.json lives at the extension root (parent of src/), not beside this
 * module. Before the fix this returned DEFAULT_CONFIG (no exemptions) and the
 * live gate blocked exempt-path writes.
 */
describe('config root resolution (live path)', () => {
  test('no-arg load finds the extension-root config.json', () => {
    const config = loadGateConfig();
    assert.equal(config.enabled, true);
    assert.ok(config.exempt.length >= 3, `expected repo rules, got ${config.exempt.length}`);
    assert.ok(config.exempt.some((rule) => rule.prefix === '**/openspec/**'));
    assert.ok(config.exempt.some((rule) => rule.prefix === '**/docs/**'));
    assert.ok(config.exempt.some((rule) => rule.prefix === '**/skills/**'));
  });

  test('explicit nonexistent root falls back to enabled-with-no-exemptions', () => {
    const config = loadGateConfig('/nonexistent-gate-root');
    assert.deepEqual({ enabled: config.enabled, exempt: [...config.exempt] }, { enabled: true, exempt: [] });
  });
});

describe('readOnlyTools (research escape hatch)', () => {
  test('parsed, filtered, frozen when present', () => {
    const config = parseConfigString(
      JSON.stringify({ readOnlyTools: ['my_probe', 'team_search', '', 42, null] }),
    );
    assert.deepEqual([...(config.readOnlyTools ?? [])], ['my_probe', 'team_search']);
    assert.ok(Object.isFrozen(config.readOnlyTools));
  });

  test('absent key means no override', () => {
    const config = parseConfigString(JSON.stringify({ enabled: true }));
    assert.equal(config.readOnlyTools, undefined);
  });

  test('empty array means no override', () => {
    const config = parseConfigString(JSON.stringify({ readOnlyTools: [] }));
    assert.equal(config.readOnlyTools, undefined);
  });
});
