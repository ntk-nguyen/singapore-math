/**
 * The shared template engine. A template is one problem pattern (a story structure or
 * a kind of sum) that fills in random numbers, names and contexts, so one template
 * gives thousands of different questions. Each template says which wrong answers come
 * from which real mistakes, and every question it makes can be checked by `checkQuestion`.
 *
 * Difficulty knobs: a template is drawn at a tier (0 easy, 1 medium, 2 hard). `c.n` and
 * `c.by` pick number sizes or settings for the tier, and `c.addPair`/`c.subPair` choose
 * numbers with or without regrouping.
 */
import type { Figure } from "./figures";
import type { BarModelSpec } from "./models";
import type { Format, Grade, Question } from "./questions";
import { gcd, helpers, type Rng } from "./rng";

export type Tier = 0 | 1 | 2;

/** A tier moved `by` steps easier (negative) or harder (positive), kept within easy to hard. */
export const shiftTier = (t: Tier, by = 0): Tier => Math.max(0, Math.min(2, t + by)) as Tier;

/* ---------------- contexts ---------------- */

export const NAMES = [
  "Mei", "Arjun", "Sofia", "Wei Ling", "Diego", "Aisha", "Ben", "Priya", "Kenji", "Zara", "Omar", "Lucy",
  "Noah", "Hana", "Mateo", "Amara", "Ravi", "Chloe", "Jamal", "Yuki", "Leila", "Tomás", "Ivy", "Kofi",
];

/** A countable thing: "1 apple", "3 apples". */
export interface Thing {
  one: string;
  many: string;
}
const t = (one: string, many = one + "s"): Thing => ({ one, many });

export const THINGS = {
  collect: [t("sticker"), t("marble"), t("card"), t("bead"), t("stamp"), t("shell"), t("badge"), t("coin")],
  food: [t("apple"), t("cupcake"), t("cookie"), t("muffin"), t("orange"), t("strawberry", "strawberries"), t("dumpling"), t("pear")],
  school: [t("pencil"), t("book"), t("eraser"), t("crayon"), t("notebook"), t("ruler")],
  nature: [t("bird"), t("fish", "fish"), t("flower"), t("leaf", "leaves"), t("butterfly", "butterflies"), t("ladybug")],
  toys: [t("toy car"), t("block"), t("balloon"), t("kite"), t("puzzle"), t("yo-yo")],
};
export type ThingKind = keyof typeof THINGS;
const ALL_THINGS = Object.values(THINGS).flat();

export const CONTAINERS = [t("box", "boxes"), t("bag"), t("jar"), t("pack"), t("basket"), t("tray")];
export const PLACES = ["bakery", "bookshop", "toy shop", "school fair", "fruit stall", "library", "farm market"];

export interface Ctx extends ReturnType<typeof helpers> {
  tier: Tier;
  /** The value for this tier: `by([easy, medium, hard])`. */
  by: <T>(opts: readonly [T, T, T]) => T;
  /** A whole number in the tier's range: `n([[2, 9], [10, 99], [100, 999]])`. */
  n: (ranges: readonly [readonly [number, number], readonly [number, number], readonly [number, number]]) => number;
  /** A name not used yet in this question. */
  name: () => string;
  /** A thing not used yet in this question. */
  thing: (kind?: ThingKind) => Thing;
  container: () => Thing;
  place: () => string;
  /** "1 apple" or "3 apples". */
  count: (n: number, thing: Thing) => string;
  /** Two numbers with `digits` digits whose sum needs regrouping, or does not. */
  addPair: (digits: number, regroup: boolean) => [number, number];
  /** a > b, both with `digits` digits; a − b needs renaming, or does not. */
  subPair: (digits: number, regroup: boolean) => [number, number];
}

const digitsOf = (n: number) => String(n).split("").reverse().map(Number);

export function context(r: Rng, tier: Tier): Ctx {
  const h = helpers(r);
  const used = new Set<string>();
  const fresh = <T,>(list: readonly T[], key: (x: T) => string): T => {
    let x = h.pick(list);
    for (let i = 0; i < 30 && used.has(key(x)); i++) x = h.pick(list);
    used.add(key(x));
    return x;
  };
  const span = (d: number) => [10 ** (d - 1), 10 ** d - 1] as const;
  return {
    ...h,
    tier,
    by: (opts) => opts[tier],
    n: (ranges) => h.ri(ranges[tier][0], ranges[tier][1]),
    name: () => fresh(NAMES, (x) => x),
    thing: (kind) => fresh(kind ? THINGS[kind] : ALL_THINGS, (x) => x.one),
    container: () => h.pick(CONTAINERS),
    place: () => h.pick(PLACES),
    count: (n, th) => `${n} ${n === 1 ? th.one : th.many}`,
    addPair: (d, regroup) => {
      for (let i = 0; ; i++) {
        const a = h.ri(...span(d)), b = h.ri(...span(d));
        const A = digitsOf(a), B = digitsOf(b);
        const carries = A.some((x, k) => x + (B[k] ?? 0) >= 10);
        if (carries === regroup || i > 200) return [a, b];
      }
    },
    subPair: (d, regroup) => {
      for (let i = 0; ; i++) {
        let a = h.ri(...span(d)), b = h.ri(...span(d));
        if (a === b) continue;
        if (a < b) [a, b] = [b, a];
        const A = digitsOf(a), B = digitsOf(b);
        const borrows = A.some((x, k) => x < (B[k] ?? 0));
        if (borrows === regroup || i > 200) return [a, b];
      }
    },
  };
}

/* ---------------- templates ---------------- */

/** A wrong answer and the mistake that gives it. */
export interface Mistake {
  value: number | string;
  why: string;
}

/** One question a template made, before the choices are built. */
export interface Draft {
  text: string;
  answer: number | string;
  /** How a number answer is written: a whole number (default), dollars ("$12", "$4.50"), dollars and cents ("$12.00"), or a decimal. */
  form?: "int" | "money" | "cents" | "dec";
  /** Wrong answers from real mistakes. At least two must survive (be distinct and sensible). */
  mistakes: Mistake[];
  steps?: string[];
  model?: BarModelSpec;
  figure?: Figure;
  /** Negative numbers are expected here (integers, slope, equations). */
  negatives?: boolean;
  /** When one template asks about more than one standard. */
  std?: string;
  /** A fixed format (odd one out, put in order, number line...). Omitted means multiple choice, which `vary` may ask other ways. */
  format?: Format;
  /** For "order": the items, in the right order. `answer` is them joined by ", ". */
  items?: string[];
  /** A second line under the question. */
  ask?: string;
}

export interface Template {
  id: string;
  grade: Grade;
  /** Common Core State Standard code. */
  std: string;
  /** The tier the template is drawn at unless asked otherwise. */
  tier: Tier;
  make: (c: Ctx) => Draft;
}

/** Each column added with no carrying: 47 + 38 → 75. */
export const noCarry = (a: number, b: number) => {
  const A = String(a).split("").reverse(), B = String(b).split("").reverse();
  return Number(Array.from({ length: Math.max(A.length, B.length) }, (_, i) => (Number(A[i] ?? 0) + Number(B[i] ?? 0)) % 10).reverse().join(""));
};
/** Each column subtracted smaller from larger: 52 − 38 → 26. */
export const smallFromLarge = (a: number, b: number) => {
  const A = String(a).split("").reverse(), B = String(b).split("").reverse();
  return Number(A.map((x, i) => Math.abs(Number(x) - Number(B[i] ?? 0))).reverse().join(""));
};
export function usd(v: number): string {
  return "$" + (Number.isInteger(v) ? String(v) : v.toFixed(2));
}

/** n/d in simplest form; improper fractions as mixed numbers ("2 3/4") when `mixed`. */
export function frac(n: number, d: number, mixed = false): string {
  const g = gcd(n, d) || 1;
  const [a, b] = [n / g, d / g];
  if (b === 1) return String(a);
  if (mixed && a > b) return `${Math.floor(a / b)} ${a % b}/${b}`;
  return `${a}/${b}`;
}

function write(v: number | string, form: Draft["form"]): string {
  if (typeof v === "string") return v;
  if (form === "money") return usd(v);
  if (form === "cents") return "$" + v.toFixed(2);
  if (form === "dec") return String(+v.toFixed(2));
  return String(v);
}

/** The value of an answer like "12", "-3", "$4.50", "0.25", "3/4", "2 1/2" or "40%", else NaN. */
export function valueOf(s: string): number {
  const pct = s.endsWith("%");
  const t = s.replace(/^\$/, "").replace(/,/g, "").replace(/%$/, "").replace("−", "-");
  const m = t.match(/^(-)?(?:(\d+) )?(\d+)\/(\d+)$/);
  const v = m ? (m[1] ? -1 : 1) * (Number(m[2] ?? 0) + Number(m[3]) / Number(m[4])) : /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
  return pct ? v / 100 : v;
}

/** A nearby answer written the same way as `s` (fraction, mixed number, percent or decimal), or "". */
function nudge(s: string, k: number): string {
  if (s.endsWith("%")) {
    const v = Number(s.slice(0, -1)) + 5 * k;
    return v > 0 ? `${v}%` : "";
  }
  const f = s.match(/^(?:(\d+) )?(\d+)\/(\d+)$/);
  if (f) {
    const d = Number(f[3]), n = Number(f[1] ?? 0) * d + Number(f[2]) + k;
    return n > 0 ? frac(n, d, !!f[1]) : "";
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return "";
  const places = s.split(".")[1]?.length ?? 0;
  return (Number(s) + k * 10 ** -places).toFixed(places);
}

/** Write 1x as x, the way people do: "5x + 3 = 1x + 7" → "5x + 3 = x + 7". */
export const tidy = (s: string) => s.replace(/(^|[^\d.,])1x\b/g, "$1x");

export interface Rendered {
  question: Question;
  /** How many wrong choices came from the template's real mistakes (the rest are nearby numbers). */
  real: number;
  negatives: boolean;
}

/** Make one question from a template: fill it in, then build four choices from its mistakes. */
export function render(tpl: Template, r: Rng, tier: Tier = tpl.tier): Rendered {
  const c = context(r, tier);
  const d = tpl.make(c);
  const form = d.form ?? "int";
  const answer = write(d.answer, form);
  const base = { grade: tpl.grade, text: tidy(d.text), std: d.std ?? tpl.std, answer, model: d.model, steps: d.steps?.map(tidy), figure: d.figure, format: d.format, ask: d.ask };
  if (d.format === "order") {
    return { real: 0, negatives: !!d.negatives, question: { ...base, items: c.shuffle([...d.items!]), choices: [] } };
  }
  // In "odd one out" the other choices are meant to be equal in value.
  const byValue = d.format !== "oddone";
  const sensible = (v: number | string) => {
    if (typeof v === "string") return v.length > 0 && !/\/0$/.test(v) && !(valueOf(v) < 0 && !d.negatives);
    if (!Number.isFinite(v) || (v < 0 && !d.negatives)) return false;
    return form === "int" ? Number.isInteger(v) : Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;
  };
  const choices = [answer];
  const values = new Set([valueOf(answer)]);
  const add = (v: number | string) => {
    const s = write(v, form), x = valueOf(s);
    if (choices.length >= 4 || !sensible(v) || choices.includes(s) || (byValue && !Number.isNaN(x) && values.has(x))) return false;
    choices.push(s);
    values.add(x);
    return true;
  };
  for (const m of c.shuffle(d.mistakes)) add(m.value);
  const real = choices.length - 1;
  // Top up with nearby numbers in the same form.
  if (typeof d.answer === "string") {
    for (let k = 1; choices.length < 4 && k < 50; k++) {
      add(nudge(d.answer, k));
      add(nudge(d.answer, -k));
    }
  } else {
    const a = d.answer, step = Number.isInteger(a) ? 1 : 0.1;
    for (let k = 1; choices.length < 4 && k < 500; k++) {
      add(+(a + k * step).toFixed(2));
      add(+(a - k * step).toFixed(2));
    }
  }
  if (choices.length < 4) throw new Error(`${tpl.id}: not enough choices for "${d.text}"`);
  return { real, negatives: !!d.negatives, question: { ...base, choices: c.shuffle(choices), mistakes: d.format ? undefined : explained(d, answer, sensible) } };
}

/**
 * The template's mistakes as written answers, for "find the mistake". A mistake is left
 * out when its answer is not sensible, equals the right answer, or another mistake gives
 * the same answer (then either explanation would be right).
 */
function explained(d: Draft, answer: string, sensible: (v: number | string) => boolean): { answer: string; why: string }[] {
  const form = d.form ?? "int";
  const rows = d.mistakes.filter((m) => sensible(m.value)).map((m) => ({ answer: write(m.value, form), why: m.why }));
  const key = (s: string) => (Number.isNaN(valueOf(s)) ? s : valueOf(s).toFixed(6));
  const count = new Map<string, number>();
  for (const x of rows) count.set(key(x.answer), (count.get(key(x.answer)) ?? 0) + 1);
  const whys = new Set<string>();
  return rows.filter((x) => {
    if (count.get(key(x.answer))! > 1 || key(x.answer) === key(answer) || whys.has(x.why)) return false;
    whys.add(x.why);
    return true;
  });
}

/* ---------------- validator ---------------- */

/**
 * Problems with a generated question, or an empty list. Multiple choice needs four
 * distinct choices with exactly one right answer (no other choice of the same value);
 * true/false needs True and False; "find the mistake" needs at least three explanations;
 * "put in order" needs distinct items whose order is the answer. Every format needs
 * sensible numbers (no NaN, no float noise, no negatives unless the topic uses them).
 */
export function checkQuestion(q: Question, opts: { negatives?: boolean } = {}): string[] {
  const out: string[] = [];
  const f = q.format ?? "choice";
  if (f === "order") {
    const items = q.items ?? [];
    if (items.length < 3) out.push("has fewer than three items to order");
    if (new Set(items).size !== items.length) out.push("repeats an item");
    if ([...items].sort().join() !== q.answer.split(", ").sort().join()) out.push("answer is not the items in order");
  } else if (f === "truefalse") {
    if (q.choices.join() !== "True,False" || !["True", "False"].includes(q.answer)) out.push("true/false is malformed");
  } else {
    const n = f === "mistake" ? 3 : 4;
    if (q.choices.length < n || q.choices.length > 4) out.push(`has ${q.choices.length} choices`);
    if (new Set(q.choices).size !== q.choices.length) out.push("repeats a choice");
    const hits = q.choices.filter((c) => c === q.answer).length;
    if (hits !== 1) out.push(`answer appears ${hits} times`);
    const vals = q.choices.map(valueOf).filter((v) => !Number.isNaN(v));
    if (f !== "oddone" && new Set(vals.map((v) => v.toFixed(6))).size !== vals.length) out.push("two choices have the same value");
  }
  const all = [q.text, q.ask ?? "", ...q.choices, ...(q.items ?? []), ...(q.steps ?? [])].join(" | ");
  if (/undefined|NaN|Infinity|\[object|\bnull\b/.test(all)) out.push("has a broken value");
  if (/\d\.\d{5,}/.test(all)) out.push("has float noise");
  if (!q.text.trim()) out.push("has no text");
  if (!opts.negatives) {
    if (/(^|[\s(:=$])[-−]\d/.test(q.text)) out.push("has a negative number in the text");
    if ([...q.choices, ...(q.items ?? [])].some((c) => valueOf(c) < 0)) out.push("has a negative choice");
  }
  const a = valueOf(q.answer);
  if (!Number.isNaN(a) && !Number.isFinite(a)) out.push("answer is not finite");
  return out;
}

/* ---------------- fresh draws ---------------- */

/**
 * What makes two questions the same: the text, and any figure the text is about. When
 * the choices or items are the question ("Which is greatest?", "Put these in order",
 * "Which is the odd one out?"), they count too.
 */
export function questionKey(q: Question): string {
  const key = q.figure ? `${q.text}|${JSON.stringify(q.figure)}` : q.text;
  if (q.items) return `${key}|${[...q.items].sort().join(",")}`;
  return /\d/.test(q.text) && q.format !== "oddone" ? key : `${key}|${[...q.choices].sort().join(",")}`;
}

/**
 * A question from `make` that is not in `seen`, which it is then added to. It retries up
 * to `tries` times, then accepts a repeat (a template with very few versions can run out).
 */
export function pickFresh(seen: Set<string>, make: () => Question, tries = 30): Question {
  let q = make();
  for (let i = 0; i < tries && seen.has(questionKey(q)); i++) q = make();
  seen.add(questionKey(q));
  return q;
}

/** Wrap a question maker so it never gives the same question twice. */
export function noRepeats(make: () => Question): () => Question {
  const seen = new Set<string>();
  return () => pickFresh(seen, make);
}

/** `n` questions with no repeats. */
export function drawFresh(make: () => Question, n: number): Question[] {
  return Array.from({ length: n }, noRepeats(make));
}
