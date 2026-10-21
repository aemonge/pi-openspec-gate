/**
 * pi-openspec-gate — ladder gate for Pi.
 *
 * Accounting only, never permission: another layer owns permission; this gate
 * owns declaredness. Every mutating tool call must be one of:
 *   exempt     — path-scoped, always recorded as a fact
 *   attributed — the openspec focus names an active change; receipt appended
 *   declared   — the human said "action/execute the mission"; one visible
 *                debt line, then it proceeds
 *   blocked    — visible block, exact copy, with all three remedies
 *
 * Gate events are facts (pi.appendEntry); this extension never renders.
 * Handler failure blocks the call as a fail-safe.
 *
 * The protocol block (`context` handler) is the bridge teaching itself:
 * versioned with the gate, injected before every LLM call, so instructions
 * can never drift from the teeth that enforce them.
 */
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

import { loadGateConfig } from './src/config.ts';
import { createGate } from './src/gate.ts';

const PROTOCOL_BLOCK = `# openspec gate — declared-work protocol

You are working under pi-openspec-gate. The law: every mutation is
exempt-recorded, attributed to a focused change, declared by the human,
or blocked. Never permission — declaredness.

- Draft freely under openspec/** — but a gated schema's artifacts need
  human grants: drafting an artifact whose declared precedents are
  ungranted blocks until the human grants them in their terminal. When
  blocked, tell the human the exact grant command shown in the block
  reason — grants are theirs, never yours.
- When a block or error is unexpected or contradicts a schema you can
  read, report it to the human and STOP — never debug the engine, its
  binaries, or its installation; drift between installed vintages is the
  human's to cure.
- When a change becomes your work, set the cockpit instruments:
  openspec_focus names the change, subject mirrors its title — the
  footer row is the human's glance at the bridge.
- NEVER invoke the grant surface as tool calls — pios-gate or
  pi-openspec-gate with approve, confirm, grant, or any grant verb the
  project's schemas declare. Approval-touch is blocked and that is
  correct: approval is a human act.
- Source mutations need the schema-declared unlock on a focused change —
  the rung whose grant begins source work, else a completed ladder;
  attribution is not approval — or the human's literal "action the
  mission" / "execute the mission".
- The schema's declared verdict line is the human's verdict — never tick
  it; the human confirms via terminal (pios-gate confirm) or a literal
  VALID reply.
- Memory tools (mem_*) are instruments: ungated, recorded. Lifecycle
  capture (mem_session_summary, mem_capture_passive) is bookkeeping, not
  work — use them freely.
- The flow — rungs, verbs, sections, verdict, unlock — is schema data,
  never engine code. The manual lives in this package's skills (gate
  law).`;

export default function openspecGate(pi: ExtensionAPI): void {
  const config = loadGateConfig();
  if (!config.enabled) return;
  createGate(pi, config);

  // protocol block: injected before each LLM call, after every other
  // context handler — the gate teaches its own law, versioned with itself
  pi.on('context', (event) => {
    const messages = [...event.messages];
    messages.push({
      role: 'user',
      content: [{ type: 'text', text: PROTOCOL_BLOCK }],
    });
    return { messages };
  });
}
