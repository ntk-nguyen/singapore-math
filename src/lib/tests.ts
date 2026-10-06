import { BANK, nearGrade, type Item, type Strand } from "./bank";
import { makeQuestion, type Grade, type Question } from "./questions";
import { helpers, seeded } from "./rng";

export interface TestInfo {
  id: string;
  name: string;
  desc: string;
  free: boolean;
  /** Number of questions. */
  length: number;
  /** Fixed seed so everyone at a grade sees the same paper. */
  seed: number;
  /** Grades the test is written for. Omitted means the selected grade. */
  grades?: Grade[];
  /**
   * Which question types the test draws from. Omitted means the quick-fire set for
   * the grade, as the free tests and Play use.
   */
  pool?: (item: Item) => boolean;
}

const fracDec = (i: Item) => i.strand === "fractions" || i.strand === "decimals";

export const TESTS: TestInfo[] = [
  { id: "placement", free: true, name: "Placement check", length: 12, seed: 0, desc: "Adaptive, 12 questions across Grades 1–8. Finds the right starting grade and maps it to US grade standards." },
  { id: "checkpoint", free: true, name: "Grade checkpoint", length: 15, seed: 101, desc: "15 questions at your selected grade, mixing word problems, computation and geometry. Scored by standard." },
  { id: "wp", free: false, name: "Word problem marathon", length: 20, seed: 303, desc: "20 multi-step word problems with bar model solutions.",
    pool: (i) => i.strand === "word" },
  { id: "frac", free: false, name: "Fractions & ratio focus", length: 20, seed: 404, grades: [3, 4, 5, 6], desc: "Grades 3–6 fractions, decimals, ratio and percent, the core of Singapore Primary 4–6.",
    pool: (i) => fracDec(i) || (i.strand !== "computation" && /\.(NF|RP)\./.test(i.std)) },
  { id: "state", free: false, name: "State test style (SBAC/PARCC mix)", length: 20, seed: 505, desc: "Mixed-strand practice in the style of end-of-year state tests: word problems, fractions, decimals, equations and quick-fire items.",
    pool: (i) => i.strand !== "computation" },
  { id: "eoy", free: false, name: "End-of-year review", length: 25, seed: 606, desc: "25 questions covering every topic for the grade, including written computation.",
    pool: () => true },
  { id: "psle", free: false, name: "PSLE-style challenge", length: 20, seed: 707, grades: [5, 6], desc: "Harder heuristics problems inspired by Singapore’s Primary 6 exam, plus fractions and decimals.",
    pool: (i) => (i.strand === "word" && i.level !== "easy") || fracDec(i) },
  { id: "pre-alg", free: false, name: "Pre-algebra readiness", length: 20, seed: 808, grades: [6, 7, 8], desc: "Grades 6–8 expressions, equations and the number system.",
    pool: (i) => i.strand === "equations" || i.strand === "quick" || fracDec(i) },
];

export function getTest(id: string): TestInfo | undefined {
  return TESTS.find((t) => t.id === id);
}

/** The grade a fixed test is set at: the selected grade, clamped to the test's range. */
export function testGrade(test: TestInfo, selected: Grade): Grade {
  if (!test.grades) return selected;
  const atOrBelow = test.grades.filter((g) => g <= selected);
  return atOrBelow.length ? atOrBelow[atOrBelow.length - 1] : test.grades[0];
}

/** The question types a test draws from at a grade. */
export function testItems(test: TestInfo, selected: Grade): Item[] {
  return test.pool ? nearGrade(BANK.filter(test.pool), testGrade(test, selected)) : [];
}

/**
 * Build a fixed (non-adaptive) test paper. Pooled tests take turns between strands,
 * so a paper mixes word problems, fractions and so on rather than repeating one kind.
 */
export function buildPaper(test: TestInfo, selected: Grade): Question[] {
  const grade = testGrade(test, selected);
  const r = seeded(test.seed * 10 + grade);
  if (!test.pool) return Array.from({ length: test.length }, (_, i) => makeQuestion(grade, r, i));
  const { shuffle } = helpers(r);
  const byStrand = new Map<Strand, Item[]>();
  for (const item of testItems(test, selected)) byStrand.set(item.strand, [...(byStrand.get(item.strand) ?? []), item]);
  const lists = shuffle([...byStrand.values()].map((l) => shuffle(l)));
  return Array.from({ length: test.length }, (_, i) => {
    const list = lists[i % lists.length];
    return list[Math.floor(i / lists.length) % list.length].make(r);
  });
}
