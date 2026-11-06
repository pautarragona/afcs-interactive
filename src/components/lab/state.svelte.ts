import { fromOmegaZeta, metrics, type PolePair } from '../../sim/secondOrder';
import zone from '../../data/target-zone.json';

/** Starting pose: s = -1.2 ± 2.4j (zeta ≈ 0.45, about 21 % overshoot). */
export const START: PolePair = { sigma: 1.2, omegaD: 2.4 };
export const T_END = 6;

/** Shared state for every island on a lesson page (bench, observe box, quick checks, challenge). */
export const lab = $state({
  poles: { ...START } as PolePair,
  previous: null as PolePair | null,
  /** True while a pole or dial is being dragged. */
  dragging: false,
  /** Directions the student has moved the poles in, used to judge observations. */
  moved: { up: false, down: false, left: false, right: false },
  /** Playback time in seconds while the response is being played, otherwise null. */
  playT: null as number | null,
});

export const spec = zone.spec;

export function meetsSpec(p: PolePair = lab.poles) {
  const m = metrics(p);
  return {
    overshoot: m.overshootPct !== null && m.overshootPct < spec.maxOvershootPct,
    settling: m.settlingTime !== null && m.settlingTime < spec.maxSettlingTime,
  };
}

/** Call when a drag or key nudge starts, so the previous pose shows as a ghost. */
export function beginMove() {
  lab.previous = { ...lab.poles };
}

const round2 = (v: number) => Math.round(v * 100) / 100;

export function setPoles(next: PolePair) {
  const prev = lab.poles;
  const d = 0.02;
  next = { sigma: round2(next.sigma), omegaD: round2(Math.max(0, next.omegaD)) };
  if (next.omegaD > prev.omegaD + d) lab.moved.up = true;
  if (next.omegaD < prev.omegaD - d) lab.moved.down = true;
  if (next.sigma > prev.sigma + d) lab.moved.left = true;
  if (next.sigma < prev.sigma - d) lab.moved.right = true;
  lab.poles = next;
}

/** Set damping ratio, keeping the natural frequency (stable poles only). */
export function setZeta(zeta: number) {
  const m = metrics(lab.poles);
  setPoles(fromOmegaZeta(Math.max(0.2, m.omegaN), Math.min(1, Math.max(0, zeta))));
}

/** Set natural frequency, keeping the damping ratio (stable poles only). */
export function setOmegaN(omegaN: number) {
  const m = metrics(lab.poles);
  setPoles(fromOmegaZeta(Math.max(0.2, omegaN), Math.min(1, Math.max(0, m.zeta))));
}

export function reset() {
  lab.previous = { ...lab.poles };
  lab.poles = { ...START };
}

let raf = 0;
/** Play the step response in real time, driving lab.playT from 0 to T_END. */
export function play() {
  cancelAnimationFrame(raf);
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { lab.playT = T_END; return; }
  const t0 = performance.now();
  const tick = (now: number) => {
    const t = (now - t0) / 1000;
    lab.playT = Math.min(t, T_END);
    if (t < T_END) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
