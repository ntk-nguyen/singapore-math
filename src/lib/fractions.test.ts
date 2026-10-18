import { describe, expect, it } from "vitest";
import { fmt, fractionQuestion, FRACTION_TOPICS, getFracTopic, valueOf } from "./fractions";
import { seeded } from "./rng";

const FR = String.raw`(?:(\d+) )?(\d+)\/(\d+)`;

describe("fraction and decimal topics", () => {
  for (const topic of FRACTION_TOPICS) {
    it(`${topic.id}: every question is sound`, () => {
      const r = seeded(topic.id.length * 31 + topic.grade);
      for (let i = 0; i < 500; i++) {
        const q = fractionQuestion(topic, r);
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.choices).toContain(q.answer);
        expect(q.text + q.choices.join() + q.steps!.join()).not.toMatch(/undefined|NaN|Infinity|\/0\b/);
        expect(q.steps!.length).toBeGreaterThan(0);
        expect(q.std).toMatch(/^\d\.[A-Z]{2,3}\.[A-C]\.\d+[a-z]?$/);
        // Only questions that name parts or ask for a form may offer two equal values.
        if (!["g3-frac-name", "g4-mixed"].includes(topic.id)) {
          expect(new Set(q.choices.map(valueOf)).size).toBe(4);
        }
        for (const c of q.choices) expect(valueOf(c)).toBeGreaterThanOrEqual(0);
      }
    });
  }

  it("arithmetic answers are right", () => {
    const val = (m: RegExpMatchArray, k: number) => Number(m[k] ?? 0) + Number(m[k + 1]) / Number(m[k + 2]);
    const r = seeded(9);
    for (const id of ["g4-frac-add-like", "g5-frac-add-unlike", "g5-frac-mult", "g6-frac-div"]) {
      for (let i = 0; i < 500; i++) {
        const q = fractionQuestion(getFracTopic(id)!, r);
        const m = q.text.match(new RegExp(`${FR} ([+−×÷]) ${FR}`));
        if (!m) continue; // word-problem wording
        const a = val(m, 1), b = val(m, 5);
        const want = { "+": a + b, "−": a - b, "×": a * b, "÷": a / b }[m[4]]!;
        expect(valueOf(q.answer)).toBeCloseTo(want, 9);
      }
    }
  });

  it("decimal answers are right", () => {
    const r = seeded(4);
    for (let i = 0; i < 500; i++) {
      for (const id of ["g5-dec-add-sub", "g6-dec-mul-div"]) {
        const q = fractionQuestion(getFracTopic(id)!, r);
        const [, a, op, b] = q.text.match(/What is ([\d.]+) ([+−×÷]) ([\d.]+)\?/)!;
        const want = { "+": +a + +b, "−": +a - +b, "×": +a * +b, "÷": +a / +b }[op]!;
        expect(Number(q.answer)).toBeCloseTo(want, 9);
      }
      const q = fractionQuestion(getFracTopic("g5-dec-round")!, r);
      const [, v, place] = q.text.match(/Round ([\d.]+) to the nearest (\w+ ?\w*)\./)!;
      // In thousandths, so 9.415 rounds up to 9.42 without float error.
      const unit = { "whole number": 1000, tenth: 100, hundredth: 10 }[place]!;
      expect(Number(q.answer)).toBeCloseTo((Math.round(Math.round(+v * 1000) / unit) * unit) / 1000, 9);
    }
  });

  it("greatest and least questions pick the right one", () => {
    const r = seeded(2);
    for (const id of ["g3-frac-compare", "g4-frac-compare", "g4-dec-compare", "g5-dec-compare"]) {
      for (let i = 0; i < 300; i++) {
        const q = fractionQuestion(getFracTopic(id)!, r);
        const vals = q.choices.map(valueOf);
        const want = q.text.includes("greatest") ? Math.max(...vals) : Math.min(...vals);
        expect(valueOf(q.answer)).toBe(want);
        expect(vals.filter((v) => v === want)).toHaveLength(1);
      }
    }
  });

  it("formats fractions in simplest form", () => {
    expect(fmt([6, 8])).toBe("3/4");
    expect(fmt([10, 4])).toBe("2 1/2");
    expect(fmt([10, 4], false)).toBe("5/2");
    expect(fmt([8, 4])).toBe("2");
    expect(valueOf("2 1/2")).toBe(2.5);
    expect(valueOf("40%")).toBe(0.4);
  });

  it("covers Grades 3 to 6 in both strands", () => {
    for (const g of [3, 4, 5, 6]) expect(FRACTION_TOPICS.some((t) => t.grade === g)).toBe(true);
    expect(new Set(FRACTION_TOPICS.map((t) => t.id)).size).toBe(FRACTION_TOPICS.length);
  });
});
