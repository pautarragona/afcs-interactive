/** Course map: contents column, home page and previous/next links all read this. */
export interface LessonRef { id: string; title: string; slug: string; minutes: number }
export interface Track { name: string; blurb: string; lessons: LessonRef[] }

export const course: Track[] = [
  {
    name: 'Start here',
    blurb: 'For students without an aerospace or control background.',
    lessons: [
      { id: 'A', title: 'Axes, angles and controls', slug: 'axes-angles-controls', minutes: 15 },
      { id: 'B', title: 'Trim and state space', slug: 'trim-state-space', minutes: 20 },
      { id: 'C', title: 'Laplace and transfer functions', slug: 'laplace-transfer-functions', minutes: 20 },
    ],
  },
  {
    name: 'Exam core',
    blurb: 'The topics the AE4301 exam builds on.',
    lessons: [
      { id: '1', title: 'Poles decide the response', slug: 'poles-response', minutes: 20 },
      { id: '2', title: 'Steady-state error', slug: 'steady-state-error', minutes: 15 },
      { id: '3', title: 'Root locus', slug: 'root-locus', minutes: 20 },
      { id: '4', title: 'Bode plots and margins', slug: 'bode-margins', minutes: 20 },
      { id: '5', title: 'Short period and phugoid', slug: 'short-period-phugoid', minutes: 20 },
      { id: '6', title: 'Stability augmentation', slug: 'stability-augmentation', minutes: 20 },
      { id: '7', title: 'Handling qualities', slug: 'handling-qualities', minutes: 20 },
      { id: '8', title: 'Autopilot modes', slug: 'autopilot-modes', minutes: 20 },
    ],
  },
  {
    name: 'Deeper',
    blurb: 'Where the course stops and practice begins.',
    lessons: [
      { id: '9', title: 'Actuator limits and windup', slug: 'actuator-limits-windup', minutes: 15 },
      { id: '10', title: 'Flight path and speed', slug: 'flight-path-speed', minutes: 15 },
      { id: '11', title: 'Gain scheduling', slug: 'gain-scheduling', minutes: 15 },
      { id: '12', title: 'Classical control versus INDI', slug: 'classical-vs-indi', minutes: 15 },
    ],
  },
];

export const allLessons = course.flatMap((t) => t.lessons.map((l) => ({ ...l, track: t.name })));
export function neighbours(slug: string) {
  const i = allLessons.findIndex((l) => l.slug === slug);
  return { prev: i > 0 ? allLessons[i - 1] : null, next: i >= 0 && i < allLessons.length - 1 ? allLessons[i + 1] : null };
}
