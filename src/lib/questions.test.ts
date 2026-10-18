import { describe, expect, it } from "vitest";
import { K } from "./quickfire-k";
import { gradeCode, GRADES, generatorCount, makeQuestion } from "./questions";
import { render } from "./templates";
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
      expect(makeQuestion(grade, r, i).std).toMatch(new RegExp(`^${gradeCode(grade)}\\.[A-Z]{1,3}\\.[A-D]\\.\\d+[a-z]?$`));
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

  it("Kindergarten pictures show the answer: count them, cross some out, fill the ten frame", () => {
    const tpl = (id: string) => K.find((t) => t.id === id)!;
    for (let s = 1; s < 300; s++) {
      const count = render(tpl("k-count"), seeded(s)).question;
      if (count.figure?.t !== "pics") throw new Error("k-count has no pictures");
      expect(count.answer).toBe(String(count.figure.rows[0].icons.length));
      const add = render(tpl("k-add"), seeded(s)).question;
      if (add.figure?.t !== "pics") throw new Error("k-add has no pictures");
      const [, a, b] = add.text.match(/What is (\d+) \+ (\d+)\?/)!;
      expect(add.figure.rows.map((r) => r.icons.length)).toEqual([Number(a), Number(b)]);
      expect(Number(add.answer)).toBeLessThanOrEqual(10);
      const take = render(tpl("k-take"), seeded(s)).question;
      if (take.figure?.t !== "pics") throw new Error("k-take has no pictures");
      const row = take.figure.rows[0];
      expect(Number(take.answer)).toBe(row.icons.length - (row.gone ?? 0));
      const frame = render(tpl("k-make10"), seeded(s)).question;
      if (frame.figure?.t !== "frame") throw new Error("k-make10 has no ten frame");
      expect(Number(frame.answer)).toBe(10 - frame.figure.filled);
    }
  });
});
