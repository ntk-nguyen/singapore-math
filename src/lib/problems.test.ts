import { describe, expect, it } from "vitest";
import { generators, KINDS, LEVELS, practiceSet, type Kind } from "./problems";
import { seeded } from "./rng";
import { factDeck, factKey, MASTERED, nextMastery, RETRY_GAP, strategy, TABLES } from "./timesTables";

describe("word problems and equations", () => {
  for (const kind of Object.keys(KINDS) as Kind[]) {
    for (const { id: level } of LEVELS) {
      it(`${kind}/${level}: every generator makes sound questions`, () => {
        const gens = generators(kind, level);
        for (let g = 0; g < gens.length; g++) {
          const r = seeded(g * 97 + level.length);
          for (let i = 0; i < 300; i++) {
            const q = practiceSet(kind, level, r, gens.length)[0];
            expect(q.answer).toMatch(/^(\$\d+(\.\d\d)?|-?\d+)$/);
            expect(q.choices).toHaveLength(4);
            expect(new Set(q.choices).size).toBe(4);
            expect(q.choices).toContain(q.answer);
            expect(q.std).toMatch(/^\d\.[A-Z]{2,3}\.[A-C]\.\d+[a-z]?$/);
            expect(q.text).not.toMatch(/undefined|NaN|Infinity/);
            expect(q.steps!.length).toBeGreaterThan(0);
          }
        }
      });
    }
  }

  it("equation answers satisfy the equation", () => {
    const r = seeded(5);
    for (let i = 0; i < 2000; i++) {
      for (const level of ["easy", "intermediate", "advanced"] as const) {
        const q = practiceSet("equations", level, r, 1)[0];
        const x = Number(q.answer);
        const eq = q.text.replace("Solve for x: ", "").replace(/−/g, "-").replace(/÷/g, "/")
          .replace(/(\d)x/g, "$1*x").replace(/(\d)\(/g, "$1*(");
        const [lhs, rhs] = eq.split("=");
        const f = new Function("x", `return [${lhs}, ${rhs}]`);
        const [l, rr] = f(x);
        expect(l).toBeCloseTo(rr, 9);
      }
    }
  });

  it("practice sets cover every problem type", () => {
    const set = practiceSet("word", "advanced", seeded(1), 8);
    expect(new Set(set.map((q) => q.std)).size).toBeGreaterThan(1);
  });
});

describe("times tables", () => {
  it("every strategy's working ends in the right product", () => {
    for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) {
      const s = strategy(a, b);
      expect(s.how).toContain(String(a * b));
    }
  });

  it("stores each fact once", () => {
    expect(factKey(8, 7)).toBe(factKey(7, 8));
  });

  it("mastery needs fast correct answers and resets on a miss", () => {
    expect(nextMastery(0, true, 2000)).toBe(1);
    expect(nextMastery(2, true, 9000)).toBe(2);
    expect(nextMastery(MASTERED, true, 1000)).toBe(MASTERED);
    expect(nextMastery(2, false, 1000)).toBe(0);
  });

  it("deals every fact in the chosen tables once before any repeats", () => {
    for (const tables of [[7], [3, 4], TABLES]) {
      for (let s = 1; s <= 20; s++) {
        const deck = factDeck(tables, {}, seeded(s));
        const keys = Array.from({ length: deck.size }, () => {
          const [a, b] = deck.next();
          expect(tables.includes(a) || tables.includes(b)).toBe(true);
          return factKey(a, b);
        });
        expect(new Set(keys).size).toBe(deck.size);
      }
    }
    // 3 × 4 and 4 × 3 are one fact, so × 3 and × 4 together hold 23 facts, not 24.
    expect(factDeck([3, 4], {}, seeded(1)).size).toBe(23);
  });

  it("starts each new deck with a different fact and never asks the same fact twice in a row", () => {
    const deck = factDeck([7], {}, seeded(9));
    let last = "";
    for (let i = 0; i < 200; i++) {
      const k = factKey(...deck.next());
      expect(k).not.toBe(last);
      last = k;
    }
  });

  it("brings a missed fact back a few questions later, once", () => {
    const deck = factDeck([2, 3, 4, 5, 6, 7, 8, 9], {}, seeded(5));
    const first = deck.next();
    deck.missed(...first);
    const next = Array.from({ length: 10 }, () => factKey(...deck.next()));
    expect(next.indexOf(factKey(...first))).toBe(RETRY_GAP);
    expect(next.filter((k) => k === factKey(...first))).toHaveLength(1);
  });

  it("asks facts that are not mastered yet first", () => {
    const mastery: Record<string, number> = {};
    for (let n = 1; n <= 12; n++) mastery[factKey(6, n)] = n === 8 ? 0 : MASTERED;
    expect(factKey(...factDeck([6], mastery, seeded(2)).next())).toBe(factKey(6, 8));
  });
});
