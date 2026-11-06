/** Course map shown in the contents column. Only lessons with a slug are published. */
export interface LessonRef { id: string; title: string; slug?: string }
export interface Track { name: string; lessons: LessonRef[] }

export const course: Track[] = [
  {
    name: 'Start here',
    lessons: [
      { id: 'A', title: 'Axes, forces and moments' },
      { id: 'B', title: 'Trim and state space' },
      { id: 'C', title: 'Laplace and transfer functions' },
    ],
  },
  {
    name: 'Exam core',
    lessons: [
      { id: '1', title: 'Poles decide the response', slug: 'poles-response' },
      { id: '2', title: 'Steady-state error' },
      { id: '3', title: 'Root locus' },
      { id: '4', title: 'Bode and margins' },
      { id: '5', title: 'Short period and phugoid' },
      { id: '6', title: 'Stability augmentation' },
      { id: '7', title: 'Handling qualities' },
      { id: '8', title: 'Autopilot modes' },
    ],
  },
  {
    name: 'Deeper',
    lessons: [
      { id: '9', title: 'Actuators, sensors and saturation' },
      { id: '10', title: 'Flight path and speed control' },
      { id: '11', title: 'Gain scheduling' },
      { id: '12', title: 'Classical versus INDI' },
    ],
  },
];
