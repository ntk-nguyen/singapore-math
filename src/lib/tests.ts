import { BANK, nearGrade, type Item, type Strand } from "./bank";
import { generatorCount, generatorTiers, makeQuestion, type Grade, type Question } from "./questions";
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

/** How hard a paper is. Standard is the usual mix; easy and hard lean that way. */
export type Difficulty = "easy" | "standard" | "hard";

export const DIFFICULTIES: { id: Difficulty; label: string; blurb: string }[] = [
  { id: "easy", label: "Easy", blurb: "Smaller numbers and fewer of the hardest problem types." },
  { id: "standard", label: "Standard", blurb: "The usual mix for the grade." },
  { id: "hard", label: "Hard", blurb: "Bigger numbers and more multi-step problems." },
];

export function isDifficulty(x: unknown): x is Difficulty {
  return x === "easy" || x === "standard" || x === "hard";
}

/** Tiers to move templates by at each difficulty. */
const SHIFT: Record<Difficulty, number> = { easy: -1, standard: 0, hard: 1 };

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

/**
 * The question types a test draws from at a grade. An easy paper leaves out advanced
 * types and a hard one leaves out easy types, when enough are left at or below the
 * grade; otherwise it keeps them all (Grade 1 has no hard word problems, say).
 */
export function testItems(test: TestInfo, selected: Grade, difficulty: Difficulty = "standard"): Item[] {
  if (!test.pool) return [];
  // Draw on enough question types that a type comes back at most about twice on a
  // paper, adding the grades below when the grade has too few of its own.
  const grade = testGrade(test, selected), min = Math.ceil(test.length * 0.6);
  const all = BANK.filter(test.pool);
  const full = nearGrade(all, grade, min);
  if (difficulty === "standard") return full;
  const skip = difficulty === "easy" ? "advanced" : "easy";
  const leaning = nearGrade(all.filter((i) => i.level !== skip), grade, min);
  return leaning.length >= Math.min(3, full.length) && leaning.every((i) => i.grade <= grade) ? leaning : full;
}

/**
 * A rough measure of how hard a question looks: bigger numbers, fractions and decimals,
 * longer wording and more solution steps all count. Used to put a paper in order and,
 * on easy and hard papers, to pick the easier or harder of a few draws.
 */
export function questionScore(q: Question): number {
  // Some questions keep their numbers in the items or the answer ("Put these in order").
  const all = [q.text, ...(q.items ?? []), q.answer].join(" ");
  const nums = all.match(/\d[\d,]*(\.\d+)?/g) ?? [];
  const digits = Math.max(0, ...nums.map((n) => n.replace(/\D/g, "").length));
  const fracOrDec = /\d\/\d|\d\.\d/.test(all) ? 1 : 0;
  return digits + 0.3 * nums.length + fracOrDec + q.text.split(/\s+/).length / 25 + 0.5 * (q.steps?.length ?? 0) + (q.figure ? 0.5 : 0);
}

/** Papers come in three sections, like a real exam: A warms up, B is the core, C is the hardest third. */
export function sectionOf(i: number, n: number): "A" | "B" | "C" {
  return i < Math.round(n / 3) ? "A" : i < Math.round((2 * n) / 3) ? "B" : "C";
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
 * is 46 × 7?"), so after a few tries any new question will do. With `cost`, a few such
 * questions are drawn and the one with the lowest cost is kept.
 */
function pickVaried(seen: Set<string>, shapes: Set<string>, make: () => Question, cost?: (q: Question) => number): Question {
  const want = cost ? 3 : 1;
  const found: Question[] = [];
  for (let i = 0; i < 10 && found.length < want; i++) {
    const q = make();
    if (!seen.has(questionKey(q)) && !shapes.has(shapeOf(q)) && !found.some((f) => questionKey(f) === questionKey(q))) found.push(q);
  }
  if (!found.length) {
    const q = pickFresh(seen, make);
    shapes.add(shapeOf(q));
    return q;
  }
  const q = cost ? found.reduce((a, b) => (cost(b) < cost(a) ? b : a)) : found[0];
  seen.add(questionKey(q));
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
 * be helped) the same question with new names and numbers.
 *
 * The paper runs from easier to harder questions, like a real exam. An easy paper draws
 * templates a tier easier and picks the easiest of a few draws; a hard paper does the
 * opposite. Questions come in a mix of formats, never the same format twice in a row
 * when it can be helped.
 */
export function buildPaper(test: TestInfo, selected: Grade, attempt: number = attemptSeed(), difficulty: Difficulty = "standard"): Question[] {
  const grade = testGrade(test, selected);
  const r = seeded(paperSeed(test, grade, attempt));
  const seen = new Set<string>(), shapes = new Set<string>();
  const { shuffle } = helpers(r);
  const shift = SHIFT[difficulty];
  const cost = difficulty === "easy" ? questionScore : difficulty === "hard" ? (q: Question) => -questionScore(q) : undefined;
  const drawn: { q: Question; score: number }[] = [];
  const draw = (rank: number, make: () => Question) => {
    const q = pickVaried(seen, shapes, make, cost);
    drawn.push({ q, score: 2 * rank + questionScore(q) });
  };
  if (!test.pool) {
    // Every question type for the grade, in a new order each attempt.
    const tiers = generatorTiers(grade);
    const order = shuffle(Array.from({ length: generatorCount(grade) }, (_, i) => i));
    for (let i = 0; i < test.length; i++) {
      const t = order[i % order.length];
      draw(tiers[t], () => makeQuestion(grade, r, t, shift));
    }
  } else {
    const byStrand = new Map<Strand, Item[]>();
    for (const item of testItems(test, selected, difficulty)) byStrand.set(item.strand, [...(byStrand.get(item.strand) ?? []), item]);
    const lists = shuffle([...byStrand.values()].map((l) => shuffle(l)));
    for (let i = 0; i < test.length; i++) {
      const list = lists[i % lists.length];
      // A repeat moves on to the next question type in the strand.
      const first = Math.floor(i / lists.length);
      let tries = 0;
      const from = new Map<Question, Item>();
      const make = () => {
        const it = list[(first + Math.floor(tries++ / 5)) % list.length], q = it.make(r, shift);
        from.set(q, it);
        return q;
      };
      const q = pickVaried(seen, shapes, make, cost), item = from.get(q)!;
      // Types borrowed from a grade below count as a little easier.
      drawn.push({ q, score: 2 * (item.rank - (item.grade < grade ? 1 : 0)) + questionScore(q) });
    }
  }
  // Easier to harder. The sort is stable, so ties keep the strands taking turns.
  const ordered = drawn.map((d, i) => ({ ...d, i })).sort((a, b) => a.score - b.score || a.i - b.i).map((d) => d.q);
  // Sorting can bunch up types with a fixed format (three number lines in a row), so
  // pull a question with another format up from just ahead, keeping the order roughly.
  for (let i = 1; i < ordered.length; i++) {
    if (!ordered[i].format || ordered[i].format !== ordered[i - 1].format) continue;
    const j = ordered.findIndex((q, k) => k > i && k <= i + 3 && q.format !== ordered[i].format);
    if (j > 0) ordered.splice(i, 0, ...ordered.splice(j, 1));
  }
  const out: Question[] = [];
  for (const q of ordered) out.push(varyAfter(q, out[out.length - 1], r));
  return out;
}
