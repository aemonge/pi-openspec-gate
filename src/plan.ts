/**
 * plan.md model — the micro schema's single artifact.
 *
 * Parsing is line-based (zero deps, house style), mirrored in
 * bin/gate-lib.js (contract-tested twins). Checkbox counts exclude the
 * declared verdict line — the human's hands-on act is never agent work.
 * `### ` headings are slices; any other heading leaves the slice; the
 * bare line `slice-gates: true` opts a plan into per-slice pausing
 * (approve advances, --all unlocks all).
 */

export type PlanSlice = {
  title: string;
  open: number;
  done: number;
};

export type PlanModel = {
  /** unticked checkboxes, excluding the verdict line */
  open: number;
  /** ticked checkboxes, excluding the verdict line */
  done: number;
  /** the declared verdict line's tick state, when a verdict is declared */
  verdictTicked: boolean | undefined;
  /** ### headings, in order, with their own checkbox counts */
  slices: PlanSlice[];
  /** the `slice-gates: true` marker — per-slice pausing is on */
  sliceGates: boolean;
};

const CHECKBOX = /^\s*[-*]\s*\[([ xX])\]/u;
const SLICE_HEADING = /^###\s+(.+?)\s*$/u;
const SLICE_GATES = /^\s*slice-gates:\s*true\s*$/u;

export function parsePlan(text: string, verdictLine?: string): PlanModel {
  const verdictRe = verdictLine
    ? new RegExp(verdictLine.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'i')
    : undefined;
  const model: PlanModel = { open: 0, done: 0, verdictTicked: undefined, slices: [], sliceGates: false };
  let current: PlanSlice | undefined;
  for (const line of text.split('\n')) {
    if (SLICE_GATES.test(line)) {
      model.sliceGates = true;
      continue;
    }
    if (/^#{1,6}\s/u.test(line)) {
      const slice = SLICE_HEADING.exec(line);
      if (slice) {
        current = { title: slice[1]!, open: 0, done: 0 };
        model.slices.push(current);
      } else {
        current = undefined; // Verification and friends leave the slice
      }
      continue;
    }
    const box = CHECKBOX.exec(line);
    if (!box) continue;
    const ticked = box[1] !== ' ';
    if (verdictRe?.test(line)) {
      model.verdictTicked = ticked; // the human's act — never counted as work
      continue;
    }
    if (ticked) {
      model.done += 1;
      if (current) current.done += 1;
    } else {
      model.open += 1;
      if (current) current.open += 1;
    }
  }
  return model;
}

/** Every task done — the verifying line. The verdict is the human's and
 *  never counts toward it. */
export function planComplete(model: PlanModel): boolean {
  return model.open === 0;
}
