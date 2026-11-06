import { describe, expect, it } from 'vitest';
import { evaluate, type Rubric } from '../src/lib/rubric';
import polesUp from '../src/rubrics/poles-up.json';

const rubric = polesUp as Rubric;
const movedUp = { up: true, down: false, left: false, right: false };
const ids = (answer: string) => {
  const f = evaluate(rubric, answer, movedUp);
  return { verdict: f.verdict, text: f.lines.join(' ') };
};

describe('poles-up rubric', () => {
  it('recognises a complete answer', () => {
    const f = ids('The overshoot gets bigger and it oscillates faster, because the damping ratio decreases.');
    expect(f.verdict).toBe('complete');
  });

  it('gives a partial verdict and a nudge for a two-point answer', () => {
    const f = ids('The overshoot gets bigger and it oscillates faster.');
    expect(f.verdict).toBe('partial');
    expect(f.text).toContain('damping ratio readout');
  });

  it('does not misread "damping drops so overshoot gets higher" as damping increasing', () => {
    const f = ids('The damping ratio drops so the overshoot gets higher and it oscillates faster');
    expect(f.verdict).toBe('complete');
    expect(f.text).not.toContain('Careful with ζ');
  });

  it('flags the damping-increases misconception', () => {
    const f = ids('Overshoot goes up because damping increases');
    expect(f.text).toContain('Careful with ζ');
  });

  it('flags the settling-time misconception', () => {
    const f = ids('The overshoot is larger and it takes longer to settle');
    expect(f.text).toContain('settling-time readout');
  });

  it('says not quite for an unrelated answer', () => {
    expect(ids('Nothing really changes').verdict).toBe('none');
  });

  it('asks the student to try moving the poles first when they have not', () => {
    const f = evaluate(rubric, 'The overshoot grows', { up: false, down: false, left: false, right: false });
    expect(f.lines[0]).toContain('Try it first');
  });
});
