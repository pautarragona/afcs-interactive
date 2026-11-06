import { metrics, type PolePair } from '../../sim/secondOrder';
import zone from '../../data/target-zone.json';

/** Starting pose: s = -1.2 ± 2.4j (zeta ≈ 0.45, about 21 % overshoot). */
export const START: PolePair = { sigma: 1.2, omegaD: 2.4 };

/** Shared state for every island on a lesson page (s-plane, plot, observe box, challenge). */
export const lab = $state({
  poles: { ...START } as PolePair,
  previous: null as PolePair | null,
  /** True while a pole is being dragged. */
  dragging: false,
  /** Directions the student has moved the poles in, used to judge observations. */
  moved: { up: false, down: false, left: false, right: false },
});

export const spec = zone.spec;

export function current() {
  return metrics(lab.poles);
}

export function meetsSpec(p: PolePair = lab.poles) {
  const m = metrics(p);
  return {
    overshoot: m.overshootPct !== null && m.overshootPct < spec.maxOvershootPct,
    settling: m.settlingTime !== null && m.settlingTime < spec.maxSettlingTime,
  };
}

/** Call when a drag or key nudge starts, so the previous pose can be shown as a ghost. */
export function beginMove() {
  lab.previous = { ...lab.poles };
}

export function setPoles(next: PolePair) {
  const prev = lab.poles;
  const d = 0.02;
  if (next.omegaD > prev.omegaD + d) lab.moved.up = true;
  if (next.omegaD < prev.omegaD - d) lab.moved.down = true;
  if (next.sigma > prev.sigma + d) lab.moved.left = true;
  if (next.sigma < prev.sigma - d) lab.moved.right = true;
  lab.poles = next;
}

export function reset() {
  lab.previous = { ...lab.poles };
  lab.poles = { ...START };
}
