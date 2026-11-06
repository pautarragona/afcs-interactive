import { describe, expect, it } from 'vitest';
import golden from './golden/lti.json';
import { dcGain, feedback, margins, roots, step, stepInfo, tf, poles, rootLocus } from '../src/sim/lti';

const sortC = (cs: { re: number; im: number }[]) => cs.map((c) => [c.re, c.im]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);

describe('LTI simulation matches python-control', () => {
  for (const c of golden.steps) {
    const G0 = tf(c.num, c.den);
    const G = c.closed ? feedback(G0) : G0;
    const r = step(G, 30, 3001);
    it(`${c.name}: step samples`, () => {
      for (const s of c.samples) {
        const i = Math.round((s.t / 30) * 3000);
        expect(r.y[i]).toBeCloseTo(s.y, 4);
      }
    });
    it(`${c.name}: overshoot and settling`, () => {
      const info = stepInfo(r.t, r.y, dcGain(G));
      expect(Math.abs(info.overshootPct - c.overshootPct)).toBeLessThan(0.1);
      expect(Math.abs((info.settlingTime ?? 0) - c.settlingTime)).toBeLessThan(0.02);
    });
    it(`${c.name}: poles`, () => {
      const p = sortC(poles(G));
      c.poles.forEach((q, i) => { expect(p[i][0]).toBeCloseTo(q[0], 6); expect(Math.abs(p[i][1])).toBeCloseTo(Math.abs(q[1]), 6); });
    });
  }
  for (const c of golden.margins) {
    it(`${c.name}: gain and phase margins`, () => {
      const m = margins(tf(c.num, c.den));
      expect(Math.abs((m.pm ?? 0) - c.pm)).toBeLessThan(0.1);
      expect(Math.abs((m.gm ?? 0) - c.gmDb)).toBeLessThan(0.05);
      expect(Math.abs((m.wc ?? 0) - c.wc) / c.wc).toBeLessThan(0.005);
      expect(Math.abs((m.w180 ?? 0) - c.w180) / c.w180).toBeLessThan(0.005);
    });
  }
  for (const c of golden.roots) {
    it(`roots of ${c.poly.join(',')}`, () => {
      const r = sortC(roots(c.poly));
      c.roots.forEach((q, i) => { expect(r[i][0]).toBeCloseTo(q[0], 8); expect(Math.abs(r[i][1])).toBeCloseTo(Math.abs(q[1]), 8); });
    });
  }
  it('root locus starts at open-loop poles', () => {
    const b = rootLocus(tf([1], [1, 7, 10, 0]), [1e-6, 1]);
    const start = sortC(b.map((br) => br[0]));
    expect(start[0][0]).toBeCloseTo(-5, 4);
    expect(start[1][0]).toBeCloseTo(-2, 4);
    expect(start[2][0]).toBeCloseTo(0, 4);
  });
});
