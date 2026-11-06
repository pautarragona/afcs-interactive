/**
 * General linear time-invariant tools for the lessons: polynomials, roots, transfer
 * functions, closed loops, time simulation, frequency response, margins and root locus.
 * Polynomials are coefficient arrays, highest power first: [1, 2, 3] = s² + 2s + 3.
 * Verified against python-control in tests/lti.test.ts.
 */

export type Poly = number[];
export interface C { re: number; im: number }
export interface TF { num: Poly; den: Poly }

// ---------- polynomials ----------
export const trim = (p: Poly): Poly => { let i = 0; while (i < p.length - 1 && Math.abs(p[i]) < 1e-14) i++; return p.slice(i); };
export function pmul(a: Poly, b: Poly): Poly {
  const out = new Array(a.length + b.length - 1).fill(0);
  a.forEach((ai, i) => b.forEach((bj, j) => (out[i + j] += ai * bj)));
  return out;
}
export function padd(a: Poly, b: Poly): Poly {
  const n = Math.max(a.length, b.length);
  const A = [...new Array(n - a.length).fill(0), ...a];
  const B = [...new Array(n - b.length).fill(0), ...b];
  return trim(A.map((v, i) => v + B[i]));
}
export const pscale = (a: Poly, k: number): Poly => a.map((v) => v * k);
/** Polynomial with the given (real or conjugate-paired) roots. */
export function fromRoots(roots: C[]): Poly {
  let re: Poly = [1];
  const used = new Set<number>();
  roots.forEach((r, i) => {
    if (used.has(i)) return;
    if (Math.abs(r.im) < 1e-12) { re = pmul(re, [1, -r.re]); return; }
    const j = roots.findIndex((q, k) => k !== i && !used.has(k) && Math.abs(q.re - r.re) < 1e-9 && Math.abs(q.im + r.im) < 1e-9);
    if (j >= 0) used.add(j);
    re = pmul(re, [1, -2 * r.re, r.re * r.re + r.im * r.im]);
  });
  return re;
}

// ---------- complex helpers ----------
const cadd = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im });
const csub = (a: C, b: C): C => ({ re: a.re - b.re, im: a.im - b.im });
const cmul = (a: C, b: C): C => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const cdiv = (a: C, b: C): C => { const d = b.re * b.re + b.im * b.im; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }; };
export const cabs = (a: C) => Math.hypot(a.re, a.im);
export function peval(p: Poly, s: C): C {
  let acc: C = { re: 0, im: 0 };
  for (const c of p) acc = cadd(cmul(acc, s), { re: c, im: 0 });
  return acc;
}

/** All roots of a polynomial (Durand–Kerner), cleaned so conjugate pairs and real roots are exact. */
export function roots(pIn: Poly): C[] {
  const p = trim(pIn);
  const n = p.length - 1;
  if (n < 1) return [];
  const a = p.map((c) => c / p[0]);
  if (n === 1) return [{ re: -a[1], im: 0 }];
  if (n === 2) {
    const d = a[1] * a[1] - 4 * a[2];
    if (d >= 0) { const s = Math.sqrt(d); return [{ re: (-a[1] - s) / 2, im: 0 }, { re: (-a[1] + s) / 2, im: 0 }]; }
    const s = Math.sqrt(-d) / 2; return [{ re: -a[1] / 2, im: s }, { re: -a[1] / 2, im: -s }];
  }
  const R = 1 + Math.max(...a.slice(1).map(Math.abs));
  let z: C[] = Array.from({ length: n }, (_, k) => ({ re: R * Math.cos((2 * Math.PI * k) / n + 0.4), im: R * Math.sin((2 * Math.PI * k) / n + 0.4) }));
  for (let it = 0; it < 500; it++) {
    let delta = 0;
    z = z.map((zi, i) => {
      let den: C = { re: 1, im: 0 };
      z.forEach((zj, j) => { if (j !== i) den = cmul(den, csub(zi, zj)); });
      const step = cdiv(peval(a, zi), den);
      delta = Math.max(delta, cabs(step));
      return csub(zi, step);
    });
    if (delta < 1e-13) break;
  }
  return z.map((r) => (Math.abs(r.im) < 1e-7 * (1 + Math.abs(r.re)) ? { re: r.re, im: 0 } : r)).sort((u, v) => u.re - v.re || v.im - u.im);
}

// ---------- transfer functions ----------
export const tf = (num: Poly, den: Poly): TF => ({ num: trim(num), den: trim(den) });
export const series = (a: TF, b: TF): TF => tf(pmul(a.num, b.num), pmul(a.den, b.den));
/** Negative feedback: forward G, feedback H. */
export const feedback = (G: TF, H: TF = tf([1], [1])): TF =>
  tf(pmul(G.num, H.den), padd(pmul(G.den, H.den), pmul(G.num, H.num)));
export const gain = (G: TF, k: number): TF => tf(pscale(G.num, k), G.den);
export const poles = (G: TF) => roots(G.den);
export const zeros = (G: TF) => roots(G.num);
export function dcGain(G: TF): number {
  const n = G.num[G.num.length - 1], d = G.den[G.den.length - 1];
  return Math.abs(d) < 1e-14 ? Infinity : n / d;
}
/** Second-order Padé approximation of a pure delay e^(-tau s). */
export function pade(tau: number): TF {
  if (tau <= 0) return tf([1], [1]);
  return tf([tau * tau / 12, -tau / 2, 1], [tau * tau / 12, tau / 2, 1]);
}

// ---------- time simulation ----------
export interface SS { A: number[][]; B: number[]; C: number[]; D: number }
/** Controllable canonical realisation of a proper transfer function. */
export function toSS(G: TF): SS {
  const den = G.den.map((c) => c / G.den[0]);
  const n = den.length - 1;
  let num = G.num.map((c) => c / G.den[0]);
  num = [...new Array(n + 1 - num.length).fill(0), ...num];
  const D = num[0];
  const b = num.slice(1).map((v, i) => v - D * den[i + 1]); // strictly proper part, highest first
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i < n - 1 ? (j === i + 1 ? 1 : 0) : -den[n - j])));
  const B = Array.from({ length: n }, (_, i) => (i === n - 1 ? 1 : 0));
  const Cv = Array.from({ length: n }, (_, j) => b[n - 1 - j]);
  return { A, B, C: Cv, D };
}

/** Fixed-step RK4 integration of dx/dt = f(t, x). */
export function rk4(f: (t: number, x: number[]) => number[], x0: number[], tEnd: number, steps: number, onStep?: (t: number, x: number[]) => void) {
  const h = tEnd / steps;
  let x = [...x0];
  onStep?.(0, x);
  for (let k = 0; k < steps; k++) {
    const t = k * h;
    const k1 = f(t, x);
    const k2 = f(t + h / 2, x.map((v, i) => v + (h / 2) * k1[i]));
    const k3 = f(t + h / 2, x.map((v, i) => v + (h / 2) * k2[i]));
    const k4 = f(t + h, x.map((v, i) => v + h * k3[i]));
    x = x.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    onStep?.(t + h, x);
  }
  return x;
}

/** Response of G to an input u(t), sampled at n points on [0, tEnd]. */
export function simulate(G: TF, u: (t: number) => number, tEnd: number, n = 301): { t: number[]; y: number[] } {
  const { A, B, C: Cv, D } = toSS(G);
  const sub = Math.max(4, Math.ceil(tEnd / ((n - 1) * 0.004)));
  const steps = (n - 1) * sub;
  const t: number[] = [], y: number[] = [];
  const f = (tt: number, x: number[]) => A.map((row, i) => row.reduce((s, a, j) => s + a * x[j], 0) + B[i] * u(tt));
  let k = 0;
  rk4(f, new Array(A.length).fill(0), tEnd, steps, (tt, x) => {
    if (k % sub === 0) { t.push(tt); y.push(Cv.reduce((s, c, j) => s + c * x[j], 0) + D * u(tt)); }
    k++;
  });
  return { t, y };
}
export const step = (G: TF, tEnd: number, n = 301) => simulate(G, (t) => (t >= 0 ? 1 : 0), tEnd, n);

/** Overshoot (percent of final value) and exact settling time into ±band of the final value. */
export function stepInfo(t: number[], y: number[], yFinal: number, band = 0.02) {
  const peak = Math.max(...y);
  const overshootPct = yFinal !== 0 ? Math.max(0, (100 * (peak - yFinal)) / Math.abs(yFinal)) : 0;
  let ts: number | null = null;
  for (let i = y.length - 1; i >= 0; i--) {
    if (Math.abs(y[i] - yFinal) > band * Math.abs(yFinal)) { ts = i === y.length - 1 ? null : t[i + 1]; break; }
    if (i === 0) ts = 0;
  }
  return { overshootPct, settlingTime: ts, peak };
}

// ---------- frequency response ----------
export function freq(G: TF, w: number, delay = 0): { mag: number; phaseDeg: number; c: C } {
  const s = { re: 0, im: w };
  let c = cdiv(peval(G.num, s), peval(G.den, s));
  if (delay > 0) c = cmul(c, { re: Math.cos(-w * delay), im: Math.sin(-w * delay) });
  return { mag: cabs(c), phaseDeg: (Math.atan2(c.im, c.re) * 180) / Math.PI, c };
}
export const logspace = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => 10 ** (a + ((b - a) * i) / (n - 1)));

/** Bode data with unwrapped phase (delay phase added exactly). */
export function bode(G: TF, w: number[], delay = 0) {
  const mag: number[] = [], phase: number[] = [];
  let prev = 0;
  w.forEach((wi, i) => {
    const r = freq(G, wi, 0);
    let ph = r.phaseDeg;
    if (i > 0) { while (ph - prev > 180) ph -= 360; while (ph - prev < -180) ph += 360; }
    else {
      // start near the low-frequency asymptote: -90° per pure integrator
      const nInt = G.den.length - trim(G.den).length + countTrailingZeros(G.den) - countTrailingZeros(G.num);
      const target = -90 * nInt;
      while (ph - target > 180) ph -= 360; while (ph - target < -180) ph += 360;
    }
    prev = ph;
    mag.push(20 * Math.log10(r.mag));
    phase.push(ph - (wi * delay * 180) / Math.PI);
  });
  return { w, magDb: mag, phaseDeg: phase };
}
function countTrailingZeros(p: Poly) { let k = 0; for (let i = p.length - 1; i > 0 && Math.abs(p[i]) < 1e-14; i--) k++; return k; }

/** Gain margin (dB), phase margin (deg) and their crossover frequencies, from a dense Bode sweep. */
export function margins(G: TF, delay = 0, wMin = -3, wMax = 3) {
  const w = logspace(wMin, wMax, 4000);
  const b = bode(G, w, delay);
  let wc: number | null = null, pm: number | null = null, w180: number | null = null, gm: number | null = null;
  for (let i = 1; i < w.length; i++) {
    if (wc === null && b.magDb[i - 1] >= 0 && b.magDb[i] < 0) {
      const f = b.magDb[i - 1] / (b.magDb[i - 1] - b.magDb[i]);
      wc = w[i - 1] * (w[i] / w[i - 1]) ** f;
      const ph = b.phaseDeg[i - 1] + f * (b.phaseDeg[i] - b.phaseDeg[i - 1]);
      pm = 180 + ph;
    }
    if (w180 === null && (b.phaseDeg[i - 1] + 180) * (b.phaseDeg[i] + 180) < 0) {
      const f = (b.phaseDeg[i - 1] + 180) / (b.phaseDeg[i - 1] - b.phaseDeg[i]);
      w180 = w[i - 1] * (w[i] / w[i - 1]) ** f;
      gm = -(b.magDb[i - 1] + f * (b.magDb[i] - b.magDb[i - 1]));
    }
  }
  return { wc, pm, w180, gm };
}

// ---------- root locus ----------
/** Closed-loop pole branches of 1 + K·G(s) = 0 for the gains given, sorted for continuity. */
export function rootLocus(G: TF, gains: number[]): C[][] {
  const branches: C[][] = [];
  let prev: C[] | null = null;
  for (const k of gains) {
    let r = roots(padd(G.den, pscale(G.num, k)));
    if (prev) {
      const left = [...r];
      r = prev.map((p) => {
        let best = 0, bd = Infinity;
        left.forEach((q, i) => { const d = Math.hypot(q.re - p.re, q.im - p.im); if (d < bd) { bd = d; best = i; } });
        return left.splice(best, 1)[0];
      });
    }
    r.forEach((p, i) => (branches[i] ??= []).push(p));
    prev = r;
  }
  return branches;
}
