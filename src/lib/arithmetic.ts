/**
 * Multi-digit arithmetic, taught the Singapore way: number bonds (make 10),
 * place-value discs with regrouping, the area model leading to long multiplication,
 * and long division as sharing place by place. Each algorithm returns step-by-step
 * snapshots that the lesson components render, so any problem can be explained.
 */
import type { Grade, Question } from "./questions";
import { helpers, type Rng } from "./rng";

export type Op = "make10" | "add" | "sub" | "mul" | "div";

export interface Method {
  op: Op;
  a: number;
  b: number;
}

export const PLACE_NAMES = ["ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands"];
export const PLACE_SHORT = ["1", "10", "100", "1k", "10k", "100k"];

/** Digits of n, ones first, padded to `width`. */
export function digits(n: number, width = String(n).length): number[] {
  const s = String(n).padStart(width, "0");
  return s.split("").reverse().map(Number);
}

const fromDigits = (d: number[]) => d.reduceRight((acc, x) => acc * 10 + x, 0);
const place = (i: number, plural = true) => (plural ? PLACE_NAMES[i] : PLACE_NAMES[i].replace(/s$/, ""));

/* ---------------- make 10 ---------------- */

export interface Make10Step {
  caption: string;
  /** Number bond of b split into [to10, rest], once revealed. */
  split: boolean;
  /** 10 has been made. */
  ten: boolean;
  done: boolean;
}

export function make10Steps(a: number, b: number) {
  const big = Math.max(a, b), small = Math.min(a, b);
  const to10 = 10 - big, rest = small - to10;
  const steps: Make10Step[] = [
    { caption: `Start with ${big} + ${small}. How many more does ${big} need to make 10? It needs ${to10}.`, split: false, ten: false, done: false },
    { caption: `Split ${small} into ${to10} and ${rest} with a number bond.`, split: true, ten: false, done: false },
    { caption: `${big} + ${to10} = 10. Now we have a ten.`, split: true, ten: true, done: false },
    { caption: `10 + ${rest} = ${10 + rest}. So ${big} + ${small} = ${big + small}.`, split: true, ten: true, done: true },
  ];
  return { big, small, to10, rest, steps };
}

/* ---------------- addition with regrouping ---------------- */

export interface ColumnStep {
  /** Column being worked on (0 = ones), or -1 for the setup / final step. */
  col: number;
  caption: string;
  /** Top number's digits as currently written (after any renaming in subtraction). */
  top: number[];
  /** Digits of the answer written so far (null = not yet). */
  result: (number | null)[];
  /** Small regrouping marks above each column: carried ones in addition, renamed digits in subtraction. */
  marks: (number | null)[];
  /** Columns crossed out because they were renamed. */
  crossed: boolean[];
}

export function addSteps(a: number, b: number) {
  const width = String(a + b).length;
  const A = digits(a, width), B = digits(b, width);
  const result: (number | null)[] = Array(width).fill(null);
  const marks: (number | null)[] = Array(width).fill(null);
  const crossed = Array(width).fill(false);
  const snap = (col: number, caption: string): ColumnStep => ({ col, caption, top: [...A], result: [...result], marks: [...marks], crossed: [...crossed] });
  const steps: ColumnStep[] = [snap(-1, `Line up ${a} and ${b} by place value. Start with the ones.`)];
  let carry = 0;
  const cols = Math.max(String(a).length, String(b).length);
  for (let i = 0; i < width; i++) {
    if (i >= cols && carry === 0) break;
    const sum = A[i] + B[i] + carry;
    const parts = [A[i], B[i], ...(carry ? [carry] : [])].filter((x, k) => x > 0 || k < 2).join(" + ");
    result[i] = sum % 10;
    const newCarry = Math.floor(sum / 10);
    let caption = `${place(i)[0].toUpperCase() + place(i).slice(1)}: ${parts} = ${sum}.`;
    if (newCarry) {
      marks[i + 1] = newCarry;
      caption += ` That's ${sum} ${place(i)}. Trade 10 ${place(i)} for 1 ${place(i + 1, false)}: write ${sum % 10}, carry 1 to the ${place(i + 1)}.`;
    } else if (i >= cols) {
      caption = `${place(i)[0].toUpperCase() + place(i).slice(1)}: the carried 1 makes ${sum}.`;
    } else {
      caption += ` Write ${sum}.`;
    }
    steps.push(snap(i, caption));
    carry = newCarry;
  }
  steps.push(snap(-1, `${a} + ${b} = ${a + b}.`));
  return { width, A, B, steps, answer: a + b };
}

/* ---------------- subtraction with renaming ---------------- */

export function subSteps(a: number, b: number) {
  const width = String(a).length;
  const top = digits(a, width), B = digits(b, width);
  const result: (number | null)[] = Array(width).fill(null);
  const marks: (number | null)[] = Array(width).fill(null);
  const crossed = Array(width).fill(false);
  const snap = (col: number, caption: string): ColumnStep => ({ col, caption, top: [...top], result: [...result], marks: [...marks], crossed: [...crossed] });
  const steps: ColumnStep[] = [snap(-1, `Line up ${a} and ${b} by place value. Start with the ones.`)];
  for (let i = 0; i < width; i++) {
    if (top[i] < B[i]) {
      // Rename: find the next place that has something to give.
      let j = i + 1;
      while (top[j] === 0) j++;
      const chain: string[] = [];
      top[j]--;
      marks[j] = top[j];
      crossed[j] = true;
      chain.push(`1 ${place(j, false)} from the ${place(j)}`);
      for (let k = j - 1; k > i; k--) {
        top[k] = 9;
        marks[k] = 9;
        crossed[k] = true;
      }
      top[i] += 10;
      marks[i] = top[i];
      crossed[i] = true;
      const via = j > i + 1 ? ` (the ${place(j - 1)} in between become 10, then give one away, leaving 9)` : "";
      steps.push(snap(i, `${cap(place(i))}: ${top[i] - 10} − ${B[i]} can't be done. Rename ${chain[0]} as 10 ${place(i)}${via}. Now there are ${top[i]} ${place(i)}.`));
    }
    result[i] = top[i] - B[i];
    steps.push(snap(i, `${cap(place(i))}: ${top[i]} − ${B[i]} = ${top[i] - B[i]}.`));
  }
  // Drop leading zeros from the written answer.
  for (let i = width - 1; i > 0 && result[i] === 0; i--) result[i] = null;
  steps.push(snap(-1, `${a} − ${b} = ${a - b}. Check: ${a - b} + ${b} = ${a}.`));
  return { width, A: digits(a, width), B, steps, answer: a - b };
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/* ---------------- multiplication: area model ---------------- */

export interface AreaCell {
  /** Place-value part of a (row) and b (column). */
  rowPart: number;
  colPart: number;
  product: number;
}

/** Split a number into place-value parts, largest first: 324 → [300, 20, 4] (zeros dropped). */
export function expand(n: number): number[] {
  const d = digits(n);
  const parts: number[] = [];
  for (let i = d.length - 1; i >= 0; i--) if (d[i]) parts.push(d[i] * 10 ** i);
  return parts.length ? parts : [0];
}

export function areaModel(a: number, b: number) {
  const aParts = expand(a), bParts = expand(b);
  const cells: AreaCell[][] = bParts.map((bp) => aParts.map((ap) => ({ rowPart: bp, colPart: ap, product: ap * bp })));
  // Each row of the area model is one partial product in long multiplication.
  const partials = bParts.map((bp) => ({ by: bp, value: a * bp }));
  return { aParts, bParts, cells, partials, answer: a * b };
}

/* ---------------- long division ---------------- */

export interface DivStep {
  /** Index of the dividend digit this step ends on (0 = leftmost). */
  pos: number;
  /** Number being shared at this step (remainder brought down with the next digit). */
  current: number;
  q: number;
  product: number;
  remainder: number;
  caption: string;
}

export function longDivision(dividend: number, divisor: number) {
  const ds = String(dividend).split("").map(Number);
  const steps: DivStep[] = [];
  let current = 0;
  let started = false;
  const quotient: number[] = [];
  for (let pos = 0; pos < ds.length; pos++) {
    current = current * 10 + ds[pos];
    const q = Math.floor(current / divisor);
    if (!started && q === 0 && pos < ds.length - 1) continue; // too small: take the next digit too
    started = true;
    quotient.push(q);
    const product = q * divisor;
    const remainder = current - product;
    const placeIdx = ds.length - 1 - pos;
    const what = `${current} ${place(placeIdx, current !== 1)}`;
    let caption = `Share ${what} into ${divisor} groups: ${q} in each group (${q} × ${divisor} = ${product}), ${remainder} left over.`;
    if (remainder && pos < ds.length - 1) caption += ` Regroup ${remainder} ${place(placeIdx, remainder !== 1)} as ${remainder * 10} ${place(placeIdx - 1)} and bring down the next digit.`;
    else if (pos < ds.length - 1) caption += " Bring down the next digit.";
    steps.push({ pos, current, q, product, remainder, caption });
    current = remainder;
  }
  const q = Math.floor(dividend / divisor), r = dividend % divisor;
  return { digits: ds, divisor, steps, quotient: q, remainder: r, firstPos: steps[0]?.pos ?? 0 };
}

export function formatDivision(q: number, r: number): string {
  return r ? `${q} R ${r}` : String(q);
}

/* ---------------- topics by grade ---------------- */

export interface Topic {
  id: string;
  grade: Grade;
  op: Op;
  title: string;
  /** Common Core code. */
  std: string;
  blurb: string;
  gen: (r: Rng) => { a: number; b: number };
}

const nd = (n: number) => [10 ** (n - 1), 10 ** n - 1] as const;

/** Random n-digit number. */
function num(r: Rng, n: number) {
  const [lo, hi] = nd(n);
  return helpers(r).ri(lo, hi);
}

/** a + b where at least one column regroups, with the sum at most `max` (the grade's "within" limit). */
function regroupingAdd(r: Rng, na: number, nb: number, max = Infinity) {
  for (let t = 0; t < 200; t++) {
    const a = num(r, na), b = num(r, nb);
    if (a + b > max) continue;
    const A = digits(a, na), B = digits(b, na);
    if (A.some((x, i) => x + (B[i] ?? 0) >= 10)) return { a, b };
  }
  return { a: num(r, na), b: num(r, nb) };
}

/** a − b (a > b) where at least one column needs renaming. */
function renamingSub(r: Rng, na: number, nb: number, zeros = false) {
  for (let t = 0; t < 80; t++) {
    let a = num(r, na);
    if (zeros && na >= 3) a = Math.floor(a / 100) * 100 + (helpers(r).ri(0, 1) ? 0 : helpers(r).ri(1, 9)); // e.g. 4003, 600
    const b = num(r, nb);
    if (b >= a) continue;
    const A = digits(a, na), B = digits(b, na);
    if (A.some((x, i) => x < (B[i] ?? 0))) return { a, b };
  }
  const a = num(r, na);
  return { a, b: Math.floor(a / 2) + 1 };
}

function division(r: Rng, nd: number, divisorDigits: number, remainder: boolean) {
  const { ri } = helpers(r);
  for (let t = 0; t < 80; t++) {
    const b = divisorDigits === 1 ? ri(2, 9) : num(r, divisorDigits);
    const [lo, hi] = [10 ** (nd - 1), 10 ** nd - 1];
    const q = ri(Math.ceil(lo / b), Math.floor(hi / b));
    const rem = remainder ? ri(1, b - 1) : 0;
    const a = q * b + rem;
    if (a >= lo && a <= hi && q >= 2) return { a, b };
  }
  return { a: 10 ** nd - 1 - ((10 ** nd - 1) % 7), b: 7 };
}

export const TOPICS: Topic[] = [
  // Grade 1
  { id: "g1-make10", grade: 1, op: "make10", std: "1.OA.C.6", title: "Add within 20 by making 10", blurb: "8 + 5: split 5 into 2 and 3, make 10, then add 3.",
    gen: (r) => { const { ri } = helpers(r); const a = ri(6, 9); return { a, b: ri(11 - a, 9) }; } },
  { id: "g1-add-2d1d", grade: 1, op: "add", std: "1.NBT.C.4", title: "Add a 2-digit and a 1-digit number", blurb: "Trade 10 ones for 1 ten when the ones overflow.",
    gen: (r) => regroupingAdd(r, 2, 1, 100) },
  // Grade 2
  { id: "g2-add-2d", grade: 2, op: "add", std: "2.NBT.B.5", title: "2-digit addition with regrouping", blurb: "47 + 38 with place-value discs, then the column method.",
    gen: (r) => regroupingAdd(r, 2, 2, 100) },
  { id: "g2-sub-2d", grade: 2, op: "sub", std: "2.NBT.B.5", title: "2-digit subtraction with renaming", blurb: "Not enough ones? Rename 1 ten as 10 ones.",
    gen: (r) => renamingSub(r, 2, 2) },
  { id: "g2-add-3d", grade: 2, op: "add", std: "2.NBT.B.7", title: "3-digit addition", blurb: "Add hundreds, tens and ones, regrouping as needed.",
    gen: (r) => regroupingAdd(r, 3, 3, 1000) },
  { id: "g2-sub-3d", grade: 2, op: "sub", std: "2.NBT.B.7", title: "3-digit subtraction", blurb: "Rename tens and hundreds within 1000.",
    gen: (r) => renamingSub(r, 3, 3) },
  // Grade 3
  { id: "g3-add-3d", grade: 3, op: "add", std: "3.NBT.A.2", title: "3-digit addition, fluently", blurb: "Regrouping in more than one column.",
    gen: (r) => regroupingAdd(r, 3, 3, 1000) },
  { id: "g3-sub-3d-zeros", grade: 3, op: "sub", std: "3.NBT.A.2", title: "3-digit subtraction across zeros", blurb: "Like 500 − 168: rename across the zero.",
    gen: (r) => renamingSub(r, 3, 3, true) },
  { id: "g3-mul-tens", grade: 3, op: "mul", std: "3.NBT.A.3", title: "Multiply by multiples of 10", blurb: "7 × 60 is 7 × 6 tens = 42 tens.",
    gen: (r) => { const { ri } = helpers(r); return { a: ri(2, 9) * 10, b: ri(2, 9) }; } },
  { id: "g3-div-facts", grade: 3, op: "div", std: "3.OA.C.7", title: "Division within 100", blurb: "Share equally into groups, place by place.",
    gen: (r) => { const { ri } = helpers(r); const b = ri(2, 9), q = ri(2, Math.floor(99 / b)); return { a: q * b, b }; } },
  // Grade 4
  { id: "g4-add-4d", grade: 4, op: "add", std: "4.NBT.B.4", title: "4-digit addition", blurb: "The standard algorithm with thousands.",
    gen: (r) => regroupingAdd(r, 4, 4) },
  { id: "g4-sub-4d", grade: 4, op: "sub", std: "4.NBT.B.4", title: "4-digit subtraction", blurb: "Renaming across thousands, including zeros.",
    gen: (r) => renamingSub(r, 4, helpers(r).ri(3, 4), true) },
  { id: "g4-add-5d", grade: 4, op: "add", std: "4.NBT.B.4", title: "5-digit addition", blurb: "Same method, bigger numbers: up to ten thousands.",
    gen: (r) => regroupingAdd(r, 5, 5) },
  { id: "g4-sub-5d", grade: 4, op: "sub", std: "4.NBT.B.4", title: "5-digit subtraction", blurb: "Rename one place at a time, right to left.",
    gen: (r) => renamingSub(r, 5, helpers(r).ri(4, 5)) },
  { id: "g4-mul-2d1d", grade: 4, op: "mul", std: "4.NBT.B.5", title: "2-digit × 1-digit", blurb: "Split 47 × 6 into 40 × 6 and 7 × 6.",
    gen: (r) => ({ a: num(r, 2), b: helpers(r).ri(3, 9) }) },
  { id: "g4-mul-3d1d", grade: 4, op: "mul", std: "4.NBT.B.5", title: "3-digit × 1-digit", blurb: "Hundreds, tens and ones, each times the same number.",
    gen: (r) => ({ a: num(r, 3), b: helpers(r).ri(3, 9) }) },
  { id: "g4-mul-4d1d", grade: 4, op: "mul", std: "4.NBT.B.5", title: "4-digit × 1-digit", blurb: "Area model: multiply each place, then add.",
    gen: (r) => ({ a: num(r, 4), b: helpers(r).ri(3, 9) }) },
  { id: "g4-mul-2d2d", grade: 4, op: "mul", std: "4.NBT.B.5", title: "2-digit × 2-digit", blurb: "23 × 14 as four rectangles: 200 + 30 + 80 + 12.",
    gen: (r) => ({ a: num(r, 2), b: helpers(r).ri(11, 99) }) },
  { id: "g4-div-3d1d", grade: 4, op: "div", std: "4.NBT.B.6", title: "3-digit ÷ 1-digit", blurb: "Share hundreds, then tens, then ones.",
    gen: (r) => division(r, 3, 1, false) },
  { id: "g4-div-4d1d", grade: 4, op: "div", std: "4.NBT.B.6", title: "4-digit ÷ 1-digit with remainders", blurb: "Long division, with what's left over as a remainder.",
    gen: (r) => division(r, 4, 1, true) },
  // Grade 5
  { id: "g5-mul-3d2d", grade: 5, op: "mul", std: "5.NBT.B.5", title: "3-digit × 2-digit", blurb: "From the area model to long multiplication.",
    gen: (r) => ({ a: num(r, 3), b: num(r, 2) }) },
  { id: "g5-mul-4d2d", grade: 5, op: "mul", std: "5.NBT.B.5", title: "4-digit × 2-digit", blurb: "Two partial products, then add.",
    gen: (r) => ({ a: num(r, 4), b: num(r, 2) }) },
  { id: "g5-mul-5d2d", grade: 5, op: "mul", std: "5.NBT.B.5", title: "5-digit × 2-digit", blurb: "Big numbers, same idea: two partial products.",
    gen: (r) => ({ a: num(r, 5), b: num(r, 2) }) },
  { id: "g5-div-3d2d", grade: 5, op: "div", std: "5.NBT.B.6", title: "3-digit ÷ 2-digit", blurb: "Estimate each quotient digit with friendly numbers.",
    gen: (r) => division(r, 3, 2, false) },
  { id: "g5-div-4d2d", grade: 5, op: "div", std: "5.NBT.B.6", title: "4-digit ÷ 2-digit", blurb: "Long division with a 2-digit divisor.",
    gen: (r) => division(r, 4, 2, false) },
  // Grade 6
  { id: "g6-div-5d2d", grade: 6, op: "div", std: "6.NS.B.2", title: "5-digit ÷ 2-digit", blurb: "Fluent long division, with remainders.",
    gen: (r) => division(r, 5, 2, helpers(r).ri(0, 1) === 1) },
  { id: "g6-div-5d3d", grade: 6, op: "div", std: "6.NS.B.2", title: "5-digit ÷ 3-digit", blurb: "Long division with a 3-digit divisor.",
    gen: (r) => division(r, 5, 3, helpers(r).ri(0, 1) === 1) },
];

export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

export const SYMBOL: Record<Op, string> = { make10: "+", add: "+", sub: "−", mul: "×", div: "÷" };

export function answerFor({ op, a, b }: Method): string {
  switch (op) {
    case "make10":
    case "add": return String(a + b);
    case "sub": return String(a - b);
    case "mul": return String(a * b);
    case "div": return formatDivision(Math.floor(a / b), a % b);
  }
}

/** Wrong answers that come from real mistakes (forgetting to carry, subtracting smaller from larger, etc.). */
function mistakes({ op, a, b }: Method, r: Rng): string[] {
  const { pick } = helpers(r);
  const out: number[] = [];
  if (op === "add" || op === "make10") {
    const w = String(a + b).length, A = digits(a, w), B = digits(b, w);
    out.push(fromDigits(A.map((x, i) => (x + B[i]) % 10))); // forgot to carry
    out.push(a + b + pick([10, -10]), a + b + pick([1, -1, 100]));
  } else if (op === "sub") {
    const w = String(a).length, A = digits(a, w), B = digits(b, w);
    out.push(fromDigits(A.map((x, i) => Math.abs(x - B[i])))); // smaller from larger
    out.push(a - b + pick([10, -10]), a - b + pick([100, -100, 1]));
  } else if (op === "mul") {
    const bd = digits(b);
    if (bd.length > 1) out.push(bd.reduce((s, d) => s + a * d, 0)); // forgot place value in partial products
    out.push(a * b + pick([a, -a]), a * b + pick([10, -10, 100]));
  } else {
    const q = Math.floor(a / b), rem = a % b;
    return [q + 1, q - 1, q + 10, q > 10 ? Math.floor(q / 10) : q + 2]
      .filter((x) => x > 0)
      .map((x) => formatDivision(x, rem))
      .concat(rem ? [String(q)] : []);
  }
  return out.filter((x) => x >= 0).map(String);
}

export function methodQuestion(topic: Topic, r: Rng): Question {
  const { a, b } = topic.gen(r);
  const method: Method = { op: topic.op, a, b };
  const answer = answerFor(method);
  const set = new Set([answer]);
  for (const m of mistakes(method, r)) if (set.size < 4) set.add(m);
  for (let k = 2; set.size < 4; k++) set.add(topic.op === "div" ? formatDivision(Math.floor(a / b) + k, a % b) : String(Number(answer) + k * 11));
  return {
    grade: topic.grade,
    text: `What is ${a.toLocaleString("en-US")} ${SYMBOL[topic.op]} ${b.toLocaleString("en-US")}?`,
    std: topic.std,
    answer,
    choices: helpers(r).shuffle([...set]),
    method,
  };
}
