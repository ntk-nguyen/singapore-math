import type { Grade } from "./questions";

/**
 * Adaptive placement. Two correct answers in a row move up a grade, a miss moves
 * down a grade. The placement is the highest grade answered at least twice with
 * 60% or better. (The production version should use an IRT/Rasch model instead.)
 */
export interface PlacementState {
  grade: Grade;
  run: number;
  asked: number;
  /** Per grade: [correct, asked]. */
  tally: Partial<Record<Grade, [number, number]>>;
}

export function startPlacement(selected: Grade): PlacementState {
  return { grade: Math.min(selected, 5) as Grade, run: 0, asked: 0, tally: {} };
}

export function recordAnswer(s: PlacementState, ok: boolean): PlacementState {
  const [right, n] = s.tally[s.grade] ?? [0, 0];
  const tally = { ...s.tally, [s.grade]: [right + (ok ? 1 : 0), n + 1] as [number, number] };
  let grade = s.grade;
  let run = s.run;
  if (ok) {
    run++;
    if (run >= 2 && grade < 8) {
      grade = (grade + 1) as Grade;
      run = 0;
    }
  } else {
    run = 0;
    if (grade > 1) grade = (grade - 1) as Grade;
  }
  return { grade, run, asked: s.asked + 1, tally };
}

export function placementResult(s: PlacementState): Grade {
  let place: Grade = 1;
  for (let g = 1 as Grade; g <= 8; g = (g + 1) as Grade) {
    const t = s.tally[g];
    if (t && t[1] >= 2 && t[0] / t[1] >= 0.6) place = g;
  }
  return place;
}
