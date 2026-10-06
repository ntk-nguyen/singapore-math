/**
 * Word problems (solved with bar models) and solve-for-x equations, in three levels.
 * Easy is free; intermediate and advanced need the Family plan and are only served
 * by the API after a server-side plan check.
 */
import type { BarModelSpec } from "./models";
import { NAMES, numberChoices, type Grade, type Question } from "./questions";
import { gcd, helpers, type Rng } from "./rng";

export type Level = "easy" | "intermediate" | "advanced";
export type Kind = "word" | "equations";

export const LEVELS: { id: Level; label: string; free: boolean }[] = [
  { id: "easy", label: "Easy", free: true },
  { id: "intermediate", label: "Intermediate", free: false },
  { id: "advanced", label: "Advanced", free: false },
];

export const KINDS: Record<Kind, { title: string; blurb: Record<Level, string> }> = {
  word: {
    title: "Word problems",
    blurb: {
      easy: "One-step problems (Grades 1–3): put together, take away, compare, equal groups, sharing.",
      intermediate: "Two-step problems (Grades 4–5): times as many, total and difference, money, fractions of a set.",
      advanced: "Singapore heuristics (Grades 5–6): fraction of the remainder, before and after, ages, changing ratios.",
    },
  },
  equations: {
    title: "Solve for x",
    blurb: {
      easy: "One-step equations like x + 7 = 15 and 4x = 28 (Grade 6).",
      intermediate: "Two-step equations like 3x + 5 = 26 and 4(x + 2) = 36 (Grade 7).",
      advanced: "x on both sides, brackets and negative answers, like 7x − 4 = 3x + 20 (Grade 8).",
    },
  },
};

export function isLevel(x: string): x is Level {
  return x === "easy" || x === "intermediate" || x === "advanced";
}
export function isKind(x: string): x is Kind {
  return x === "word" || x === "equations";
}

interface Problem {
  grade: Grade;
  std: string;
  text: string;
  answer: number;
  model?: BarModelSpec;
  steps: string[];
}

type Gen = (h: ReturnType<typeof helpers>) => Problem;

const ITEMS = ["stickers", "marbles", "cards", "beads", "stamps", "shells"];
const two = (pick: ReturnType<typeof helpers>["pick"]) => {
  const a = pick(NAMES);
  let b = pick(NAMES);
  while (b === a) b = pick(NAMES);
  return [a, b] as const;
};

/* ---------------- word problems ---------------- */

const WORD: Record<Level, Gen[]> = {
  easy: [
    ({ ri }) => {
      const a = ri(20, 80), b = ri(10, 60);
      return { grade: 2, std: "2.OA.A.1", text: `A shop sold ${a} apples in the morning and ${b} apples in the afternoon. How many apples did it sell in all?`, answer: a + b,
        model: { t: "pw", parts: [a, b], labels: ["am", "pm"], unk: "whole" },
        steps: [`Draw one bar with two parts: ${a} and ${b}.`, `The whole bar is the total: ${a} + ${b} = ${a + b} apples.`] };
    },
    ({ ri, pick }) => {
      const n = pick(NAMES), item = pick(ITEMS), a = ri(30, 95), b = ri(10, a - 10);
      return { grade: 2, std: "2.OA.A.1", text: `${n} had ${a} ${item}. ${n} gave away ${b} of them. How many ${item} are left?`, answer: a - b,
        model: { t: "pw", parts: [b, a - b], labels: ["gave", "left"], unk: 1, whole: a },
        steps: [`The whole bar is ${a}. One part is the ${b} given away.`, `The other part is what's left: ${a} − ${b} = ${a - b}.`] };
    },
    ({ ri, pick }) => {
      const [p, q] = two(pick), item = pick(ITEMS), a = ri(30, 90), d = ri(5, a - 10);
      return { grade: 2, std: "2.OA.A.1", text: `${p} has ${a} ${item}. ${q} has ${d} fewer ${item} than ${p}. How many ${item} does ${q} have?`, answer: a - d,
        model: { t: "cmp", a: a - d, b: a, names: [q, p], unk: "small" },
        steps: [`${p}'s bar is longer by ${d}.`, `${q} = ${a} − ${d} = ${a - d}.`] };
    },
    ({ ri, pick }) => {
      const e = ri(4, 9), g = ri(3, 9), item = pick(ITEMS);
      return { grade: 3, std: "3.OA.A.3", text: `A pack has ${e} ${item}. How many ${item} are in ${g} packs?`, answer: e * g,
        model: { t: "units", n: g, shade: g, unit: e, total: null },
        steps: [`Draw ${g} equal units, one per pack, with ${e} in each.`, `${g} units = ${g} × ${e} = ${e * g}.`] };
    },
    ({ ri }) => {
      const g = ri(3, 8), e = ri(3, 9);
      return { grade: 3, std: "3.OA.A.3", text: `${g * e} cupcakes are packed equally into ${g} boxes. How many cupcakes are in each box?`, answer: e,
        model: { t: "units", n: g, shade: 1, unit: null, total: g * e },
        steps: [`Draw ${g} equal units that make ${g * e}.`, `1 unit = ${g * e} ÷ ${g} = ${e}.`] };
    },
  ],
  intermediate: [
    ({ ri, pick }) => {
      const [p, q] = two(pick), item = pick(ITEMS), n = ri(2, 5), u = ri(4, 30), t = (n + 1) * u;
      return { grade: 4, std: "4.OA.A.2", text: `${p} has ${n} times as many ${item} as ${q}. Together they have ${t} ${item}. How many ${item} does ${p} have?`, answer: n * u,
        model: { t: "ratio", r: n, b: 1, total: t, names: [p, q], noun: item },
        steps: [`${q} is 1 unit and ${p} is ${n} units, so there are ${n + 1} units altogether.`, `${n + 1} units = ${t}, so 1 unit = ${t} ÷ ${n + 1} = ${u}.`, `${p} has ${n} units = ${n} × ${u} = ${n * u}.`] };
    },
    ({ ri, pick }) => {
      const [p, q] = two(pick), item = pick(ITEMS), small = ri(10, 60), d = ri(4, 30), t = 2 * small + d;
      return { grade: 4, std: "4.OA.A.3", text: `${p} and ${q} have ${t} ${item} altogether. ${p} has ${d} more than ${q}. How many ${item} does ${q} have?`, answer: small,
        model: { t: "cmp", a: small, b: small + d, names: [q, p], unk: "small", total: t },
        steps: [`Take away the extra ${d} from the total: ${t} − ${d} = ${t - d}.`, `Now both bars are equal: 2 units = ${t - d}.`, `${q} = ${t - d} ÷ 2 = ${small}.`] };
    },
    ({ ri, pick }) => {
      const n = pick(NAMES), p = ri(2, 6), q = ri(3, 9), m = ri(2, 5), k = ri(2, 4);
      const cost = p * m + q * k, bill = cost < 50 ? 50 : 100;
      return { grade: 4, std: "4.OA.A.3", text: `Pens cost $${p} each and notebooks cost $${q} each. ${n} buys ${m} pens and ${k} notebooks and pays with a $${bill} bill. How much change does ${n} get?`, answer: bill - cost,
        steps: [`Pens: ${m} × $${p} = $${p * m}. Notebooks: ${k} × $${q} = $${q * k}.`, `Total cost: $${p * m} + $${q * k} = $${cost}.`, `Change: $${bill} − $${cost} = $${bill - cost}.`] };
    },
    ({ ri, pick }) => {
      const d = pick([4, 5, 6, 8]), n = ri(1, d - 1), u = ri(3, 12), tot = d * u;
      return { grade: 5, std: "5.NF.B.6", text: `${n}/${d} of the ${tot} children at a party are boys. How many girls are there?`, answer: (d - n) * u,
        model: { t: "units", n: d, shade: d - n, unit: null, total: tot, note: `Shaded units are girls: ${d - n} of ${d}.` },
        steps: [`Cut the bar for ${tot} children into ${d} units: 1 unit = ${tot} ÷ ${d} = ${u}.`, `Boys are ${n} units, so girls are ${d - n} units.`, `Girls = ${d - n} × ${u} = ${(d - n) * u}.`] };
    },
  ],
  advanced: [
    ({ ri, pick }) => {
      const n = pick(NAMES), a = ri(2, 5), b = ri(2, 5), k = ri(2, 12);
      const total = a * b * k, left = (a - 1) * (b - 1) * k;
      return { grade: 5, std: "5.NF.B.6", text: `${n} spent 1/${a} of ${n}'s money on a book and 1/${b} of the remainder on a pen. ${n} had $${left} left. How much money did ${n} have at first?`, answer: total,
        model: { t: "units", n: a * b, shade: (a - 1) * (b - 1), unit: null, total: null, note: `Cut the money into ${units(a * b, true)}. ${units((a - 1) * (b - 1), true)} ${(a - 1) * (b - 1) === 1 ? "is" : "are"} left (shaded).` },
        steps: [
          `Draw the money as ${units(a)}. The book is 1 unit, leaving ${units(a - 1)}.`,
          `To take 1/${b} of the remainder, cut every unit into ${b}: now there are ${units(a * b, true)} and the remainder is ${units((a - 1) * b, true)}.`,
          `The pen is ${units(a - 1, true)}, so ${(a - 1) * b} − ${a - 1} = ${units((a - 1) * (b - 1), true)} ${(a - 1) * (b - 1) === 1 ? "is" : "are"} left.`,
          `${units((a - 1) * (b - 1), true)} = $${left}, so 1 small unit = $${k}. At first: ${a * b} × $${k} = $${total}.`,
        ] };
    },
    ({ ri, pick }) => {
      const [p, q] = two(pick), item = pick(ITEMS), m = pick([2, 3]);
      let u = ri(4, 20);
      if (((m - 1) * u) % 2) u++;
      const k = ((m - 1) * u) / 2;
      return { grade: 6, std: "6.EE.B.7", text: `${p} has ${m} times as many ${item} as ${q}. After ${p} gives ${k} ${item} to ${q}, they have the same number. How many ${item} did ${p} have at first?`, answer: m * u,
        model: { t: "ratio", r: m, b: 1, total: (m + 1) * u, names: [p, q], noun: item },
        steps: [
          `Before: ${q} is 1 unit and ${p} is ${m} units. The difference is ${m - 1} unit${m > 2 ? "s" : ""}.`,
          `Giving ${k} closes the gap from both sides, so the difference is 2 × ${k} = ${2 * k}.`,
          `${m - 1} unit${m > 2 ? "s" : ""} = ${2 * k}, so 1 unit = ${u}. ${p} had ${m} × ${u} = ${m * u}.`,
        ] };
    },
    ({ ri, pick }) => {
      const n = pick(NAMES), a = ri(5, 12), y = ri(2, 15), f = 2 * a + y;
      return { grade: 6, std: "6.EE.B.7", text: `${n} is ${a} years old and ${n}'s father is ${f}. In how many years will the father be exactly twice as old as ${n}?`, answer: y,
        model: { t: "cmp", a: a + y, b: f + y, names: [n, "Father"], unk: "diff" },
        steps: [
          `The age gap never changes: ${f} − ${a} = ${f - a} years.`,
          `When the father is twice as old, the gap equals ${n}'s age, so ${n} will be ${f - a}.`,
          `That is ${f - a} − ${a} = ${y} years from now.`,
        ] };
    },
    ({ ri }) => {
      let r1 = ri(1, 4), r2 = ri(r1 + 1, 7);
      while (gcd(r1, r2) !== 1) { r1 = ri(1, 4); r2 = ri(r1 + 1, 7); }
      const u = ri(3, 12), k = (r2 - r1) * u;
      return { grade: 6, std: "6.RP.A.3", text: `The ratio of boys to girls in a club is ${r1} : ${r2}. After ${k} more boys join, there are as many boys as girls. How many girls are in the club?`, answer: r2 * u,
        model: { t: "ratio", r: r1, b: r2, total: (r1 + r2) * u, names: ["Boys", "Girls"], noun: "children" },
        steps: [
          `Boys are ${r1} units and girls are ${r2} units. The girls stay the same.`,
          `The ${k} new boys fill the gap of ${r2 - r1} unit${r2 - r1 > 1 ? "s" : ""}, so 1 unit = ${k} ÷ ${r2 - r1} = ${u}.`,
          `Girls = ${r2} × ${u} = ${r2 * u}.`,
        ] };
    },
  ],
};

/* ---------------- equations ---------------- */

const units = (n: number, small = false) => `${n} ${small ? "small " : ""}unit${n === 1 ? "" : "s"}`;

const sgn = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);

const EQ: Record<Level, Gen[]> = {
  easy: [
    ({ ri }) => {
      const x = ri(2, 40), a = ri(3, 30), b = x + a;
      return { grade: 6, std: "6.EE.B.7", text: `Solve for x: x + ${a} = ${b}`, answer: x,
        model: { t: "pw", parts: [x, a], labels: ["", ""], unk: 0, whole: b },
        steps: [`x and ${a} make ${b}.`, `Subtract ${a} from both sides: x = ${b} − ${a} = ${x}.`] };
    },
    ({ ri }) => {
      const x = ri(10, 60), a = ri(2, x - 2);
      return { grade: 6, std: "6.EE.B.7", text: `Solve for x: x − ${a} = ${x - a}`, answer: x,
        steps: [`Taking ${a} from x leaves ${x - a}.`, `Add ${a} to both sides: x = ${x - a} + ${a} = ${x}.`] };
    },
    ({ ri }) => {
      const a = ri(2, 9), x = ri(2, 12);
      return { grade: 6, std: "6.EE.B.7", text: `Solve for x: ${a}x = ${a * x}`, answer: x,
        model: { t: "eq", n: a, c: 0, total: a * x, x: null },
        steps: [`${a}x means ${a} units of x, which make ${a * x}.`, `Divide both sides by ${a}: x = ${a * x} ÷ ${a} = ${x}.`] };
    },
    ({ ri }) => {
      const a = ri(2, 9), b = ri(2, 12);
      return { grade: 6, std: "6.EE.B.7", text: `Solve for x: x ÷ ${a} = ${b}`, answer: a * b,
        steps: [`x shared into ${a} equal parts gives ${b} in each part.`, `Multiply both sides by ${a}: x = ${b} × ${a} = ${a * b}.`] };
    },
  ],
  intermediate: [
    ({ ri }) => {
      const a = ri(2, 9), x = ri(2, 15), b = ri(1, 30), c = a * x + b;
      return { grade: 7, std: "7.EE.B.4a", text: `Solve for x: ${a}x + ${b} = ${c}`, answer: x,
        model: { t: "eq", n: a, c: b, total: c, x: null },
        steps: [`Subtract ${b} from both sides: ${a}x = ${c - b}.`, `Divide both sides by ${a}: x = ${x}.`, `Check: ${a} × ${x} + ${b} = ${c}.`] };
    },
    ({ ri }) => {
      const a = ri(2, 9), x = ri(3, 15), b = ri(1, a * x - 1), c = a * x - b;
      return { grade: 7, std: "7.EE.B.4a", text: `Solve for x: ${a}x − ${b} = ${c}`, answer: x,
        steps: [`Add ${b} to both sides: ${a}x = ${c + b}.`, `Divide both sides by ${a}: x = ${x}.`, `Check: ${a} × ${x} − ${b} = ${c}.`] };
    },
    ({ ri }) => {
      const a = ri(2, 6), b = ri(1, 9), x = ri(1, 12), c = a * (x + b);
      return { grade: 7, std: "7.EE.B.4a", text: `Solve for x: ${a}(x + ${b}) = ${c}`, answer: x,
        steps: [`Divide both sides by ${a}: x + ${b} = ${c / a}.`, `Subtract ${b}: x = ${x}.`, `Check: ${a} × (${x} + ${b}) = ${c}.`] };
    },
    ({ ri }) => {
      const a = ri(2, 6), q = ri(2, 10), b = ri(1, 15), x = a * q;
      return { grade: 7, std: "7.EE.B.4a", text: `Solve for x: x/${a} + ${b} = ${q + b}`, answer: x,
        steps: [`Subtract ${b} from both sides: x/${a} = ${q}.`, `Multiply both sides by ${a}: x = ${x}.`] };
    },
  ],
  advanced: [
    ({ ri }) => {
      const c = ri(1, 6), a = ri(c + 1, c + 6), x = ri(-8, 12) || 3, b = ri(1, 15) * (ri(0, 1) ? 1 : -1), d = (a - c) * x + b;
      return { grade: 8, std: "8.EE.C.7b", text: `Solve for x: ${a}x ${sgn(b)} = ${c}x ${sgn(d)}`, answer: x,
        steps: [
          `Subtract ${c}x from both sides: ${a - c}x ${sgn(b)} = ${d}.`,
          `${b >= 0 ? `Subtract ${b}` : `Add ${-b}`} on both sides: ${a - c}x = ${d - b}.`,
          `Divide by ${a - c}: x = ${x}.`,
        ] };
    },
    ({ ri }) => {
      const a = ri(2, 6), b = ri(1, 9), c = ri(1, a - 1 || 1), x = ri(-6, 12) || 2;
      const d = a * (x - b) - c * x;
      return { grade: 8, std: "8.EE.C.7b", text: `Solve for x: ${a}(x − ${b}) = ${c}x ${sgn(d)}`, answer: x,
        steps: [
          `Expand the brackets: ${a}x − ${a * b} = ${c}x ${sgn(d)}.`,
          `Subtract ${c}x: ${a - c}x − ${a * b} = ${d}.`,
          `Add ${a * b}: ${a - c}x = ${d + a * b}, so x = ${x}.`,
        ] };
    },
    ({ ri }) => {
      const a = ri(2, 9), x = -ri(1, 12), b = ri(1, 40), c = a * x + b;
      return { grade: 7, std: "7.EE.B.4a", text: `Solve for x: ${a}x + ${b} = ${c}`, answer: x,
        steps: [`Subtract ${b} from both sides: ${a}x = ${c - b}.`, `Divide by ${a}: x = ${x}. A negative answer is fine: check ${a} × (${x}) + ${b} = ${c}.`] };
    },
    ({ ri, pick }) => {
      const [p, q] = pick([[2, 3], [3, 4], [2, 5], [3, 6], [4, 6]] as const);
      const l = (p * q) / gcd(p, q), x = l * ri(1, 6), c = x / p + x / q;
      return { grade: 8, std: "8.EE.C.7b", text: `Solve for x: x/${p} + x/${q} = ${c}`, answer: x,
        steps: [
          `Multiply every term by ${l} (the lowest common multiple of ${p} and ${q}): ${l / p}x + ${l / q}x = ${c * l}.`,
          `Combine: ${l / p + l / q}x = ${c * l}.`,
          `Divide: x = ${x}.`,
        ] };
    },
  ],
};

function toQuestion(p: Problem, r: Rng): Question {
  return {
    grade: p.grade,
    std: p.std,
    text: p.text,
    answer: String(p.answer),
    choices: numberChoices(p.answer, r),
    model: p.model,
    steps: p.steps,
  };
}

export function generators(kind: Kind, level: Level): Gen[] {
  return (kind === "word" ? WORD : EQ)[level];
}

/** A practice set: cycles through every problem type for the level in random order. */
export function practiceSet(kind: Kind, level: Level, r: Rng, n = 10): Question[] {
  const h = helpers(r);
  const gens = generators(kind, level);
  const order = h.shuffle(Array.from({ length: n }, (_, i) => i % gens.length));
  return order.map((i) => toQuestion(gens[i](h), r));
}
