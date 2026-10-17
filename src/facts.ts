/**
 * Gate facts — events are facts via pi.appendEntry, never rendered here.
 * Fact types are namespaced and versioned; any future reader (a cockpit)
 * consumes them. Durable, outside LLM context, part of the session record.
 */
export const FACT = {
  blocked: 'pi-openspec-gate.blocked.v1',
  declared: 'pi-openspec-gate.declared.v1',
  attributed: 'pi-openspec-gate.attributed.v1',
  exempt: 'pi-openspec-gate.exempt.v1',
  inherited: 'pi-openspec-gate.inherited.v1',
  instrument: 'pi-openspec-gate.instrument.v1',
  unapproved: 'pi-openspec-gate.unapproved.v1',
  humangate: 'pi-openspec-gate.humangate.v1',
  creationStamped: 'pi-openspec-gate.creation-stamped.v1',
} as const;

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
