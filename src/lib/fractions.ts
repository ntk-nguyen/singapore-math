/**
 * Fractions and decimals, Grades 3–6, taught with fraction bars: the same bar is cut
 * into equal parts, so equivalent fractions, common denominators and "how many
 * halves in 3?" can all be seen. Every topic makes a question with a worked solution
 * and wrong answers that come from real mistakes (adding denominators, forgetting to
 * flip, lining up digits instead of decimal points).
 */
import type { BarModelSpec } from "./models";
import { NAMES, type Grade, type Question } from "./questions";
import { gcd, helpers, type Rng } from "./rng";

type H = ReturnType<typeof helpers>;
/** A fraction as [numerator, denominator]. */
export type F = [number, number];

export const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

export function simplify([n, d]: F): F {
  const g = gcd(n, d) || 1;
  return [n / g, d / g];
}

/** Simplest form; improper fractions become mixed numbers ("2 3/4") unless `mixed` is false. */
export function fmt(f: F, mixed = true): string {
  const [n, d] = simplify(f);
  if (d === 1) return String(n);
  if (mixed && n > d) return `${Math.floor(n / d)} ${n % d}/${d}`;
  return `${n}/${d}`;
}

/** A decimal held as an integer count of 1/scale, printed without float noise. */
export function dec(count: number, scale: number): string {
  return String(+(count / scale).toFixed(Math.round(Math.log10(scale))));
}

/** The value of an answer string like "3", "0.25", "2 3/4", "5/8" or "40%". */
export function valueOf(s: string): number {
  const pct = s.endsWith("%");
  const t = pct ? s.slice(0, -1) : s;
  const m = t.match(/^(?:(\d+) )?(\d+)\/(\d+)$/);
  const v = m ? Number(m[1] ?? 0) + Number(m[2]) / Number(m[3]) : Number(t);
  return pct ? v / 100 : v;
}

interface Made {
  text: string;
  answer: string;
  /** Wrong answers from real mistakes. Duplicates and accidental right answers are dropped. */
  wrong: string[];
  steps: string[];
  model?: BarModelSpec;
  /**
   * For "which is greatest?" questions the choices are the options themselves.
   * Otherwise wrong answers are checked by value, so 2/4 is never offered against 1/2.
   */
  choices?: string[];
}

export type Strand = "fractions" | "decimals";

export interface FracTopic {
  id: string;
  grade: Grade;
  strand: Strand;
  std: string;
  title: string;
  blurb: string;
  make: (h: H) => Made;
}

const ORD: Record<number, string> = { 2: "half", 3: "third", 4: "fourth", 5: "fifth", 6: "sixth", 8: "eighth", 9: "ninth", 10: "tenth", 12: "twelfth", 20: "twentieth", 24: "twenty-fourth" };
/** The name of one part: 4 → "fourth". */
const part = (d: number) => ORD[d] ?? `${d}th`;
/** The name of several parts: 2 → "halves", 8 → "eighths". */
const parts = (d: number) => (d === 2 ? "halves" : `${part(d)}s`);
/** 37 → 73: the tenths and hundredths digits swapped. */
const swap = (n: number) => (n % 10) * 10 + Math.floor(n / 10);
const bar = (n: number, d: number, label?: string) => ({ n, d, label });
const sumF = ([a, b]: F, [c, d]: F): F => [a * d + c * b, b * d];
const subF = ([a, b]: F, [c, d]: F): F => [a * d - c * b, b * d];

/** Proper fraction n/d in lowest terms with d from `dens`. */
function proper(h: H, dens: number[]): F {
  const d = h.pick(dens);
  let n = h.ri(1, d - 1);
  while (gcd(n, d) !== 1) n = h.ri(1, d - 1);
  return [n, d];
}

/** Four distinct values (in 1/scale) to compare, with a "greatest or least?" twist. */
function pickFour(make: () => number): number[] {
  const out = new Set<number>();
  for (let g = 0; out.size < 4 && g < 200; g++) out.add(make());
  return [...out];
}

export const FRACTION_TOPICS: FracTopic[] = [
  /* ---------------- Grade 3 ---------------- */
  {
    id: "g3-frac-name", grade: 3, strand: "fractions", std: "3.NF.A.1",
    title: "Fractions of a whole", blurb: "Cut a bar into equal parts. 3 of 4 equal parts is 3/4.",
    make: ({ ri, pick }) => {
      const d = pick([2, 3, 4, 5, 6, 8]), n = ri(1, d - 1);
      return {
        text: `A bar is cut into ${d} equal parts and ${n} ${n === 1 ? "part is" : "parts are"} shaded. What fraction of the bar is shaded?`,
        answer: `${n}/${d}`,
        // Not simplified: here the answer names the parts, so 2/4 is right and 1/2 is not offered.
        choices: [`${n}/${d}`, `${d}/${n}`, `${n}/${d - n}`, `${d - n}/${d}`, `${n}/${d + 1}`, `${n + 1}/${d}`],
        wrong: [],
        model: { t: "fbars", bars: [bar(n, d, `${n}/${d}`)] },
        steps: [`The bar has ${d} equal parts, so each part is 1/${d} of the bar.`, `${n} ${n === 1 ? "part is" : "parts are"} shaded: that is ${n}/${d}.`],
      };
    },
  },
  {
    id: "g3-frac-equiv", grade: 3, strand: "fractions", std: "3.NF.A.3b",
    title: "Equivalent fractions", blurb: "1/2 = 2/4 = 4/8: cut every part again and the shaded amount stays the same.",
    make: (h) => {
      const [n, d] = proper(h, [2, 3, 4, 6]), m = h.pick([2, 3, 4].filter((x) => d * x <= 12));
      return {
        text: `Fill in the missing number: ${n}/${d} = ?/${d * m}`,
        answer: String(n * m),
        wrong: [String(n + m), String(n * m + 1), String(n * m - 1), String(d * m - n * m), String(n + d * m - d)],
        model: { t: "fbars", bars: [bar(n, d, `${n}/${d}`), bar(n * m, d * m, `?/${d * m}`)], note: `Cut each of the ${d} parts into ${m}. The shaded amount does not change.` },
        steps: [`${d} parts became ${d * m} parts, so every part was cut into ${d * m} ÷ ${d} = ${m}.`, `Each shaded part becomes ${m} parts too: ${n} × ${m} = ${n * m}.`, `So ${n}/${d} = ${n * m}/${d * m}.`],
      };
    },
  },
  {
    id: "g3-frac-compare", grade: 3, strand: "fractions", std: "3.NF.A.3d",
    title: "Compare fractions", blurb: "Same bottom number: more parts is more. Same top number: smaller parts are less.",
    make: ({ ri, pick, shuffle }) => {
      const most = ri(0, 1) === 1;
      const sameDen = ri(0, 1) === 1;
      let fr: F[];
      if (sameDen) {
        const d = pick([6, 8, 10, 12]);
        fr = shuffle(Array.from({ length: d - 1 }, (_, i) => i + 1)).slice(0, 4).map((n) => [n, d] as F);
      } else {
        const n = pick([1, 2, 3]);
        fr = shuffle(Array.from({ length: 12 - n }, (_, i) => i + n + 1)).slice(0, 4).map((d) => [n, d] as F);
      }
      const val = (f: F) => f[0] / f[1];
      const target = fr.reduce((best, f) => ((most ? val(f) > val(best) : val(f) < val(best)) ? f : best));
      const s = (f: F) => `${f[0]}/${f[1]}`;
      return {
        text: `Which fraction is the ${most ? "greatest" : "least"}?`,
        answer: s(target),
        choices: fr.map(s),
        wrong: [],
        model: { t: "fbars", bars: fr.map((f) => bar(f[0], f[1], s(f))) },
        steps: sameDen
          ? [`All the parts are the same size (${parts(fr[0][1])}), so compare the number of parts.`, `${most ? "Most" : "Fewest"} parts: ${s(target)}.`]
          : [`Every fraction has ${fr[0][0]} part${fr[0][0] > 1 ? "s" : ""}, so compare the size of the parts.`, `More equal parts means each part is smaller. The ${most ? "largest parts are in" : "smallest parts are in"} ${s(target)}.`],
      };
    },
  },

  /* ---------------- Grade 4 ---------------- */
  {
    id: "g4-frac-compare", grade: 4, strand: "fractions", std: "4.NF.A.2",
    title: "Compare unlike fractions", blurb: "Rename them with a common denominator, then compare the top numbers.",
    make: (h) => {
      const L = h.pick([12, 20, 24]);
      const dens = [2, 3, 4, 5, 6, 8, 10, 12].filter((d) => L % d === 0);
      const most = h.ri(0, 1) === 1;
      const vals = pickFour(() => {
        const [n, d] = proper(h, dens);
        return (n * L) / d;
      });
      const fr = vals.map((v) => simplify([v, L]));
      const s = (f: F) => `${f[0]}/${f[1]}`;
      const target = vals.indexOf(most ? Math.max(...vals) : Math.min(...vals));
      return {
        text: `Which fraction is the ${most ? "greatest" : "least"}?`,
        answer: s(fr[target]),
        choices: fr.map(s),
        wrong: [],
        model: { t: "fbars", bars: fr.map((f) => bar(f[0], f[1], s(f))) },
        steps: [`Rename each fraction in ${parts(L)}: ${fr.map((f, i) => `${s(f)} = ${vals[i]}/${L}`).join(", ")}.`, `Now the parts are the same size. The ${most ? "greatest" : "least"} is ${most ? Math.max(...vals) : Math.min(...vals)}/${L}${fr[target][1] !== L ? `, which is ${s(fr[target])}` : ""}.`],
      };
    },
  },
  {
    id: "g4-frac-add-like", grade: 4, strand: "fractions", std: "4.NF.B.3a",
    title: "Add and subtract like fractions", blurb: "3/8 + 4/8 = 7/8: add the parts, the size of the parts stays the same.",
    make: ({ ri, pick }) => {
      const d = pick([4, 5, 6, 8, 10, 12]), add = ri(0, 1) === 1;
      let a = ri(1, d - 1), b = ri(1, d - 1);
      if (!add && a === b) a = Math.min(d - 1, a + 1) === a ? a - 1 : a + 1;
      if (!add && a < b) [a, b] = [b, a];
      const res = add ? a + b : a - b;
      const op = add ? "+" : "−";
      return {
        text: `What is ${a}/${d} ${op} ${b}/${d}? Give your answer in simplest form.`,
        answer: fmt([res, d]),
        wrong: add
          ? [fmt([a + b, 2 * d]), fmt([res + 1, d]), fmt([res - 1, d]), fmt([a * b, d])]
          : [fmt([a + b, d]), fmt([res + 1, d]), fmt([Math.max(1, res - 1), d]), fmt([res, 2 * d])],
        model: { t: "fbars", bars: [bar(a, d, `${a}/${d}`), bar(b, d, `${b}/${d}`)] },
        steps: [
          `Both fractions are in ${parts(d)}, so the parts are the same size.`,
          `${add ? "Add" : "Subtract"} the parts: ${a} ${op} ${b} = ${res}. That is ${res}/${d}.`,
          ...(fmt([res, d]) !== `${res}/${d}` ? [`Simplify: ${res}/${d} = ${fmt([res, d])}.`] : []),
        ],
      };
    },
  },
  {
    id: "g4-mixed", grade: 4, strand: "fractions", std: "4.NF.B.3c",
    title: "Mixed numbers and improper fractions", blurb: "11/4 is 2 wholes and 3/4 more: 2 3/4.",
    make: (h) => {
      const [n, d] = proper(h, [2, 3, 4, 5, 6, 8]), w = h.ri(2, 5), top = w * d + n;
      const model: BarModelSpec = { t: "fbars", bars: [...Array.from({ length: w }, () => bar(d, d, "1")), bar(n, d, `${n}/${d}`)] };
      if (h.ri(0, 1)) {
        return {
          text: `Write ${top}/${d} as a mixed number.`,
          answer: `${w} ${n}/${d}`,
          wrong: [`${w + 1} ${n}/${d}`, `${w - 1} ${n}/${d}`, `${w} ${d - n}/${d}`, `${n} ${w}/${d}`, `${w} ${n}/${top}`],
          model,
          steps: [`${d} ${parts(d)} make 1 whole. How many wholes are in ${top}? ${top} ÷ ${d} = ${w} remainder ${n}.`, `So ${top}/${d} = ${w} wholes and ${n}/${d} more = ${w} ${n}/${d}.`],
        };
      }
      return {
        text: `Write ${w} ${n}/${d} as an improper fraction.`,
        answer: `${top}/${d}`,
        // Compared as written: 11/4 and 2 3/4 are equal, but only one is an improper fraction.
        choices: [`${top}/${d}`, `${w + n}/${d}`, `${w * n + d}/${d}`, `${w * d - n}/${d}`, `${top}/${w * d}`],
        wrong: [],
        model,
        steps: [`Each whole is ${d}/${d}, so ${w} wholes = ${w} × ${d} = ${w * d} ${parts(d)}.`, `Add the ${n} more: ${w * d} + ${n} = ${top}. So ${w} ${n}/${d} = ${top}/${d}.`],
      };
    },
  },
  {
    id: "g4-frac-times-whole", grade: 4, strand: "fractions", std: "4.NF.B.4b",
    title: "Multiply a fraction by a whole number", blurb: "5 × 2/3 is 5 groups of 2 thirds: 10/3 = 3 1/3.",
    make: (h) => {
      const [n, d] = proper(h, [3, 4, 5, 6, 8]), k = h.ri(2, 6), who = h.pick(NAMES);
      const word = h.ri(0, 1) === 1;
      return {
        text: word
          ? `${who} pours ${n}/${d} of a cup of juice into each of ${k} glasses. How many cups of juice is that altogether?`
          : `What is ${k} × ${n}/${d}?`,
        answer: fmt([k * n, d]),
        wrong: [fmt([n, d]), fmt([n, k * d]), fmt([k + n, d]), fmt([k * n + 1, d]), fmt([k * n, k + d])],
        model: { t: "fbars", bars: Array.from({ length: k }, () => bar(n, d, `${n}/${d}`)), note: `${k} groups of ${n}/${d}.` },
        steps: [`${k} × ${n}/${d} means ${k} groups of ${n} ${n === 1 ? part(d) : parts(d)}.`, `${k} × ${n} = ${k * n} ${parts(d)}, so the answer is ${k * n}/${d}.`, ...(fmt([k * n, d]) !== `${k * n}/${d}` ? [`${k * n}/${d} = ${fmt([k * n, d])}.`] : [])],
      };
    },
  },
  {
    id: "g4-dec-notation", grade: 4, strand: "decimals", std: "4.NF.C.6",
    title: "Tenths and hundredths as decimals", blurb: "37/100 is 3 tenths and 7 hundredths: 0.37.",
    make: ({ ri, pick }) => {
      const form = pick(["tenths", "hundredths", "mixed"] as const);
      let text: string, cents: number;
      if (form === "tenths") {
        const n = ri(1, 9);
        cents = n * 10;
        text = `Write ${n}/10 as a decimal.`;
      } else {
        let n = ri(11, 99);
        if (n % 10 === 0) n++;
        const w = form === "mixed" ? ri(1, 9) : 0;
        cents = w * 100 + n;
        text = `Write ${w ? `${w} ` : ""}${n}/100 as a decimal.`;
      }
      const tenthsOnly = form === "tenths";
      return {
        text,
        answer: dec(cents, 100),
        wrong: tenthsOnly
          ? [dec(cents, 1000), String(cents / 10), dec(cents, 10000)]
          : [dec(Math.floor(cents / 100) * 1000 + (cents % 100), 1000), dec(Math.floor(cents / 100) * 10 + (cents % 100), 10), dec(Math.floor(cents / 100) * 100 + swap(cents % 100), 100)],
        model: cents < 100 ? { t: "fbars", bars: [bar(Math.floor(cents / 10), 10, `${Math.floor(cents / 10)} tenths`)], note: tenthsOnly ? undefined : `Plus ${cents % 10} hundredth${cents % 10 === 1 ? "" : "s"}.` } : undefined,
        steps: tenthsOnly
          ? [`Tenths are the first place after the decimal point.`, `${cents / 10} tenths = ${dec(cents, 100)}.`]
          : [`${cents % 100} hundredths = ${Math.floor((cents % 100) / 10)} tenths and ${cents % 10} hundredths.`, `Tenths go in the first place after the point, hundredths in the second${cents >= 100 ? `, and the ${Math.floor(cents / 100)} whole${cents >= 200 ? "s go" : " goes"} before the point` : ""}: ${dec(cents, 100)}.`],
      };
    },
  },
  {
    id: "g4-dec-compare", grade: 4, strand: "decimals", std: "4.NF.C.7",
    title: "Compare decimals", blurb: "Is 0.5 or 0.45 more? Write 0.5 as 0.50, then compare.",
    make: (h) => {
      const most = h.ri(0, 1) === 1;
      // At least one tenths number, so the "longer is bigger" mistake gets caught.
      const first = h.ri(2, 8) * 10;
      const vals = [first, ...pickFour(() => h.ri(5, 95)).filter((v) => v !== first)].slice(0, 4);
      const target = most ? Math.max(...vals) : Math.min(...vals);
      return {
        text: `Which decimal is the ${most ? "greatest" : "least"}?`,
        answer: dec(target, 100),
        choices: vals.map((v) => dec(v, 100)),
        wrong: [],
        steps: [`Give every number two decimal places: ${vals.map((v) => (v / 100).toFixed(2)).join(", ")}.`, `Now compare them as hundredths. The ${most ? "greatest" : "least"} is ${dec(target, 100)}.`],
      };
    },
  },

  /* ---------------- Grade 5 ---------------- */
  {
    id: "g5-frac-add-unlike", grade: 5, strand: "fractions", std: "5.NF.A.1",
    title: "Add and subtract unlike fractions", blurb: "1/2 + 1/3: rename both as sixths, then add.",
    make: (h) => {
      let a: F, b: F;
      do {
        a = proper(h, [2, 3, 4, 5, 6, 8, 10, 12]);
        b = proper(h, [2, 3, 4, 5, 6, 8, 10, 12]);
      } while (a[1] === b[1] || lcm(a[1], b[1]) > 24 || a[0] / a[1] === b[0] / b[1]);
      const add = h.ri(0, 1) === 1;
      if (!add && a[0] / a[1] < b[0] / b[1]) [a, b] = [b, a];
      const L = lcm(a[1], b[1]), an = (a[0] * L) / a[1], bn = (b[0] * L) / b[1];
      const res: F = add ? sumF(a, b) : subF(a, b);
      const op = add ? "+" : "−";
      const across: F = add ? [a[0] + b[0], a[1] + b[1]] : [Math.abs(a[0] - b[0]) || 1, Math.abs(a[1] - b[1])];
      return {
        text: `What is ${a[0]}/${a[1]} ${op} ${b[0]}/${b[1]}? Give your answer in simplest form.`,
        answer: fmt(res),
        wrong: [fmt(across), fmt([(add ? an + bn : an - bn) + 1, L]), fmt([Math.max(1, (add ? an + bn : an - bn) - 1), L]), fmt([add ? a[0] + b[0] : Math.abs(a[0] - b[0]) || 1, L])],
        model: { t: "fbars", bars: [bar(a[0], a[1], `${a[0]}/${a[1]}`), bar(an, L, `${an}/${L}`), bar(b[0], b[1], `${b[0]}/${b[1]}`), bar(bn, L, `${bn}/${L}`)], note: `Cut both bars into ${L} equal parts so the parts match.` },
        steps: [
          `The parts are different sizes, so find a common denominator: ${L}.`,
          `${a[0]}/${a[1]} = ${an}/${L} and ${b[0]}/${b[1]} = ${bn}/${L}.`,
          `${an}/${L} ${op} ${bn}/${L} = ${add ? an + bn : an - bn}/${L}${fmt(res) !== `${add ? an + bn : an - bn}/${L}` ? ` = ${fmt(res)}` : ""}.`,
        ],
      };
    },
  },
  {
    id: "g5-frac-mult", grade: 5, strand: "fractions", std: "5.NF.B.4a",
    title: "Multiply fractions", blurb: "2/3 of 3/4: cut the 3/4 into thirds and take 2 of them.",
    make: (h) => {
      const a = proper(h, [2, 3, 4, 5, 6]), b = proper(h, [2, 3, 4, 5, 6, 8]);
      const of = h.ri(0, 1) === 1, who = h.pick(NAMES);
      return {
        text: of
          ? `${b[0]}/${b[1]} of a cake is left. ${who} eats ${a[0]}/${a[1]} of what is left. What fraction of the whole cake does ${who} eat?`
          : `What is ${a[0]}/${a[1]} × ${b[0]}/${b[1]}? Give your answer in simplest form.`,
        answer: fmt([a[0] * b[0], a[1] * b[1]]),
        wrong: [fmt([a[0] * b[1], a[1] * b[0]]), fmt([a[0] + b[0], a[1] + b[1]]), fmt([a[0] * b[0], a[1] + b[1]]), fmt([a[0] * b[0], Math.max(a[1], b[1])])],
        model: { t: "fbars", bars: [bar(b[0], b[1], `${b[0]}/${b[1]}`), bar(a[0] * b[0], a[1] * b[1], `${a[0]}/${a[1]} of it`)] },
        steps: [
          `"${a[0]}/${a[1]} of" means multiply: ${a[0]}/${a[1]} × ${b[0]}/${b[1]}.`,
          `Multiply the tops: ${a[0]} × ${b[0]} = ${a[0] * b[0]}. Multiply the bottoms: ${a[1]} × ${b[1]} = ${a[1] * b[1]}.`,
          `${a[0] * b[0]}/${a[1] * b[1]}${fmt([a[0] * b[0], a[1] * b[1]]) !== `${a[0] * b[0]}/${a[1] * b[1]}` ? ` = ${fmt([a[0] * b[0], a[1] * b[1]])}` : ""}.`,
        ],
      };
    },
  },
  {
    id: "g5-frac-div-unit", grade: 5, strand: "fractions", std: "5.NF.B.7",
    title: "Divide with unit fractions", blurb: "How many halves are in 3? Six. 1/3 shared by 2 is 1/6.",
    make: ({ ri, pick }) => {
      const b = pick([2, 3, 4, 5, 6, 8]), k = ri(2, 6);
      if (ri(0, 1)) {
        return {
          text: pick([`What is ${k} ÷ 1/${b}?`, `${k} pizzas are each cut into ${b} equal slices. Each slice is 1/${b} of a pizza. How many slices are there?`]),
          answer: String(k * b),
          wrong: [fmt([k, b]), String(k + b), String(k * b + b), String(k * b - k), fmt([b, k])],
          model: { t: "fbars", bars: Array.from({ length: k }, () => bar(b, b, "1")), note: `Each whole has ${b} pieces of 1/${b}.` },
          steps: [`Count how many 1/${b}s fit in ${k}. Each whole has ${b} of them.`, `${k} wholes × ${b} = ${k * b}. So ${k} ÷ 1/${b} = ${k * b}.`],
        };
      }
      return {
        text: pick([`What is 1/${b} ÷ ${k}?`, `${k} friends share 1/${b} of a pie equally. What fraction of the whole pie does each friend get?`]),
        answer: `1/${b * k}`,
        wrong: [fmt([k, b]), fmt([b, k]), `1/${b + k}`, String(b * k), `${k}/${b * k + 1}`],
        model: { t: "fbars", bars: [bar(1, b, `1/${b}`), bar(1, b * k, `1/${b * k}`)], note: `Cut the 1/${b} into ${k} equal pieces. The whole now has ${b * k} pieces.` },
        steps: [`Cut the 1/${b} into ${k} equal pieces.`, `If every 1/${b} were cut like this, the whole would have ${b} × ${k} = ${b * k} pieces.`, `Each friend gets 1/${b * k}.`],
      };
    },
  },
  {
    id: "g5-dec-compare", grade: 5, strand: "decimals", std: "5.NBT.A.3b",
    title: "Compare decimals to thousandths", blurb: "0.6, 0.58 or 0.605? Fill with zeros so every number has three places.",
    make: (h) => {
      const most = h.ri(0, 1) === 1;
      const lead = h.ri(2, 8);
      // Same tenths digit for two of them, and a mix of 1, 2 and 3 decimal places.
      const vals = pickFour(() => h.pick([lead * 100, (lead - 1) * 100 + h.ri(5, 9) * 10 + h.ri(0, 9), lead * 100 + h.ri(1, 9), (lead - 1) * 100 + h.ri(1, 9) * 10, lead * 10 + h.ri(0, 9)]));
      const target = most ? Math.max(...vals) : Math.min(...vals);
      return {
        text: `Which decimal is the ${most ? "greatest" : "least"}?`,
        answer: dec(target, 1000),
        choices: vals.map((v) => dec(v, 1000)),
        wrong: [],
        steps: [`Write every number with three decimal places: ${vals.map((v) => (v / 1000).toFixed(3)).join(", ")}.`, `Compare tenths first, then hundredths, then thousandths. The ${most ? "greatest" : "least"} is ${dec(target, 1000)}.`],
      };
    },
  },
  {
    id: "g5-dec-round", grade: 5, strand: "decimals", std: "5.NBT.A.4",
    title: "Round decimals", blurb: "Round 3.468 to the nearest tenth: look at the hundredths digit. 3.5.",
    make: ({ ri, pick }) => {
      let v = ri(1001, 9999);
      if (v % 10 === 0) v++;
      const places = pick([0, 1, 2]);
      const unit = 10 ** (3 - places);
      const name = ["whole number", "tenth", "hundredth"][places];
      const show = (count: number, p: number) => (count / 1000).toFixed(p);
      const right = Math.round(v / unit) * unit;
      const down = Math.floor(v / unit) * unit, up = Math.ceil(v / unit) * unit;
      const others = [0, 1, 2].filter((p) => p !== places).map((p) => show(Math.round(v / 10 ** (3 - p)) * 10 ** (3 - p), p));
      const look = ["tenths", "hundredths", "thousandths"][places];
      const digit = Math.floor((v % unit) / (unit / 10));
      return {
        text: `Round ${show(v, 3)} to the nearest ${name}.`,
        answer: show(right, places),
        wrong: [show(right === down ? up : down, places), ...others, show(right + unit, places)],
        steps: [`To round to the nearest ${name}, look at the ${look} digit: it is ${digit}.`, `${digit >= 5 ? `${digit} is 5 or more, so round up` : `${digit} is less than 5, so round down`}: ${show(right, places)}.`],
      };
    },
  },
  {
    id: "g5-dec-add-sub", grade: 5, strand: "decimals", std: "5.NBT.B.7",
    title: "Add and subtract decimals", blurb: "3.4 + 1.25: line up the decimal points, not the last digits.",
    make: ({ ri }) => {
      const add = ri(0, 1) === 1;
      // Hundredths; `a` has one decimal place so the points have to be lined up.
      let a = ri(11, 99) * 10, b = ri(101, 999);
      if (b % 10 === 0) b++;
      if (!add && a <= b) a += Math.ceil((b - a + 10) / 100) * 100;
      const res = add ? a + b : a - b;
      // The mistake: lining up the last digits, so 3.4 is treated like 0.34.
      const slip = add ? a / 10 + b : Math.abs(a / 10 - b);
      const op = add ? "+" : "−";
      return {
        text: `What is ${dec(a, 100)} ${op} ${dec(b, 100)}?`,
        answer: dec(res, 100),
        wrong: [dec(slip, 100), dec(res + 10, 100), dec(Math.abs(res - 10), 100), dec(res + 100, 100), dec(Math.abs(res - 1), 100)],
        steps: [`Line up the decimal points. Write ${dec(a, 100)} as ${(a / 100).toFixed(2)} so both numbers have hundredths.`, `${(a / 100).toFixed(2)} ${op} ${(b / 100).toFixed(2)} = ${(res / 100).toFixed(2)}.`],
      };
    },
  },

  /* ---------------- Grade 6 ---------------- */
  {
    id: "g6-frac-div", grade: 6, strand: "fractions", std: "6.NS.A.1",
    title: "Divide fractions by fractions", blurb: "How many 1/4-cup scoops in 3/2 cups? Multiply by the flipped fraction.",
    make: (h) => {
      let a: F, b: F;
      do {
        a = proper(h, [2, 3, 4, 5, 6, 8]);
        b = proper(h, [2, 3, 4, 6, 8]);
        if (h.ri(0, 2) === 0) a = [a[0] + a[1] * h.ri(1, 2), a[1]];
      } while (a[0] * b[1] === a[1] * b[0]);
      const ans: F = [a[0] * b[1], a[1] * b[0]];
      const word = h.ri(0, 1) === 1 && ans[0] % ans[1] === 0;
      return {
        text: word
          ? `A scoop holds ${b[0]}/${b[1]} cup of flour. How many scoops are in ${fmt(a)} cups of flour?`
          : `What is ${a[0]}/${a[1]} ÷ ${b[0]}/${b[1]}? Give your answer in simplest form.`,
        answer: fmt(ans),
        wrong: [fmt([a[0] * b[0], a[1] * b[1]]), fmt([a[1] * b[0], a[0] * b[1]]), fmt([a[1] * b[1], a[0] * b[0]]), fmt([ans[0] + ans[1], ans[1]])],
        steps: [
          `Dividing by ${b[0]}/${b[1]} is the same as multiplying by its reciprocal, ${b[1]}/${b[0]}.`,
          `${a[0]}/${a[1]} × ${b[1]}/${b[0]} = ${ans[0]}/${ans[1]}${fmt(ans) !== `${ans[0]}/${ans[1]}` ? ` = ${fmt(ans)}` : ""}.`,
          `Check: ${fmt(ans)} × ${b[0]}/${b[1]} = ${fmt(a)}.`,
        ],
      };
    },
  },
  {
    id: "g6-dec-mul-div", grade: 6, strand: "decimals", std: "6.NS.B.3",
    title: "Multiply and divide decimals", blurb: "2.4 × 0.3 = 0.72; 7.2 ÷ 0.4 is the same as 72 ÷ 4.",
    make: ({ ri }) => {
      const B = ri(2, 9);
      if (ri(0, 1)) {
        let A = ri(11, 99);
        if (A % 10 === 0) A++;
        const p = A * B; // hundredths
        return {
          text: `What is ${dec(A, 10)} × ${dec(B, 10)}?`,
          answer: dec(p, 100),
          wrong: [dec(p, 10), dec(p, 1000), dec(p, 1), dec(p + 10, 100)],
          steps: [`Ignore the points first: ${A} × ${B} = ${p}.`, `There is 1 decimal place in each number, so 2 in the answer: ${dec(p, 100)}.`],
        };
      }
      const q = ri(3, 30), D = q * B; // dividend in tenths
      return {
        text: `What is ${dec(D, 10)} ÷ ${dec(B, 10)}?`,
        answer: String(q),
        wrong: [dec(q, 10), String(q * 10), dec(q, 100), String(q + 1)],
        steps: [`Multiply both numbers by 10 so you divide by a whole number: ${dec(D, 10)} ÷ ${dec(B, 10)} = ${D} ÷ ${B}.`, `${D} ÷ ${B} = ${q}.`],
      };
    },
  },
  {
    id: "g6-fdp", grade: 6, strand: "decimals", std: "6.RP.A.3c",
    title: "Fractions, decimals and percents", blurb: "3/4 = 0.75 = 75%: three names for the same amount.",
    make: ({ pick }) => {
      const [n, d] = pick<F>([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [3, 20], [7, 20], [1, 25], [3, 25], [1, 50]]);
      const p = (n * 100) / d;
      const form = pick(["f2p", "d2p", "p2f", "p2d"] as const);
      const steps = [`Percent means "out of 100". ${n}/${d} = ${p}/100 = ${dec(p, 100)} = ${p}%.`];
      switch (form) {
        case "f2p":
          return { text: `Write ${n}/${d} as a percent.`, answer: `${p}%`, wrong: [`${n}${d}%`, `${dec(p, 10)}%`, `${100 - p}%`, `${p * 10}%`, `${dec(p, 100)}%`], steps,
            model: d <= 10 ? { t: "fbars", bars: [bar(n, d, `${n}/${d}`)] } : undefined };
        case "d2p":
          return { text: `Write ${dec(p, 100)} as a percent.`, answer: `${p}%`, wrong: [`${dec(p, 100)}%`, `${dec(p, 10)}%`, `${p * 10}%`, `${100 - p}%`], steps };
        case "p2f":
          return { text: `Write ${p}% as a fraction in simplest form.`, answer: fmt([p, 100]), wrong: [fmt([p, 1000]), fmt([100 - p, 100]), fmt([p + 10, 100]), fmt([1, p])], steps };
        default:
          return { text: `Write ${p}% as a decimal.`, answer: dec(p, 100), wrong: [dec(p, 10), dec(p, 1000), String(p), dec(100 - p, 100)], steps };
      }
    },
  },
];

export function getFracTopic(id: string): FracTopic | undefined {
  return FRACTION_TOPICS.find((t) => t.id === id);
}

/** A nearby wrong answer in the same form as `s`, for topping up the choices. */
function nudge(s: string, k: number): string {
  if (s.endsWith("%")) return `${Number(s.slice(0, -1)) + k * 5}%`;
  const m = s.match(/^(?:(\d+) )?(\d+)\/(\d+)$/);
  if (m) {
    const d = Number(m[3]), n = Number(m[1] ?? 0) * d + Number(m[2]);
    return fmt([n + k, d], !!m[1] || n + k > d);
  }
  const places = s.split(".")[1]?.length ?? 0;
  return (Number(s) + k * 10 ** -Math.max(places, 0)).toFixed(places);
}

export function fractionQuestion(topic: FracTopic, r: Rng): Question {
  const h = helpers(r);
  const m = topic.make(h);
  let choices: string[];
  if (m.choices) {
    choices = [m.answer, ...m.choices.filter((c) => c !== m.answer)].filter((c, i, a) => a.indexOf(c) === i && !/\/0$/.test(c)).slice(0, 4);
  } else {
    const v = valueOf(m.answer);
    const seen = new Set([v]);
    choices = [m.answer];
    for (const w of m.wrong) {
      if (choices.length >= 4) break;
      const x = valueOf(w);
      if (!w || !Number.isFinite(x) || x < 0 || /\/0$/.test(w) || seen.has(x)) continue;
      seen.add(x);
      choices.push(w);
    }
  }
  for (let k = 1; choices.length < 4; k++) {
    for (const c of [nudge(m.answer, k), nudge(m.answer, -k)]) {
      const x = valueOf(c);
      if (choices.length < 4 && x >= 0 && !choices.some((y) => valueOf(y) === x)) choices.push(c);
    }
  }
  return {
    grade: topic.grade,
    text: m.text,
    std: topic.std,
    answer: m.answer,
    choices: h.shuffle(choices),
    model: m.model,
    steps: m.steps,
  };
}
