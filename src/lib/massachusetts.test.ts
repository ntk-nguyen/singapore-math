/**
 * Checks for the places where the 2017 Massachusetts math framework narrows Common Core,
 * since MCAS is the guideline for the app's rigor (see mcas-alignment.md in project files).
 */
import { describe, expect, it } from "vitest";
import { BANK } from "./bank";
import type { Question } from "./questions";
import { seeded } from "./rng";

/** The denominators Massachusetts allows in Grade 3 (3.NF) and Grade 4 (4.NF). */
const DENOMINATORS: Record<number, number[]> = { 3: [2, 3, 4, 6, 8], 4: [2, 3, 4, 5, 6, 8, 10, 12, 100] };

/** What a child is asked and the right answer. Wrong choices may show other fractions as mistakes. */
const asked = (q: Question) => [q.text, q.ask ?? "", q.answer, ...(q.answers ?? []), ...(q.parts ?? []).flatMap((p) => [p.text, p.answer])].join(" ");

describe("Massachusetts framework limits", () => {
  for (const grade of [3, 4]) {
    it(`Grade ${grade} fractions only use the denominators Massachusetts allows`, () => {
      for (const item of BANK.filter((i) => i.grade === grade)) {
        for (let s = 0; s < 60; s++) {
          for (const shift of [-1, 0, 1]) {
            const q = item.make(seeded(s * 7 + 1), shift);
            for (const [, , d] of asked(q).matchAll(/(?<![\d.])(\d+)\/(\d+)(?![\d.])/g)) {
              expect(DENOMINATORS[grade], `${item.id}: ${q.text} (${q.answer})`).toContain(Number(d));
            }
          }
        }
      }
    });
  }

  it("money below Grade 3 stays in coins under a dollar", () => {
    for (const item of BANK.filter((i) => i.grade <= 2)) {
      for (let s = 0; s < 60; s++) {
        const t = asked(item.make(seeded(s * 13 + 5)));
        expect(t, item.id).not.toMatch(/\$\d/);
        for (const [, c] of t.matchAll(/(\d+)\s?¢/g)) expect(Number(c), item.id).toBeLessThan(100);
      }
    }
  });
});
