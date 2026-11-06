import { describe, expect, it } from 'vitest';
import golden from './golden/second_order.json';
import { metrics, stepResponse } from '../src/sim/secondOrder';

describe('second-order simulation matches python-control', () => {
  for (const c of golden.cases) {
    const label = `sigma=${c.sigma}, omegaD=${c.omegaD}`;
    const p = { sigma: c.sigma, omegaD: c.omegaD };
    const m = metrics(p);

    it(`${label}: natural frequency and damping`, () => {
      expect(m.omegaN).toBeCloseTo(c.omegaN, 9);
      expect(m.zeta).toBeCloseTo(c.zeta, 9);
    });

    it(`${label}: step response samples`, () => {
      for (const s of c.samples) expect(stepResponse(p, s.t)).toBeCloseTo(s.y, 6);
    });

    it(`${label}: overshoot within 0.05 percentage points`, () => {
      expect(Math.abs((m.overshootPct ?? 0) - c.overshootPct)).toBeLessThan(0.05);
    });

    it(`${label}: 2 % settling time within 5 ms`, () => {
      expect(Math.abs((m.settlingTime ?? NaN) - c.settlingTime)).toBeLessThan(0.005);
    });

    if (c.peakTime !== null) {
      it(`${label}: peak time within 5 ms`, () => {
        expect(Math.abs((m.peakTime ?? NaN) - (c.peakTime as number))).toBeLessThan(0.005);
      });
    }
  }
});

describe('stability classification', () => {
  it('flags right-half-plane poles as unstable with no settling metrics', () => {
    const m = metrics({ sigma: -0.5, omegaD: 2 });
    expect(m.stability).toBe('unstable');
    expect(m.settlingTime).toBeNull();
    expect(m.overshootPct).toBeNull();
  });
  it('flags imaginary-axis poles as marginal', () => {
    expect(metrics({ sigma: 0, omegaD: 2 }).stability).toBe('marginal');
  });
});
