/**
 * Rubric-based feedback for "observe and explain" boxes. No AI: each key point is a set of
 * word groups; a point counts as found when every group has at least one match.
 * Rubrics are written and checked by a person (src/rubrics/*.json).
 */

export interface RubricPoint {
  id: string;
  /** Each inner list is a group of alternative word stems; all groups must match. */
  match: string[][];
  /** Shown when the student mentioned this point. */
  found: string;
  /** Shown as a nudge when this is the first point the student missed. */
  hint: string;
}

export interface Misconception {
  match: string[][];
  reply: string;
}

export interface Rubric {
  id: string;
  prompt: string;
  /** Pole movement the student should try before answering (from lab.moved). */
  tryFirst?: { direction: 'up' | 'down' | 'left' | 'right'; nudge: string };
  points: RubricPoint[];
  misconceptions: Misconception[];
  allFound: string;
  noneFound: string;
  followUp: string;
}

export interface Feedback {
  verdict: 'complete' | 'partial' | 'none';
  headline: string;
  lines: string[];
}

const tokenize = (s: string) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}\s%]/gu, ' ').split(/\s+/).filter(Boolean);

/** Word positions where a stem (one or more words; last word may be a prefix) starts. */
function positions(tokens: string[], stem: string): number[] {
  const parts = tokenize(stem);
  const out: number[] = [];
  for (let i = 0; i + parts.length <= tokens.length; i++) {
    const ok = parts.every((p, k) => (k === parts.length - 1 ? tokens[i + k].startsWith(p) : tokens[i + k] === p));
    if (ok) out.push(i);
  }
  return out;
}

/**
 * True when every word group matches somewhere and some choice of one match per group
 * lies within `window` words, so "damping drops and overshoot gets higher" does not read
 * as "damping gets higher".
 */
function matches(tokens: string[], groups: string[][], window: number) {
  const hits = groups.map((alts) => alts.flatMap((stem) => positions(tokens, stem)));
  if (hits.some((h) => h.length === 0)) return false;
  return hits[0].some((anchor) => hits.every((h) => h.some((p) => Math.abs(p - anchor) <= window)));
}

const POINT_WINDOW = 6;
const MISCONCEPTION_WINDOW = 3;

export function evaluate(rubric: Rubric, answer: string, moved: Record<string, boolean>): Feedback {
  const tokens = tokenize(answer);
  const found = rubric.points.filter((p) => matches(tokens, p.match, POINT_WINDOW));
  const missing = rubric.points.filter((p) => !found.includes(p));
  const wrong = rubric.misconceptions.filter((m) => matches(tokens, m.match, MISCONCEPTION_WINDOW));
  const lines: string[] = [];

  if (rubric.tryFirst && !moved[rubric.tryFirst.direction]) lines.push(rubric.tryFirst.nudge);
  for (const p of found) lines.push(p.found);
  for (const m of wrong) lines.push(m.reply);

  if (found.length === rubric.points.length && wrong.length === 0) {
    lines.push(rubric.followUp);
    return { verdict: 'complete', headline: rubric.allFound, lines };
  }
  if (found.length === 0) {
    lines.push(missing[0].hint);
    return { verdict: 'none', headline: rubric.noneFound, lines };
  }
  if (missing.length) lines.push(missing[0].hint);
  return { verdict: 'partial', headline: 'Good start.', lines };
}
