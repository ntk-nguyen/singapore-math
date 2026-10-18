import { describe, expect, it } from "vitest";
import { formatOf, pointsFor } from "./formats";
import { QUICK } from "./quickfire";
import { GRADES, type Grade } from "./questions";
import { checkQuestion, questionKey } from "./templates";
import { areaOf, BLUEPRINT, buildPaper, categoryOf, DIFFICULTIES, getTest, questionScore, sectionOf, sessionOf, testGrade, testItems, testOffered, TESTS } from "./tests";

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

  it("covers every area of the grade on the checkpoint", () => {
    for (const g of GRADES) {
      for (let attempt = 1; attempt <= 5; attempt++) {
        const paper = buildPaper(getTest("checkpoint")!, g, attempt);
        expect(new Set(paper.map((q) => areaOf(q.std))), `grade ${g}`).toEqual(new Set(QUICK[g].map((x) => areaOf(x.std))));
      }
    }
  });
});

describe("tests fit the grade", () => {
  it("never borrows questions from a grade above the one the test is set at", () => {
    for (const t of TESTS.filter((x) => x.pool)) {
      for (const g of GRADES.filter((x) => testOffered(t, x))) {
        const at = testGrade(t, g);
        for (const item of testItems(t, g)) expect(item.grade, `${t.id} grade ${g}: ${item.id}`).toBeLessThanOrEqual(at);
      }
    }
  });

  it("offers Kindergarten only the tests it has its own questions for", () => {
    expect(TESTS.filter((t) => testOffered(t, 0)).map((t) => t.id)).toEqual(["placement", "checkpoint", "state", "eoy"]);
    for (const g of GRADES.filter((x) => x > 0)) expect(TESTS.every((t) => testOffered(t, g))).toBe(true);
  });

  it("the word problem marathon has word problems written for every grade from Grade 1", () => {
    expect(testOffered(getTest("wp")!, 0)).toBe(false);
    for (const g of GRADES.filter((x) => x > 0)) {
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
        for (const q of paper.filter((x) => !x.format || !["order", "multi", "twopart", "cr"].includes(x.format))) expect(q.choices).toContain(q.answer);
        for (const q of paper.filter((x) => x.format === "multi")) for (const a of q.answers!) expect(q.choices).toContain(a);
        for (const q of paper.filter((x) => x.format === "twopart" || x.format === "cr")) for (const p of q.parts!.filter((x) => !x.typed)) expect(p.choices).toContain(p.answer);
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
      for (const g of GRADES.filter((x) => testOffered(t, x))) {
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

describe("state test style follows the MCAS blueprint", () => {
  const state = getTest("state")!;
  const mcas = [3, 4, 5, 6, 7, 8] as Grade[];

  it("has two sessions, each ending with a show-your-work question, and a two-part question in Session 2", () => {
    for (const g of mcas) {
      for (let s = 0; s < 5; s++) {
        const paper = buildPaper(state, g, s), n = paper.length;
        const formats = paper.map(formatOf);
        expect(formats.filter((f) => f === "cr"), `grade ${g}`).toHaveLength(2);
        expect(formats[n / 2 - 1]).toBe("cr");
        expect(formats[n - 1]).toBe("cr");
        // The two show-your-work questions are different kinds of problem.
        expect(paper[n / 2 - 1].std).not.toBe(paper[n - 1].std);
        expect(paper.filter((q, i) => formatOf(q) === "twopart" && sessionOf(i, n) === 2)).toHaveLength(1);
        for (const q of paper) expect(q.grade).toBe(g);
      }
    }
  });

  it("gives each reporting category about its MCAS share of the points, and about 30% to show-your-work", () => {
    for (const g of mcas) {
      const got: Record<string, number> = {};
      let total = 0, cr = 0;
      for (let s = 0; s < 10; s++) {
        for (const q of buildPaper(state, g, s)) {
          const cat = categoryOf(g, q.std);
          expect(cat, `grade ${g}: ${q.std}`).toBeDefined();
          got[cat!] = (got[cat!] ?? 0) + pointsFor(q);
          total += pointsFor(q);
          if (formatOf(q) === "cr") cr += pointsFor(q);
        }
      }
      for (const c of BLUEPRINT[g]!) expect(Math.abs((100 * (got[c.name] ?? 0)) / total - c.weight), `grade ${g} ${c.name}`).toBeLessThanOrEqual(6);
      expect(cr / total, `grade ${g}`).toBeGreaterThanOrEqual(0.25);
    }
  });

  it("every standard asked at a state-test grade belongs to a reporting category", () => {
    for (const g of mcas) for (const std of new Set(QUICK[g]!.map((t) => t.std))) expect(categoryOf(g, std), std).toBeDefined();
  });

  it("stays a mixed paper below Grade 3, where there is no state test", () => {
    for (const g of [0, 1, 2] as Grade[]) expect(buildPaper(state, g, 1).some((q) => formatOf(q) === "cr")).toBe(false);
  });
});
