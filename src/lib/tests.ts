import { BANK, nearGrade, type Item, type Strand } from "./bank";
import { generatorCount, makeQuestion, type Grade, type Question } from "./questions";
import { helpers, seeded, type Rng } from "./rng";
import { formatOf, vary } from "./formats";
import { NAMES, pickFresh, questionKey } from "./templates";

export interface TestInfo {
  id: string;
  name: string;
  desc: string;
  free: boolean;
  /** Number of questions. */
  length: number;
  /** The test's own seed. Each attempt mixes in its own seed, so a retake is a new paper. */
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
  // Draw on enough question types that a type comes back at most about twice on a
  // paper, adding the grades below when the grade has too few of its own.
  return test.pool ? nearGrade(BANK.filter(test.pool), testGrade(test, selected), Math.ceil(test.length * 0.6)) : [];
}

/** A seed for one attempt at a test. */
export function attemptSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Mix the test, grade and attempt into one well-spread seed, so nearby attempts give unrelated papers. */
function paperSeed(test: TestInfo, grade: Grade, attempt: number): number {
  let h = Math.imul(test.seed * 10 + grade, 0x9e3779b1) ^ Math.imul(attempt >>> 0, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}

const NAME = new RegExp(`\\b(${NAMES.join("|")})\\b`, "g");

/** A question with its names and numbers blanked out: "N has # stamps and N has #." */
export function shapeOf(q: Question): string {
  return q.text.replace(NAME, "N").replace(/\$?\d[\d,]*(\.\d+)?/g, "#").toLowerCase();
}

/**
 * A question not yet on the paper, preferring one whose wording is not just a question
 * already on it with new names and numbers. Some types all share their wording ("What
 * is 46 × 7?"), so after a few tries any new question will do.
 */
function pickVaried(seen: Set<string>, shapes: Set<string>, make: () => Question): Question {
  for (let i = 0; i < 10; i++) {
    const q = make();
    if (!seen.has(questionKey(q)) && !shapes.has(shapeOf(q))) {
      seen.add(questionKey(q));
      shapes.add(shapeOf(q));
      return q;
    }
  }
  const q = pickFresh(seen, make);
  shapes.add(shapeOf(q));
  return q;
}

/**
 * Ask a question in one of its formats, trying again (up to a few times) when that
 * would give the same format as the question before, so a paper does not run through
 * several true-or-false or type-in questions in a row.
 */
function varyAfter(q: Question, prev: Question | undefined, r: Rng): Question {
  let out = vary(q, r);
  for (let i = 0; i < 4 && prev && formatOf(out) === formatOf(prev); i++) out = vary(q, r);
  return out;
}

/**
 * Build a fixed-length (non-adaptive) test paper. Each attempt is a new paper: the same
 * `attempt` seed always gives the same paper, a different one gives different questions.
 * Pooled tests take turns between strands, so a paper mixes word problems, fractions
 * and so on rather than repeating one kind, and go through every question type in a
 * strand before any comes back. No question appears twice on a paper, nor (when it can
 * be helped) the same question with new names and numbers, and questions come in a mix of formats, never the same format twice in a row when it can be helped.
 */
export function buildPaper(test: TestInfo, selected: Grade, attempt: number = attemptSeed()): Question[] {
  const grade = testGrade(test, selected);
  const r = seeded(paperSeed(test, grade, attempt));
  const seen = new Set<string>(), shapes = new Set<string>();
  const { shuffle } = helpers(r);
  const out: Question[] = [];
  if (!test.pool) {
    // Every question type for the grade, in a new order each attempt.
    const order = shuffle(Array.from({ length: generatorCount(grade) }, (_, i) => i));
    for (let i = 0; i < test.length; i++) out.push(varyAfter(pickVaried(seen, shapes, () => makeQuestion(grade, r, order[i % order.length])), out[i - 1], r));
    return out;
  }
  const byStrand = new Map<Strand, Item[]>();
  for (const item of testItems(test, selected)) byStrand.set(item.strand, [...(byStrand.get(item.strand) ?? []), item]);
  const lists = shuffle([...byStrand.values()].map((l) => shuffle(l)));
  for (let i = 0; i < test.length; i++) {
    const list = lists[i % lists.length];
    // A repeat moves on to the next question type in the strand.
    const first = Math.floor(i / lists.length);
    let tries = 0;
    out.push(varyAfter(pickVaried(seen, shapes, () => list[(first + Math.floor(tries++ / 5)) % list.length].make(r)), out[i - 1], r));
  }
  return out;
}
