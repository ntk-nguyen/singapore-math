import { describe, expect, it } from "vitest";
import { GRADES, type Grade } from "./questions";
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

  it("builds the same paper every time", () => {
    const t = getTest("checkpoint")!;
    const a = buildPaper(t, 4);
    expect(a).toHaveLength(15);
    expect(buildPaper(t, 4)).toEqual(a);
  });
});

describe("paid tests draw from their own topics", () => {
  const stds = (id: string, g: Grade) => new Set(buildPaper(getTest(id)!, g).map((q) => q.std));

  it("every paid test has questions for every grade", () => {
    for (const t of TESTS.filter((x) => x.pool)) {
      for (const g of GRADES) {
        const paper = buildPaper(t, g);
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
    for (const q of buildPaper(getTest("wp")!, 4)) expect(q.text).not.toMatch(/^What is|^Solve for x/);
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
