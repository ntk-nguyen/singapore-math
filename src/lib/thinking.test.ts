import { describe, expect, it } from "vitest";
import { GRADES } from "./questions";
import { seeded } from "./rng";
import { AREAS, getThinkTopic, isFreeTopic, MP, thinkingQuestion, THINKING_TOPICS } from "./thinking";

describe("data and thinking topics", () => {
  for (const topic of THINKING_TOPICS) {
    it(`${topic.id}: every question is sound`, () => {
      const r = seeded(topic.id.length * 37 + topic.grade);
      for (let i = 0; i < 500; i++) {
        const q = thinkingQuestion(topic, r);
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.choices).toContain(q.answer);
        expect(q.text + q.choices.join() + q.steps!.join() + JSON.stringify(q.figure ?? "")).not.toMatch(/undefined|NaN|Infinity|null/);
        expect(q.steps!.length).toBeGreaterThan(0);
        expect(q.std).toMatch(new RegExp(`^${topic.grade}\\.[A-Z]{1,3}\\.[A-D]\\.\\d+[a-z]?$`));
        for (const c of q.choices) if (/^\$?[-\d,.]+$/.test(c)) expect(Number(c.replace(/[$,]/g, ""))).toBeGreaterThanOrEqual(0);
      }
    });
  }

  it("covers every grade with a free topic and every area", () => {
    for (const g of GRADES) {
      const list = THINKING_TOPICS.filter((t) => t.grade === g);
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(list.some(isFreeTopic)).toBe(true);
      expect(list.some((t) => !isFreeTopic(t))).toBe(g === 1 ? false : true);
    }
    for (const a of AREAS) expect(THINKING_TOPICS.some((t) => t.area === a.id)).toBe(true);
    for (const t of THINKING_TOPICS) expect(MP[t.mp]).toBeDefined();
    expect(new Set(THINKING_TOPICS.map((t) => t.id)).size).toBe(THINKING_TOPICS.length);
  });

  it("the mean is the mean of the listed scores", () => {
    const r = seeded(5);
    for (let i = 0; i < 300; i++) {
      const q = thinkingQuestion(getThinkTopic("g5-mean")!, r);
      const nums = q.text.match(/scored (.*) points/)![1].split(/, | and /).map(Number);
      expect(Number(q.answer)).toBe(nums.reduce((s, x) => s + x, 0) / nums.length);
    }
  });

  it("number patterns continue by the same step", () => {
    const r = seeded(6);
    for (let i = 0; i < 300; i++) {
      const q = thinkingQuestion(getThinkTopic("g1-pattern")!, r);
      const m = q.text.match(/^What number comes next\? (.*), \?$/);
      if (!m) continue;
      const t = m[1].split(", ").map(Number);
      expect(Number(q.answer)).toBe(t[3] + (t[1] - t[0]));
    }
  });

  it("the robot check says yes exactly when the sum is right", () => {
    const r = seeded(7);
    for (let i = 0; i < 300; i++) {
      const q = thinkingQuestion(getThinkTopic("g2-check")!, r);
      const [, a, op, b, shown] = q.text.match(/(\d+) ([+−]) (\d+) = (\d+)/)!;
      const right = op === "+" ? +a + +b : +a - +b;
      expect(q.answer).toBe(right === +shown ? "Yes, Robo is right" : `No, it is ${right}`);
    }
  });

  it("the AI check accepts exactly the right products", () => {
    const r = seeded(8);
    for (let i = 0; i < 300; i++) {
      const q = thinkingQuestion(getThinkTopic("g4-ai-check")!, r);
      const [, a, b, shown] = q.text.match(/(\d+) × (\d+) = ([\d,]+)/)!;
      expect(q.answer.startsWith("Yes")).toBe(+a * +b === Number(shown.replace(/,/g, "")));
    }
  });

  it("every 'which rule' answer fits the table and no wrong rule does", () => {
    const r = seeded(9);
    for (let i = 0; i < 300; i++) {
      const q = thinkingQuestion(getThinkTopic("g8-function")!, r);
      if (q.figure?.t !== "table") continue;
      const rows = q.figure.rows as number[][];
      const fits = (rule: string) => {
        const [, m, b] = rule.match(/^y = (\d+)x(?: \+ (\d+))?$/)!;
        return rows.every(([x, y]) => +m * x + Number(b ?? 0) === y);
      };
      for (const c of q.choices) expect(fits(c)).toBe(c === q.answer);
    }
  });
});
