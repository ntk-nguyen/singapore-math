/**
 * Printable practice papers. A paper is a fixed test (any test but the adaptive
 * placement check) or a single topic, drawn fresh from the question templates on
 * every download, so a child can print as many different papers as they like.
 */
import type { Item, Strand } from "./bank";
import type { Grade, Question } from "./questions";
import { attemptSeed, buildPaper, testGrade, testItems, TESTS, type Difficulty, type TestInfo } from "./tests";

export interface PaperKind {
  id: string;
  name: string;
  /** "test" papers follow a practice test; "topic" papers stick to one strand. */
  group: "test" | "topic";
  /** Free users can print free tests; everything else needs the Pro plan. */
  free: boolean;
  test: TestInfo;
}

const TOPICS: { strand: Strand; name: string; seed: number }[] = [
  { strand: "quick", name: "Mental math quick-fire", seed: 1101 },
  { strand: "computation", name: "Written computation", seed: 1202 },
  { strand: "word", name: "Word problems", seed: 1303 },
  { strand: "fractions", name: "Fractions", seed: 1404 },
  { strand: "decimals", name: "Decimals", seed: 1505 },
  { strand: "equations", name: "Equations and algebra", seed: 1606 },
  { strand: "thinking", name: "Data and thinking", seed: 1707 },
];

export const PAPER_KINDS: PaperKind[] = [
  ...TESTS.filter((t) => t.id !== "placement").map((t): PaperKind => ({ id: t.id, name: t.name, group: "test", free: t.free, test: t })),
  ...TOPICS.map(({ strand, name, seed }): PaperKind => ({
    id: `topic-${strand}`, name, group: "topic", free: false,
    test: { id: `topic-${strand}`, name, desc: name, free: false, length: 20, seed, pool: (i: Item) => i.strand === strand },
  })),
];

export function getPaperKind(id: string): PaperKind | undefined {
  return PAPER_KINDS.find((k) => k.id === id);
}

/**
 * Whether a paper kind can be printed at a grade. Practice tests always can, as they
 * can be taken online. A topic paper is only offered when there are question types
 * for it at the grade or below, so a Grade 1 paper never borrows Grade 2 work.
 */
export function paperAvailable(kind: PaperKind, grade: Grade): boolean {
  if (kind.group === "test") return true;
  const items = testItems(kind.test, grade);
  return items.length > 0 && items.every((i) => i.grade <= grade);
}

/** The grade a paper is actually set at (tests with a grade range clamp it). */
export function paperGrade(kind: PaperKind, grade: Grade): Grade {
  return testGrade(kind.test, grade);
}

/** Build one paper. The same seed and difficulty always give the same paper, so a code reprints it. */
export function buildPrintPaper(kind: PaperKind, grade: Grade, seed: number = attemptSeed(), difficulty: Difficulty = "standard"): Question[] {
  return buildPaper({ ...kind.test, length: paperLength(kind, grade) }, grade, seed, difficulty);
}

/**
 * How many questions a paper has. Practice tests keep their length. A topic with only
 * a few question types at a grade (fractions in Grade 3, say) gets a shorter paper,
 * about two of each type, rather than asking the same few things over and over.
 */
export function paperLength(kind: PaperKind, grade: Grade): number {
  if (kind.group === "test") return kind.test.length;
  return Math.min(kind.test.length, Math.max(10, 2 * testItems(kind.test, grade).length));
}

/** A short code printed on the paper, so a grown-up can tell papers apart. Easy and hard papers end in -E or -H. */
export function paperCode(seed: number, difficulty: Difficulty = "standard"): string {
  const code = seed.toString(36).toUpperCase().padStart(6, "0");
  return difficulty === "standard" ? code : `${code}-${difficulty === "easy" ? "E" : "H"}`;
}
