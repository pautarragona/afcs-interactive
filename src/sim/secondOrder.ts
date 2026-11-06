/**
 * Second-order system defined by a conjugate pole pair s = -sigma ± j*omegaD,
 * normalised to unit DC gain:  G(s) = (sigma² + omegaD²) / ((s + sigma)² + omegaD²).
 *
 * sigma  > 0 : stable (poles in the left half-plane)
 * sigma  = 0 : marginally stable (poles on the imaginary axis)
 * sigma  < 0 : unstable
 * omegaD = 0 : repeated real pole (critically damped when sigma > 0)
 */

export interface PolePair {
  /** Negative of the real part of the poles (1/s). Positive means stable. */
  sigma: number;
  /** Imaginary part of the upper pole, the damped frequency (rad/s). Must be >= 0. */
  omegaD: number;
}

export type Stability = 'stable' | 'marginal' | 'unstable';

export interface Metrics {
  stability: Stability;
  /** Natural frequency |s| (rad/s). */
  omegaN: number;
  /** Damping ratio sigma / omegaN. Negative when unstable. */
  zeta: number;
  /** Percent overshoot of a unit step, null when it never settles. */
  overshootPct: number | null;
  /** Time of the first peak (s), null when there is no overshoot or no settling. */
  peakTime: number | null;
  /** Exact 2 % settling time (s), null when it never settles. */
  settlingTime: number | null;
  /** Textbook estimate 4 / (zeta * omegaN) = 4 / sigma (s), null when not stable. */
  settlingTimeEstimate: number | null;
}

const EPS = 1e-9;

/** Unit-step response y(t) for the pole pair. */
export function stepResponse(p: PolePair, t: number): number {
  const { sigma, omegaD } = p;
  if (t <= 0) return 0;
  if (Math.abs(sigma) < EPS && omegaD < EPS) return NaN; // pole at the origin: no finite DC gain
  if (omegaD < EPS) {
    // repeated real pole at -sigma: y = 1 - e^{-sigma t}(1 + sigma t)
    return 1 - Math.exp(-sigma * t) * (1 + sigma * t);
  }
  return 1 - Math.exp(-sigma * t) * (Math.cos(omegaD * t) + (sigma / omegaD) * Math.sin(omegaD * t));
}

/** Sample the step response on [0, tEnd] with n points. */
export function sampleStep(p: PolePair, tEnd: number, n = 241): { t: number[]; y: number[] } {
  const t: number[] = new Array(n);
  const y: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    t[i] = (tEnd * i) / (n - 1);
    y[i] = stepResponse(p, t[i]);
  }
  return { t, y };
}

/** Time after which the response is guaranteed to stay inside the ±tol band. */
function envelopeBound(p: PolePair, tol: number): number {
  const { sigma, omegaD } = p;
  if (omegaD < EPS) {
    // e^{-sigma t}(1 + sigma t) <= tol; solve by stepping (monotone decreasing for t > 0)
    let t = 1 / sigma;
    while (Math.exp(-sigma * t) * (1 + sigma * t) > tol) t *= 1.25;
    return t;
  }
  const amp = Math.sqrt(1 + (sigma / omegaD) ** 2);
  return Math.log(amp / tol) / sigma;
}

/** Exact settling time into the ±tol band (default 2 %), found by scanning then bisecting. */
export function settlingTime(p: PolePair, tol = 0.02): number | null {
  if (p.sigma <= EPS) return null;
  const tMax = envelopeBound(p, tol);
  const n = 4000;
  const outside = (t: number) => Math.abs(stepResponse(p, t) - 1) > tol;
  let last = -1;
  for (let i = n; i >= 0; i--) {
    const t = (tMax * i) / n;
    if (outside(t)) {
      last = t;
      break;
    }
  }
  if (last < 0) return 0;
  let lo = last;
  let hi = Math.min(tMax, last + tMax / n);
  for (let k = 0; k < 50; k++) {
    const mid = 0.5 * (lo + hi);
    if (outside(mid)) lo = mid;
    else hi = mid;
  }
  return hi;
}

export function metrics(p: PolePair): Metrics {
  const { sigma, omegaD } = p;
  const omegaN = Math.hypot(sigma, omegaD);
  const zeta = omegaN > EPS ? sigma / omegaN : 1;
  const stability: Stability = sigma > EPS ? 'stable' : sigma < -EPS ? 'unstable' : 'marginal';

  if (stability !== 'stable') {
    return {
      stability,
      omegaN,
      zeta,
      overshootPct: null,
      peakTime: null,
      settlingTime: null,
      settlingTimeEstimate: null,
    };
  }

  const underdamped = omegaD > EPS;
  const overshootPct = underdamped ? 100 * Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)) : 0;
  return {
    stability,
    omegaN,
    zeta,
    overshootPct,
    peakTime: underdamped ? Math.PI / omegaD : null,
    settlingTime: settlingTime(p),
    settlingTimeEstimate: 4 / sigma,
  };
}

/** Pole pair from natural frequency and damping ratio (0 <= zeta <= 1). */
export function fromOmegaZeta(omegaN: number, zeta: number): PolePair {
  return { sigma: zeta * omegaN, omegaD: omegaN * Math.sqrt(Math.max(0, 1 - zeta * zeta)) };
}
