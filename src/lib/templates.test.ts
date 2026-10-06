import { describe, expect, it } from "vitest";
import { methodQuestion, TOPICS } from "./arithmetic";
import { fractionQuestion, FRACTION_TOPICS } from "./fractions";
import { generators, KINDS, LEVELS, MIDDLE_WORD, practiceSet, type Kind } from "./problems";
import { QUICK } from "./quickfire";
import { GRADES, makeQuestion, playDeck, type Question } from "./questions";
import { deck, seeded } from "./rng";
import { checkQuestion, drawFresh, noRepeats, questionKey, render, valueOf, type Template, type Tier } from "./templates";
import { buildPaper, TESTS } from "./tests";
import { thinkingQuestion, THINKING_TOPICS } from "./thinking";

const ALL: Template[] = [
  ...GRADES.flatMap((g) => QUICK[g]),
  ...(Object.keys(KINDS) as Kind[]).flatMap((k) => LEVELS.flatMap((l) => generators(k, l.id))),
  ...MIDDLE_WORD,
];
const DRAWS = 400;

describe("template library", () => {
  it("has unique ids and enough templates per topic", () => {
    expect(new Set(ALL.map((t) => t.id)).size).toBe(ALL.length);
    for (const g of GRADES) expect(QUICK[g].length).toBeGreaterThanOrEqual(10);
    for (const { id } of LEVELS) {
      expect(generators("word", id).length).toBeGreaterThanOrEqual(12);
      expect(generators("equations", id).length).toBeGreaterThanOrEqual(7);
    }
  });

  it("tags every template with a Common Core code for its grade", () => {
    for (const t of ALL) expect(t.std, t.id).toMatch(new RegExp(`^${t.grade}\\.[A-Z]{1,3}\\.[A-D]\\.\\d+[a-z]?$`));
  });

  // A large batch per template at every difficulty tier.
  describe.each(ALL.map((t) => [t.id, t] as const))("%s", (_, t) => {
    it.each([0, 1, 2] as Tier[])("tier %i: valid, varied and with real-mistake distractors", (tier) => {
      const r = seeded(t.id.length * 7919 + tier);
      const keys = new Set<string>();
      let twoReal = 0;
      for (let i = 0; i < DRAWS; i++) {
        const { question: q, real, negatives } = render(t, r, tier);
        expect(checkQuestion(q, { negatives }), `${q.text} :: ${q.choices.join(", ")}`).toEqual([]);
        expect(real, q.text).toBeGreaterThanOrEqual(1);
        if (real >= 2) twoReal++;
        keys.add(questionKey(q));
      }
      // Variety: at least 40 different questions in 400 draws.
      expect(keys.size).toBeGreaterThanOrEqual(40);
      // Distractors: nearly always at least two wrong answers that come from real mistakes.
      expect(twoReal / DRAWS).toBeGreaterThanOrEqual(0.85);
    });
  });
});

describe("validator", () => {
  const base = { grade: 3 as const, std: "3.OA.A.3", text: "What is 6 × 7?", answer: "42", choices: ["42", "13", "48", "36"] };

  it("passes a good question", () => {
    expect(checkQuestion(base)).toEqual([]);
  });

  it("catches two right answers, repeats, broken numbers and stray negatives", () => {
    expect(checkQuestion({ ...base, choices: ["42", "42", "48", "36"] })).toContain("repeats a choice");
    expect(checkQuestion({ ...base, answer: "1/2", choices: ["1/2", "2/4", "3/4", "1"] })).toContain("two choices have the same value");
    expect(checkQuestion({ ...base, choices: ["13", "48", "36", "40"] })).toContain("answer appears 0 times");
    expect(checkQuestion({ ...base, text: "What is NaN × 7?" })).toContain("has a broken value");
    expect(checkQuestion({ ...base, choices: ["42", "0.30000000000000004", "48", "36"] })).toContain("has float noise");
    expect(checkQuestion({ ...base, choices: ["42", "-42", "48", "36"] })).toContain("has a negative choice");
    expect(checkQuestion({ ...base, choices: ["42", "-42", "48", "36"] }, { negatives: true })).toEqual([]);
  });

  it("reads answers written as money, fractions, mixed numbers and percents", () => {
    expect(valueOf("$4.50")).toBe(4.5);
    expect(valueOf("2 1/2")).toBe(2.5);
    expect(valueOf("3/4")).toBe(0.75);
    expect(valueOf("40%")).toBe(0.4);
    expect(valueOf("−3")).toBe(-3);
    expect(valueOf("12 R 3")).toBeNaN();
  });

  it("passes every existing topic generator too", () => {
    const r = seeded(77);
    for (let i = 0; i < 100; i++) {
      for (const t of TOPICS) expect(checkQuestion(methodQuestion(t, r)), t.id).toEqual([]);
      for (const t of FRACTION_TOPICS) expect(checkQuestion(fractionQuestion(t, r)), t.id).toEqual([]);
      for (const t of THINKING_TOPICS) expect(checkQuestion(thinkingQuestion(t, r), { negatives: true }), t.id).toEqual([]);
    }
  });
});

describe("fresh draws", () => {
  const distinct = (qs: Question[]) => new Set(qs.map(questionKey)).size;

  it("a Play session never repeats a question", () => {
    for (const g of GRADES) {
      const next = playDeck(g, seeded(g));
      expect(distinct(Array.from({ length: 30 }, next))).toBe(30);
    }
  });

  it("deals every item once before any comes back, and never the same one twice in a row", () => {
    const items = ["a", "b", "c", "d", "e", "f", "g"];
    for (let s = 1; s <= 30; s++) {
      const next = deck(items, seeded(s));
      const dealt = Array.from({ length: items.length * 4 }, next);
      for (let k = 0; k < 4; k++) expect(dealt.slice(k * items.length, (k + 1) * items.length).sort()).toEqual(items);
      for (let i = 1; i < dealt.length; i++) expect(dealt[i]).not.toBe(dealt[i - 1]);
    }
  });

  it("noRepeats remembers across calls", () => {
    const r = seeded(4);
    const next = noRepeats(() => makeQuestion(3, r));
    expect(distinct(Array.from({ length: 50 }, next))).toBe(50);
  });

  it("practice sets never repeat a question", () => {
    for (const kind of Object.keys(KINDS) as Kind[]) {
      for (const { id } of LEVELS) {
        for (let s = 1; s <= 20; s++) expect(distinct(practiceSet(kind, id, seeded(s), 30))).toBe(30);
      }
    }
  });

  it("test papers never repeat a question", () => {
    for (const t of TESTS.filter((x) => x.id !== "placement")) {
      for (const g of GRADES) {
        for (let attempt = 1; attempt <= 5; attempt++) {
          const paper = buildPaper(t, g, attempt);
          expect(distinct(paper), `${t.id} grade ${g}`).toBe(paper.length);
        }
      }
    }
  });

  it("topic practice draws fresh questions from every topic", () => {
    for (const t of [...TOPICS.map((x) => () => methodQuestion(x, Math.random)), ...FRACTION_TOPICS.map((x) => () => fractionQuestion(x, Math.random))]) {
      expect(distinct(drawFresh(t, 10))).toBe(10);
    }
  });
});
