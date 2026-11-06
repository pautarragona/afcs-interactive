import { describe, expect, it } from 'vitest';
import { evaluate, type Rubric } from '../src/lib/rubric';
import polesUp from '../src/rubrics/poles-up.json';
import polesLeft from '../src/rubrics/poles-left.json';

describe('poles-left rubric', () => {
  const r = polesLeft as Rubric;
  const movedLeft = { up: false, down: false, left: true, right: false };
  it('recognises a complete answer', () => {
    const f = evaluate(r, 'It settles faster and the overshoot is smaller, but the oscillation frequency stays the same.', movedLeft);
    expect(f.verdict).toBe('complete');
  });
  it('does not flag "oscillations die out faster" as faster oscillation', () => {
    const f = evaluate(r, 'The oscillations die out faster and the overshoot drops', movedLeft);
    expect(f.lines.join(' ')).not.toContain('spacing stays the same when');
  });
  it('flags faster oscillation as a misconception', () => {
    const f = evaluate(r, 'It oscillates faster and settles quicker', movedLeft);
    expect(f.lines.join(' ')).toContain('spacing stays the same when');
  });
});

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
