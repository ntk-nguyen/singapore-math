import { describe, expect, it } from "vitest";
import { GRADES, generatorCount, makeQuestion } from "./questions";
import { seeded } from "./rng";
import { checkQuestion } from "./templates";

describe("question bank", () => {
  it.each(GRADES)("grade %i: every template makes valid questions", (grade) => {
    const r = seeded(grade * 7919);
    for (let i = 0; i < 400; i++) {
      const q = makeQuestion(grade, r, i);
      expect(checkQuestion(q, { negatives: grade >= 6 })).toEqual([]);
      expect(q.grade).toBe(grade);
    }
  });

  it.each(GRADES)("grade %i: every item is tagged with a Common Core code for its grade", (grade) => {
    const r = seeded(42);
    for (let i = 0; i < generatorCount(grade) * 5; i++) {
      expect(makeQuestion(grade, r, i).std).toMatch(new RegExp(`^${grade}\\.[A-Z]{1,3}\\.[A-D]\\.\\d+[a-z]?$`));
    }
  });

  it("is deterministic for a given seed", () => {
    const a = Array.from({ length: 10 }, (_, i) => makeQuestion(5, seeded(9), i).text);
    const b = Array.from({ length: 10 }, (_, i) => makeQuestion(5, seeded(9), i).text);
    expect(a).toEqual(b);
  });

  it("computes known answers correctly", () => {
    // Walk many seeds and re-derive answers from the text for a few unambiguous templates.
    for (let s = 1; s < 300; s++) {
      const q = makeQuestion(2, seeded(s), 2); // "What is a + b?"
      const [, a, b] = q.text.match(/What is (\d+) \+ (\d+)\?/)!;
      expect(q.answer).toBe(String(Number(a) + Number(b)));
      const h = makeQuestion(8, seeded(s), 1); // Pythagorean triple
      const [, p, r] = h.text.match(/legs (\d+) and (\d+)/)!;
      expect(Number(h.answer) ** 2).toBe(Number(p) ** 2 + Number(r) ** 2);
      const e = makeQuestion(7, seeded(s), 1); // "Solve for x: ax + b = c"
      const [, ea, eb, ec] = e.text.match(/(\d+)x \+ (\d+) = (\d+)/)!;
      expect(Number(ea) * Number(e.answer) + Number(eb)).toBe(Number(ec));
    }
  });
});
