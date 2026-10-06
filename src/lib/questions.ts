import type { Method } from "./arithmetic";
import type { BarModelSpec } from "./models";
import { gcd, helpers, seeded, type Rng } from "./rng";

export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const GRADES: Grade[] = [1, 2, 3, 4, 5, 6, 7, 8];

type AnswerKind = "int" | "dec" | "frac" | "money";
type RawAnswer = number | [number, number];

interface RawQuestion {
  q: string;
  a: RawAnswer;
  k: AnswerKind;
  /** Common Core State Standard code. Every item carries one. */
  std: string;
  model?: BarModelSpec;
}

export interface Question {
  grade: Grade;
  text: string;
  std: string;
  answer: string;
  choices: string[];
  model?: BarModelSpec;
  /** Worked method (place-value discs, area model, long division) shown on "Show me how". */
  method?: Method;
  /** Worked solution, shown with the bar model on "Show me how". */
  steps?: string[];
}

export const NAMES = ["Mei", "Arjun", "Sofia", "Wei Ling", "Diego", "Aisha", "Ben", "Priya", "Kenji", "Zara", "Omar", "Lucy"];

export function formatAnswer(v: RawAnswer, kind: AnswerKind): string {
  if (kind === "frac") {
    const [n, d] = v as [number, number];
    const g = gcd(n, d);
    return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
  }
  const x = v as number;
  if (kind === "money") return "$" + x.toFixed(2);
  if (kind === "dec") return String(+x.toFixed(2));
  return String(x);
}

function distractors(a: RawAnswer, kind: AnswerKind, r: Rng): string[] {
  const { pick, ri, shuffle } = helpers(r);
  const out = new Set([formatAnswer(a, kind)]);
  let guard = 0;
  while (out.size < 4 && guard++ < 60) {
    let c: RawAnswer;
    if (kind === "frac") {
      const [n, d] = a as [number, number];
      c = [Math.max(1, n + pick([-2, -1, 1, 2])), d + pick([0, 0, 1, -1])];
      if (c[1] < 1) continue;
    } else if (kind === "dec" || kind === "money") {
      const x = a as number;
      c = +(x + pick([-1, 1]) * pick([0.1, 0.5, 1, x * 0.1, x * 0.2])).toFixed(2);
      if (c <= 0) continue;
    } else {
      const x = a as number;
      const step = Math.max(1, Math.round(Math.abs(x) * pick([0.1, 0.2, 0.25])) || 1);
      c = x + pick([-1, 1]) * pick([1, 2, step, 10]);
      if (x >= 0 && c < 0) continue;
    }
    out.add(formatAnswer(c, kind));
  }
  // Fallback so every question has four options.
  for (let k = 1; out.size < 4; k++) {
    if (kind === "frac") {
      const [n, d] = a as [number, number];
      out.add(formatAnswer([n + k * ri(1, 3), d + k], kind));
    } else {
      out.add(formatAnswer((a as number) + k * 3, kind));
    }
  }
  return shuffle([...out]);
}

/** Four shuffled answer choices for a whole-number or money answer, including the answer itself. */
export function numberChoices(answer: number, r: Rng, kind: "int" | "money" = "int"): string[] {
  return distractors(answer, kind, r);
}

type Gen = (h: ReturnType<typeof helpers>) => RawQuestion;

/** Question generators per grade, each mapped to a Common Core standard. */
const GEN: Record<Grade, Gen[]> = {
  1: [
    ({ ri }) => {
      const w = ri(8, 20), a = ri(2, w - 2);
      return { q: `Number bond: ${w} is made of ${a} and what number?`, a: w - a, k: "int", std: "1.OA.C.6", model: { t: "bond", w, p: [a, null] } };
    },
    ({ ri, pick }) => {
      const n = pick(NAMES), a = ri(3, 12), b = ri(2, 8);
      return { q: `${n} has ${a} red beads and ${b} blue beads. How many beads in all?`, a: a + b, k: "int", std: "1.OA.A.1", model: { t: "pw", parts: [a, b], labels: ["red", "blue"], unk: "whole" } };
    },
    ({ ri }) => {
      const w = ri(10, 19), a = ri(3, 9);
      return { q: `There are ${w} birds. ${a} fly away. How many are left?`, a: w - a, k: "int", std: "1.OA.A.1", model: { t: "pw", parts: [a, w - a], labels: ["flew", "left"], unk: 1, whole: w } };
    },
  ],
  2: [
    ({ ri, pick }) => {
      const n = pick(NAMES), a = ri(20, 60), b = ri(5, 30);
      return { q: `${n} has ${a} stickers. Sam has ${b} more stickers than ${n}. How many stickers does Sam have?`, a: a + b, k: "int", std: "2.OA.A.1", model: { t: "cmp", a, b: a + b, names: [n, "Sam"] } };
    },
    ({ ri }) => {
      const a = ri(30, 70), b = ri(10, a - 10), c = ri(10, 30);
      return { q: `A baker made ${a} muffins, sold ${b}, then baked ${c} more. How many muffins now?`, a: a - b + c, k: "int", std: "2.OA.A.1" };
    },
    ({ ri }) => {
      const a = ri(25, 75), b = ri(12, 24);
      return { q: `What is ${a} + ${b}?`, a: a + b, k: "int", std: "2.NBT.B.5" };
    },
  ],
  3: [
    ({ ri }) => {
      const g = ri(3, 9), e = ri(4, 9);
      return { q: `There are ${g} boxes with ${e} pencils in each box. How many pencils altogether?`, a: g * e, k: "int", std: "3.OA.A.3", model: { t: "units", n: g, shade: g, unit: e, total: null } };
    },
    ({ ri, pick }) => {
      const k = ri(3, 8), e = ri(3, 9), n = pick(NAMES);
      return { q: `${n} shares ${k * e} cookies equally among ${k} friends. How many cookies does each friend get?`, a: e, k: "int", std: "3.OA.A.3", model: { t: "units", n: k, shade: 1, unit: null, total: k * e } };
    },
    ({ ri }) => {
      const l = ri(5, 15), w = ri(2, 9);
      return { q: `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter in cm?`, a: 2 * (l + w), k: "int", std: "3.MD.D.8" };
    },
    ({ ri, pick }) => {
      const d = pick([2, 3, 4, 6, 8]), n = ri(1, d - 1), m = pick([2, 3]);
      return { q: `${n}/${d} = ?/${d * m}. What is the missing numerator?`, a: n * m, k: "int", std: "3.NF.A.3" };
    },
  ],
  4: [
    ({ ri }) => {
      const a = ri(120, 899), b = ri(3, 9);
      return { q: `What is ${a} × ${b}?`, a: a * b, k: "int", std: "4.NBT.B.5" };
    },
    ({ ri, pick }) => {
      const d = pick([5, 6, 8, 10, 12]), a = ri(1, d - 3), b = ri(1, d - a - 1);
      return { q: `What is ${a}/${d} + ${b}/${d}?`, a: [a + b, d], k: "frac", std: "4.NF.B.3", model: { t: "units", n: d, shade: a + b, unit: null, total: null } };
    },
    (h) => {
      const p = h.ri(2, 6), n = h.ri(3, 8), bill = h.pick([20, 50]);
      if (p * n >= bill) return GEN[4][0](h);
      return { q: `Pens cost $${p} each. Tom buys ${n} pens and pays with a $${bill} bill. How much change does he get?`, a: bill - p * n, k: "int", std: "4.OA.A.3" };
    },
  ],
  5: [
    ({ ri, pick }) => {
      const d = pick([4, 5, 8]), n = ri(1, d - 1), u = ri(3, 9), tot = d * u;
      return { q: `${n}/${d} of the ${tot} students in a class are girls. How many girls are there?`, a: n * u, k: "int", std: "5.NF.B.6", model: { t: "units", n: d, shade: n, unit: null, total: tot } };
    },
    ({ ri }) => {
      const a = ri(11, 49) / 10, b = ri(2, 6);
      return { q: `What is ${a} × ${b}?`, a: +(a * b).toFixed(2), k: "dec", std: "5.NBT.B.7" };
    },
    ({ ri }) => {
      const l = ri(3, 9), w = ri(2, 6), h = ri(2, 5);
      return { q: `A box is ${l} cm long, ${w} cm wide and ${h} cm high. What is its volume in cm³?`, a: l * w * h, k: "int", std: "5.MD.C.5" };
    },
  ],
  6: [
    (h) => {
      const r = h.ri(1, 4), b = h.ri(2, 5);
      if (gcd(r, b) !== 1 || r === b) return GEN[6][1](h);
      const u = h.ri(4, 10);
      return { q: `The ratio of red to blue marbles is ${r} : ${b}. There are ${(r + b) * u} marbles in all. How many are blue?`, a: b * u, k: "int", std: "6.RP.A.3", model: { t: "ratio", r, b, total: (r + b) * u } };
    },
    ({ pick }) => {
      const p = pick([10, 20, 25, 40, 50, 75]), n = pick([40, 60, 80, 120, 200]);
      return { q: `What is ${p}% of ${n}?`, a: (p * n) / 100, k: "dec", std: "6.RP.A.3c" };
    },
    ({ ri }) => {
      const m = ri(2, 7), c = ri(1, 12), x = ri(2, 9);
      return { q: `Evaluate ${m}x + ${c} when x = ${x}.`, a: m * x + c, k: "int", std: "6.EE.A.2c" };
    },
  ],
  7: [
    ({ pick }) => {
      const p = pick([40, 60, 80, 120, 150]), d = pick([10, 15, 20, 25, 30]);
      return { q: `A jacket costs $${p}. It is on sale for ${d}% off. What is the sale price?`, a: (p * (100 - d)) / 100, k: "money", std: "7.RP.A.3" };
    },
    ({ ri }) => {
      const a = ri(2, 9), x = ri(2, 12), b = ri(1, 20);
      return { q: `Solve for x: ${a}x + ${b} = ${a * x + b}`, a: x, k: "int", std: "7.EE.B.4a", model: { t: "eq", n: a, c: b, total: a * x + b, x: null } };
    },
    ({ ri }) => {
      const r = ri(2, 10);
      return { q: `A circle has radius ${r} cm. Using π ≈ 3.14, what is its area in cm²?`, a: +(3.14 * r * r).toFixed(2), k: "dec", std: "7.G.B.4" };
    },
  ],
  8: [
    ({ ri }) => {
      const x = ri(2, 9), a = ri(4, 9), c = ri(1, a - 1), b = ri(1, 10);
      const d = a * x - b - c * x;
      return { q: `Solve for x: ${a}x − ${b} = ${c}x ${d >= 0 ? "+ " + d : "− " + -d}`, a: x, k: "int", std: "8.EE.C.7" };
    },
    ({ pick }) => {
      const [p, q, h] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]] as const);
      return { q: `A right triangle has legs ${p} and ${q}. How long is the hypotenuse?`, a: h, k: "int", std: "8.G.B.7" };
    },
    ({ ri }) => {
      const x1 = ri(0, 4), y1 = ri(0, 5), m = ri(-3, 4) || 2, dx = ri(1, 4);
      return { q: `What is the slope of the line through (${x1}, ${y1}) and (${x1 + dx}, ${y1 + m * dx})?`, a: m, k: "int", std: "8.F.B.4" };
    },
  ],
};

/** Common Core code of each quick-fire generator at a grade, in generator order. */
export function generatorStds(grade: Grade): string[] {
  return GEN[grade].map((g) => g(helpers(seeded(1))).std);
}

export function generatorCount(grade: Grade): number {
  return GEN[grade].length;
}

/**
 * Make one question for a grade. With `index`, generators are cycled in order so a
 * test covers every standard for the grade; without it, one is picked at random.
 */
export function makeQuestion(grade: Grade, r: Rng, index?: number): Question {
  const h = helpers(r);
  const gens = GEN[grade];
  const gen = index == null ? h.pick(gens) : gens[index % gens.length];
  const raw = gen(h);
  return {
    grade,
    text: raw.q,
    std: raw.std,
    answer: formatAnswer(raw.a, raw.k),
    choices: distractors(raw.a, raw.k, r),
    model: raw.model,
  };
}

export function isGrade(n: unknown): n is Grade {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 8;
}
