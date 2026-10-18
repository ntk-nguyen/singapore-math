import { describe, expect, it } from "vitest";
import { seeded } from "./rng";
import { FIRST, tryIt } from "./tryit";

describe("home page try-it problem", () => {
  it("starts on 40 marbles shared 1 : 3", () => {
    expect(FIRST).toMatchObject({ k: 3, unit: 10, total: 40, unitChoices: [3, 4, 40], answerChoices: [30, 10, 36] });
  });

  it("always has three different choices that include the answer", () => {
    const r = seeded(7);
    for (let i = 0; i < 300; i++) {
      const p = tryIt(r);
      expect(p.total).toBe((p.k + 1) * p.unit);
      for (const [choices, right] of [[p.unitChoices, p.k + 1], [p.answerChoices, p.unit]] as const) {
        expect(new Set(choices).size).toBe(3);
        expect(choices).toContain(right);
        expect(choices.every((c) => c > 0)).toBe(true);
      }
    }
  });
});
