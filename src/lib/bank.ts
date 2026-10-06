/**
 * Every question type in the app in one list, tagged with grade, standard and strand,
 * so a test paper can be built from just the topics it is about.
 */
import { methodQuestion, TOPICS } from "./arithmetic";
import { fractionQuestion, FRACTION_TOPICS } from "./fractions";
import { problemTypes, type Level } from "./problems";
import { generatorStds, GRADES, makeQuestion, type Grade, type Question } from "./questions";
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
  make: (r: Rng) => Question;
}

export const BANK: Item[] = [
  ...GRADES.flatMap((grade) =>
    generatorStds(grade).map((std, i): Item => ({ id: `quick-${grade}-${i}`, grade, std, strand: "quick", make: (r) => makeQuestion(grade, r, i) })),
  ),
  ...TOPICS.map((t): Item => ({ id: t.id, grade: t.grade, std: t.std, strand: "computation", make: (r) => methodQuestion(t, r) })),
  ...FRACTION_TOPICS.map((t): Item => ({ id: t.id, grade: t.grade, std: t.std, strand: t.strand, make: (r) => fractionQuestion(t, r) })),
  ...problemTypes().map((p, i): Item => ({ id: `${p.kind}-${p.level}-${i}`, grade: p.grade, std: p.std, strand: p.kind === "word" ? "word" : "equations", level: p.level, make: p.make })),
  ...THINKING_TOPICS.map((t): Item => ({ id: t.id, grade: t.grade, std: t.std, strand: "thinking", level: t.level, make: (r) => thinkingQuestion(t, r) })),
];

/**
 * The items written for `grade`. When there are fewer than `min`, the nearest grades
 * are added too, a grade below before a grade above.
 */
export function nearGrade(items: Item[], grade: Grade, min = 6): Item[] {
  const dist = (g: number) => (g <= grade ? grade - g : g - grade + 0.5);
  const grades = [...new Set(items.map((i) => i.grade))].sort((a, b) => dist(a) - dist(b));
  const out: Item[] = [];
  for (const g of grades) {
    if (out.length >= min) break;
    out.push(...items.filter((i) => i.grade === g));
  }
  return out;
}
