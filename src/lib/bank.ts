/**
 * Every question type in the app in one list, tagged with grade, standard and strand,
 * so a test paper can be built from just the topics it is about.
 */
import { methodQuestion, TOPICS } from "./arithmetic";
import { fractionQuestion, FRACTION_TOPICS } from "./fractions";
import { problemTypes, type Level } from "./problems";
import { generatorStds, generatorTiers, GRADES, makeQuestion, type Grade, type Question } from "./questions";
import type { Rng } from "./rng";
import { thinkingQuestion, THINKING_TOPICS } from "./thinking";

export type Strand = "quick" | "computation" | "fractions" | "decimals" | "word" | "equations" | "thinking";

export interface Item {
  id: string;
  grade: Grade;
  std: string;
  strand: Strand;
  /** Word problems, equations and data & thinking only. */
  level?: Level;
  /** How hard the question type is, 0 (easy) to 2 (hard), for putting a paper in order. */
  rank: number;
  /** `shift` asks a type with difficulty tiers a tier easier (-1) or harder (+1); other types ignore it. */
  make: (r: Rng, shift?: number) => Question;
}

const RANK: Record<Level, number> = { easy: 0, intermediate: 1, advanced: 2 };

export const BANK: Item[] = [
  ...GRADES.flatMap((grade) =>
    generatorStds(grade).map((std, i): Item => ({ id: `quick-${grade}-${i}`, grade, std, strand: "quick", rank: generatorTiers(grade)[i], make: (r, shift) => makeQuestion(grade, r, i, shift) })),
  ),
  ...TOPICS.map((t): Item => ({ id: t.id, grade: t.grade, std: t.std, strand: "computation", rank: 1, make: (r) => methodQuestion(t, r) })),
  ...FRACTION_TOPICS.map((t): Item => ({ id: t.id, grade: t.grade, std: t.std, strand: t.strand, rank: 1, make: (r) => fractionQuestion(t, r) })),
  ...problemTypes().map((p, i): Item => ({ id: `${p.kind}-${p.level}-${i}`, grade: p.grade, std: p.std, strand: p.kind === "word" ? "word" : "equations", level: p.level, rank: RANK[p.level], make: p.make })),
  ...THINKING_TOPICS.map((t): Item => ({ id: t.id, grade: t.grade, std: t.std, strand: "thinking", level: t.level, rank: RANK[t.level], make: (r) => thinkingQuestion(t, r) })),
];

/**
 * The items written for `grade`. When there are fewer than `min`, the grades below are
 * added too, nearest first. A grade above is only borrowed when the grade and the ones
 * below have fewer than `floor` items between them, so a paper never asks a child
 * about next year's work just to fill up.
 */
export function nearGrade(items: Item[], grade: Grade, min = 6, floor = 3): Item[] {
  const below = [...new Set(items.map((i) => i.grade))].filter((g) => g <= grade).sort((a, b) => b - a);
  const out: Item[] = [];
  for (const g of below) {
    if (out.length >= min) break;
    out.push(...items.filter((i) => i.grade === g));
  }
  if (out.length >= floor) return out;
  const above = [...new Set(items.map((i) => i.grade))].filter((g) => g > grade).sort((a, b) => a - b);
  for (const g of above) {
    if (out.length >= floor) break;
    out.push(...items.filter((i) => i.grade === g));
  }
  return out;
}
