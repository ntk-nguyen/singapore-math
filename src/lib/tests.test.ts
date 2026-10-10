import { describe, expect, it } from "vitest";
import { QUICK } from "./quickfire";
import { GRADES, type Grade } from "./questions";
import { questionKey } from "./templates";
import { buildPaper, getTest, testGrade, testItems, TESTS } from "./tests";

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
