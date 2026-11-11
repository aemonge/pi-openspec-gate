/**
 * Gate facts — events are facts via pi.appendEntry, never rendered here.
 * Fact types are namespaced and versioned; any future reader (a cockpit)
 * consumes them. Durable, outside LLM context, part of the session record.
 */
export const FACT = {
  blocked: 'gate.blocked',
  declared: 'gate.declared',
  attributed: 'gate.attributed',
  exempt: 'gate.exempt',
  inherited: 'gate.inherited',
  instrument: 'gate.instrument',
  unapproved: 'gate.unapproved',
  humangate: 'gate.human-gate',
  creationStamped: 'gate.creation-stamped',
  phasegate: 'gate.phase-gate',
  selfDeclare: 'gate.self-declare',
  pause: 'gate.pause',
} as const;

/** An assistant message carried a declare phrase — a self-declaration
 *  attempt. The latch refused (user messages only); the fact records the
 *  attempt and the next block carries the correction. */
export type SelfDeclareFact = {
  words: string;
  at: string;
};

export type FactAppender = (customType: string, data?: unknown) => void;

export type BlockedFact = {
  tool: string;
  paths: string[];
  basis: string;
  at: string;
};

export type DeclaredFact = {
  tool: string;
  words: string;
  paths: string[];
  at: string;
};

export type AttributedFact = {
  tool: string;
  change: string;
  taskId?: string;
  paths: string[];
  basis: string;
  at: string;
};

export type ExemptFact = {
  tool: string;
  category: string;
  prefix: string;
  paths: string[];
  at: string;
};

export type InheritedFact = {
  parentSessionId: string;
  change: string;
  taskId?: string;
  at: string;
};

export type InstrumentFact = {
  tool: string;
  at: string;
};

export function utcNow(): string {
  return `${new Date().toISOString().replace(/\.\d{3}Z$/u, 'Z')}`;
}
