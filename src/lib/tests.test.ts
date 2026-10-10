import { describe, expect, it } from "vitest";
import { QUICK } from "./quickfire";
import { GRADES, type Grade } from "./questions";
import { checkQuestion, questionKey } from "./templates";
import { buildPaper, DIFFICULTIES, getTest, questionScore, sectionOf, testGrade, testItems, TESTS } from "./tests";

describe("test catalog", () => {
  it("has exactly two free tests and six paid ones", () => {
    expect(TESTS.filter((t) => t.free).map((t) => t.id)).toEqual(["placement", "checkpoint"]);
    expect(TESTS.filter((t) => !t.free)).toHaveLength(6);
  });

  it("clamps the grade to the test's range", () => {
    const psle = getTest("psle")!;
    expect(testGrade(psle, 2)).toBe(5);
    expect(testGrade(psle, 8)).toBe(6);
    expect(testGrade(getTest("checkpoint")!, 2)).toBe(2);
  });

  it("builds the same paper for the same attempt", () => {
    const t = getTest("checkpoint")!;
    const a = buildPaper(t, 4, 12345);
    expect(a).toHaveLength(15);
    expect(buildPaper(t, 4, 12345)).toEqual(a);
  });

  it("gives a new paper on a retake", () => {
    for (const t of TESTS.filter((x) => x.id !== "placement")) {
      for (const g of GRADES) {
        // Keyed with the figure, as number-line questions share their wording and differ in the picture.
        const texts = (attempt: number) => new Set(buildPaper(t, g, attempt).map(questionKey));
        const first = texts(1);
        const again = [...texts(2)].filter((x) => first.has(x)).length;
        // Almost every question is new; a few short ones ("Which fraction is the greatest?") can share their wording.
        expect(again / first.size, `${t.id} grade ${g}`).toBeLessThan(0.25);
      }
    }
  });

  it("covers every quick-fire question type for the grade on the checkpoint", () => {
    for (const g of GRADES) {
      expect(new Set(buildPaper(getTest("checkpoint")!, g, 7).map((q) => q.std))).toEqual(new Set(QUICK[g].map((x) => x.std)));
    }
  });
});

describe("tests fit the grade", () => {
  it("never borrows questions from a grade above the one the test is set at", () => {
    for (const t of TESTS.filter((x) => x.pool)) {
      for (const g of GRADES) {
        const at = testGrade(t, g);
        for (const item of testItems(t, g)) expect(item.grade, `${t.id} grade ${g}: ${item.id}`).toBeLessThanOrEqual(at);
      }
    }
  });

  it("the word problem marathon has word problems written for every grade", () => {
    for (const g of GRADES) {
      expect(testItems(getTest("wp")!, g).some((i) => i.grade === g), `grade ${g}`).toBe(true);
    }
  });
});

describe("paid tests draw from their own topics", () => {
  const stds = (id: string, g: Grade) => new Set(buildPaper(getTest(id)!, g, 42).map((q) => q.std));

  it("every paid test has questions for every grade", () => {
    for (const t of TESTS.filter((x) => x.pool)) {
      for (const g of GRADES) {
        const paper = buildPaper(t, g, g);
        expect(paper).toHaveLength(t.length);
        for (const q of paper) expect(q.format === "order" ? q.items : q.choices).toBeDefined();
        for (const q of paper.filter((x) => x.format !== "order")) expect(q.choices).toContain(q.answer);
      }
    }
  });

  it("the fractions test only asks about fractions, decimals, ratio and percent", () => {
    for (const g of [3, 4, 5, 6] as Grade[]) {
      for (const s of stds("frac", g)) expect(s).toMatch(/\.(NF|RP|NBT\.A\.[34]|NBT\.B\.7|NS\.[AB])/);
    }
  });

  it("the word problem marathon only asks word problems", () => {
    for (const g of GRADES) for (const q of buildPaper(getTest("wp")!, g, 3)) expect(q.text).not.toMatch(/^What is|^Solve for x/);
  });

  it("paid papers ask about standards the free checkpoint does not", () => {
    const free = stds("checkpoint", 5);
    for (const id of ["frac", "eoy", "state"]) {
      expect([...stds(id, 5)].some((s) => !free.has(s))).toBe(true);
    }
  });

  it("mixes strands on a paper", () => {
    const items = testItems(getTest("eoy")!, 5);
    expect(new Set(items.map((i) => i.strand)).size).toBeGreaterThanOrEqual(4);
  });
});

describe("difficulty", () => {
  const papers = TESTS.filter((t) => t.id !== "placement");
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  it("makes sound papers at every difficulty, with no question twice and nothing above the grade", () => {
    for (const t of papers) {
      for (const g of GRADES) {
        for (const { id } of DIFFICULTIES) {
          const paper = buildPaper(t, g, 11, id);
          expect(paper, `${t.id} grade ${g} ${id}`).toHaveLength(t.length);
          expect(new Set(paper.map(questionKey)).size).toBe(paper.length);
          for (const q of paper) {
            expect(q.grade, `${t.id} grade ${g} ${id}`).toBeLessThanOrEqual(testGrade(t, g));
            expect(checkQuestion(q, { negatives: true }), `${t.id} ${q.text}`).toEqual([]);
          }
        }
      }
    }
  });

  it("puts papers in order, easier questions first", () => {
    let a = 0, c = 0;
    for (const t of papers) {
      for (const g of GRADES) {
        for (let s = 1; s <= 4; s++) {
          const paper = buildPaper(t, g, s);
          const score = (part: string) => mean(paper.filter((_, i) => sectionOf(i, paper.length) === part).map(questionScore));
          a += score("A");
          c += score("C");
          // Section C looks harder than section A on nearly every paper.
          expect(score("C"), `${t.id} grade ${g}`).toBeGreaterThanOrEqual(score("A") - 0.5);
        }
      }
    }
    expect(c).toBeGreaterThan(a * 1.3);
  });

  it("makes hard papers look harder than easy ones", () => {
    for (const t of papers) {
      let easy = 0, hard = 0;
      for (const g of GRADES) {
        for (let s = 1; s <= 4; s++) {
          easy += mean(buildPaper(t, g, s, "easy").map(questionScore));
          hard += mean(buildPaper(t, g, s, "hard").map(questionScore));
        }
      }
      expect(hard, t.id).toBeGreaterThan(easy);
    }
  });

  it("leaves out advanced types on easy papers and easy types on hard ones, when there are enough others", () => {
    const wp = getTest("wp")!;
    expect(testItems(wp, 6, "easy").some((i) => i.level === "advanced")).toBe(false);
    expect(testItems(wp, 6, "hard").some((i) => i.level === "easy")).toBe(false);
    // Grade 1 has only easy word problems, so a hard paper keeps them.
    expect(testItems(wp, 1, "hard").length).toBeGreaterThan(0);
  });

  it("splits a paper into three sections", () => {
    expect(Array.from({ length: 15 }, (_, i) => sectionOf(i, 15)).join("")).toBe("AAAAABBBBBCCCCC");
    expect(Array.from({ length: 10 }, (_, i) => sectionOf(i, 10)).join("")).toBe("AAABBBBCCC");
  });
});
