/**
 * Word problems (solved with bar models) and solve-for-x equations, in three levels.
 * Easy is free; intermediate and advanced need the Pro plan and are only served
 * by the API after a server-side plan check.
 */
import type { Grade, Question } from "./questions";
import { gcd, helpers, type Rng } from "./rng";
import { pickFresh, render, smallFromLarge, usd, type Ctx, type Draft, type Mistake, type Template, type Tier } from "./templates";

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


const TIER: Record<Level, Tier> = { easy: 0, intermediate: 1, advanced: 2 };
const W = (id: string, grade: Grade, std: string, level: Level, make: (c: Ctx) => Draft): Template => ({ id, grade, std, tier: TIER[level], make });
const m = (value: number | string, why: string): Mistake => ({ value, why });
const units = (n: number, small = false) => `${n} ${small ? "small " : ""}unit${n === 1 ? "" : "s"}`;
const sgn = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);
const signed = (n: number) => (n < 0 ? `−${-n}` : String(n));

/* ---------------- word problems ---------------- */

const WORD: Record<Level, Template[]> = {
  easy: [
    W("w-apples", 2, "2.OA.A.1", "easy", ({ ri }) => {
      const a = ri(20, 80), b = ri(10, 60);
      return { text: `A shop sold ${a} apples in the morning and ${b} apples in the afternoon. How many apples did it sell in all?`, answer: a + b,
        model: { t: "pw", parts: [a, b], labels: ["am", "pm"], unk: "whole" },
        steps: [`Draw one bar with two parts: ${a} and ${b}.`, `The whole bar is the total: ${a} + ${b} = ${a + b} apples.`],
        mistakes: [m(Math.abs(a - b), "subtracted"), m(a + b - 10, "lost the carried ten"), m(a, "gave the morning only")] };
    }),
    W("w-gave", 2, "2.OA.A.1", "easy", (c) => {
      const n = c.name(), item = c.thing("collect").many, a = c.ri(30, 95), b = c.ri(10, a - 10);
      return { text: `${n} had ${a} ${item}. ${n} gave away ${b} of them. How many ${item} are left?`, answer: a - b,
        model: { t: "pw", parts: [b, a - b], labels: ["gave", "left"], unk: 1, whole: a },
        steps: [`The whole bar is ${a}. One part is the ${b} given away.`, `The other part is what's left: ${a} − ${b} = ${a - b}.`],
        mistakes: [m(a + b, "added"), m(b, "gave the number given away"), m(smallFromLarge(a, b), "took the smaller digit from the larger")] };
    }),
    W("w-fewer", 2, "2.OA.A.1", "easy", (c) => {
      const [p, q] = [c.name(), c.name()], item = c.thing("collect").many, a = c.ri(30, 90), d = c.ri(5, a - 10);
      return { text: `${p} has ${a} ${item}. ${q} has ${d} fewer ${item} than ${p}. How many ${item} does ${q} have?`, answer: a - d,
        model: { t: "cmp", a: a - d, b: a, names: [q, p], unk: "small" },
        steps: [`${p}'s bar is longer by ${d}.`, `${q} = ${a} − ${d} = ${a - d}.`],
        mistakes: [m(a + d, "added"), m(d, "gave the difference"), m(a, `gave ${p}'s number`)] };
    }),
    W("w-packs", 3, "3.OA.A.3", "easy", (c) => {
      const e = c.ri(4, 9), g = c.ri(3, 9), item = c.thing("collect").many;
      return { text: `A pack has ${e} ${item}. How many ${item} are in ${g} packs?`, answer: e * g,
        model: { t: "units", n: g, shade: g, unit: e, total: null },
        steps: [`Draw ${g} equal units, one per pack, with ${e} in each.`, `${g} units = ${g} × ${e} = ${e * g}.`],
        mistakes: [m(e + g, "added"), m(e * g + e, "counted one pack twice"), m(e * (g - 1), "missed a pack")] };
    }),
    W("w-cupcakes", 3, "3.OA.A.3", "easy", ({ ri }) => {
      const g = ri(3, 8), e = ri(3, 9);
      return { text: `${g * e} cupcakes are packed equally into ${g} boxes. How many cupcakes are in each box?`, answer: e,
        model: { t: "units", n: g, shade: 1, unit: null, total: g * e },
        steps: [`Draw ${g} equal units that make ${g * e}.`, `1 unit = ${g * e} ÷ ${g} = ${e}.`],
        mistakes: [m(g * e - g, "subtracted"), m(g, "gave the number of boxes"), m(g * e + g, "added")] };
    }),
    W("w-join", 1, "1.OA.A.1", "easy", (c) => {
      const th = c.thing("nature"), a = c.ri(3, 12), b = c.ri(2, 8), where = c.pick(["in the park", "in the garden", "by the pond"]);
      return { text: `There were ${c.count(a, th)} ${where}. ${b} more came. How many ${th.many} are there now?`, answer: a + b,
        model: { t: "pw", parts: [a, b], labels: ["before", "came"], unk: "whole" },
        steps: [`Put the two parts together: ${a} and ${b}.`, `${a} + ${b} = ${a + b}.`],
        mistakes: [m(Math.abs(a - b), "subtracted"), m(a + b - 1, "missed one counting on"), m(b, "gave the ones that came")] };
    }),
    W("w-change", 1, "1.OA.A.1", "easy", (c) => {
      const [n, f] = [c.name(), c.name()], th = c.thing("collect"), a = c.ri(3, 10), w = c.ri(a + 2, 20);
      return { text: `${n} had ${c.count(a, th)}. ${f} gave ${n} some more. Now ${n} has ${w}. How many ${th.many} did ${f} give?`, answer: w - a,
        model: { t: "pw", parts: [a, w - a], labels: ["had", "got"], unk: 1, whole: w },
        steps: [`The whole is ${w}. One part is the ${a} ${n} had.`, `The missing part is ${w} − ${a} = ${w - a}.`],
        mistakes: [m(w + a, "added the numbers"), m(w, "gave the total"), m(a, "gave the start")] };
    }),
    W("w-start", 2, "2.OA.A.1", "easy", (c) => {
      const n = c.name(), item = c.thing("collect").many, b = c.n([[5, 20], [10, 40], [20, 60]]), left = c.n([[5, 30], [10, 50], [20, 80]]);
      return { text: `${n} gave away ${b} ${item} and has ${left} left. How many ${item} did ${n} have at first?`, answer: b + left,
        model: { t: "pw", parts: [b, left], labels: ["gave", "left"], unk: "whole" },
        steps: [`At first is the whole bar. It is made of the ${b} given away and the ${left} left.`, `${b} + ${left} = ${b + left}.`],
        mistakes: [m(Math.abs(left - b), "subtracted because of “gave away”"), m(left, "gave what is left"), m(b, "gave the number given away")] };
    }),
    W("w-more", 2, "2.OA.A.1", "easy", (c) => {
      const [q, p] = [c.name(), c.name()], th = c.thing(), a = c.ri(12, 60), d = c.ri(5, 30);
      return { text: `${q} has ${a} ${th.many}. ${p} has ${d} more ${th.many} than ${q}. How many ${th.many} does ${p} have?`, answer: a + d,
        model: { t: "cmp", a, b: a + d, names: [q, p] },
        steps: [`${p}'s bar is ${q}'s bar and ${d} more.`, `${p} = ${a} + ${d} = ${a + d}.`],
        mistakes: [m(Math.abs(a - d), "subtracted"), m(a, `gave ${q}'s number`), m(d, "gave the difference")] };
    }),
    W("w-points", 2, "2.OA.A.1", "easy", (c) => {
      const [p, q] = [c.name(), c.name()], game = c.pick(["a spelling game", "a video game", "a math quiz", "basketball"]), a = c.ri(30, 95), b = c.ri(10, a - 5);
      return { text: `In ${game}, ${p} scored ${a} points and ${q} scored ${b} points. How many more points did ${p} score than ${q}?`, answer: a - b,
        model: { t: "cmp", a: b, b: a, names: [q, p], unk: "diff" },
        steps: [`Draw ${p}'s bar longer than ${q}'s.`, `The difference is ${a} − ${b} = ${a - b}.`],
        mistakes: [m(a + b, "added"), m(smallFromLarge(a, b), "took the smaller digit from the larger"), m(a, `gave ${p}'s score`)] };
    }),
    W("w-times", 3, "3.OA.A.3", "easy", (c) => {
      const [q, p] = [c.name(), c.name()], th = c.thing(), e = c.ri(2, 10), k = c.ri(2, 5);
      return { text: `${q} has ${c.count(e, th)}. ${p} has ${k} times as many ${th.many} as ${q}. How many ${th.many} does ${p} have?`, answer: k * e,
        model: { t: "units", n: k, shade: k, unit: e, total: null, note: `${p} has ${k} units of ${e}.` },
        steps: [`${q} is 1 unit of ${e}. ${p} is ${k} units.`, `${k} × ${e} = ${k * e}.`],
        mistakes: [m(k + e, "added"), m(k * e + e, "found both together"), m(e, `gave ${q}'s number`)] };
    }),
    W("w-chairs", 3, "3.OA.A.3", "easy", (c) => {
      const r = c.n([[2, 5], [3, 9], [6, 12]]), k = c.n([[2, 5], [4, 9], [6, 12]]), where = c.pick(["the hall", "the classroom", "the garden"]);
      return { text: `Chairs in ${where} are set out in ${r} rows of ${k}. How many chairs are there?`, answer: r * k,
        model: { t: "units", n: r, shade: r, unit: k, total: null },
        steps: [`Each row is a unit of ${k} chairs.`, `${r} rows: ${r} × ${k} = ${r * k}.`],
        mistakes: [m(r + k, "added"), m(r * k - k, "missed a row"), m(r * k + r, "times-table slip")] };
    }),
    W("w-water", 3, "3.MD.A.2", "easy", (c) => {
      const n = c.name(), w = c.ri(12, 60), p = c.ri(3, w - 3), what = c.pick(["tank", "jug", "barrel", "bucket"]);
      return { text: `A ${what} holds ${w} liters of water. ${n} pours out ${p} liters. How many liters are left in the ${what}?`, answer: w - p,
        model: { t: "pw", parts: [p, w - p], labels: ["poured", "left"], unk: 1, whole: w },
        steps: [`The whole is ${w} liters. One part is the ${p} liters poured out.`, `${w} − ${p} = ${w - p} liters.`],
        mistakes: [m(w + p, "added"), m(p, "gave the amount poured"), m(smallFromLarge(w, p), "took the smaller digit from the larger")] };
    }),
  ],
  intermediate: [
    W("w-times-total", 4, "4.OA.A.2", "intermediate", (c) => {
      const [p, q] = [c.name(), c.name()], item = c.thing("collect").many, n = c.ri(2, 5), u = c.ri(4, 30), t = (n + 1) * u;
      return { text: `${p} has ${n} times as many ${item} as ${q}. Together they have ${t} ${item}. How many ${item} does ${p} have?`, answer: n * u,
        model: { t: "ratio", r: n, b: 1, total: t, names: [p, q], noun: item },
        steps: [`${q} is 1 unit and ${p} is ${n} units, so there are ${n + 1} units altogether.`, `${n + 1} units = ${t}, so 1 unit = ${t} ÷ ${n + 1} = ${u}.`, `${p} has ${n} units = ${n} × ${u} = ${n * u}.`],
        mistakes: [m(u, "found one unit only"), m(t / n, `divided by ${n}, not ${n + 1}`), m((n - 1) * u, "miscounted the units"), m(t, "gave the total")] };
    }),
    W("w-sum-diff", 4, "4.OA.A.3", "intermediate", (c) => {
      const [p, q] = [c.name(), c.name()], item = c.thing("collect").many, small = c.ri(10, 60), d = c.ri(4, 30), t = 2 * small + d;
      return { text: `${p} and ${q} have ${t} ${item} altogether. ${p} has ${d} more than ${q}. How many ${item} does ${q} have?`, answer: small,
        model: { t: "cmp", a: small, b: small + d, names: [q, p], unk: "small", total: t },
        steps: [`Take away the extra ${d} from the total: ${t} − ${d} = ${t - d}.`, `Now both bars are equal: 2 units = ${t - d}.`, `${q} = ${t - d} ÷ 2 = ${small}.`],
        mistakes: [m(small + d, `found ${p}`), m(t - d, "forgot to halve"), m(Math.floor(t / 2), "halved without taking the extra away")] };
    }),
    W("w-shopping", 4, "4.OA.A.3", "intermediate", (c) => {
      const n = c.name(), p = c.ri(2, 6), q = c.ri(3, 9), k = c.ri(2, 5), j = c.ri(2, 4);
      const cost = p * k + q * j, bill = cost < 50 ? 50 : 100;
      return { text: `Pens cost $${p} each and notebooks cost $${q} each. ${n} buys ${k} pens and ${j} notebooks and pays with a $${bill} bill. How much change does ${n} get?`, answer: bill - cost, form: "money",
        steps: [`Pens: ${k} × $${p} = $${p * k}. Notebooks: ${j} × $${q} = $${q * j}.`, `Total cost: $${p * k} + $${q * j} = $${cost}.`, `Change: $${bill} − $${cost} = $${bill - cost}.`],
        mistakes: [m(cost, "gave the cost"), m(bill - p - q, "paid for one of each"), m(bill - p * k, "forgot the notebooks")] };
    }),
    W("w-girls", 5, "5.NF.B.6", "intermediate", ({ ri, pick }) => {
      const d = pick([4, 5, 6, 8]), n = ri(1, d - 1), u = ri(3, 12), tot = d * u;
      return { text: `${n}/${d} of the ${tot} children at a party are boys. How many girls are there?`, answer: (d - n) * u,
        model: { t: "units", n: d, shade: d - n, unit: null, total: tot, note: `Shaded units are girls: ${d - n} of ${d}.` },
        steps: [`Cut the bar for ${tot} children into ${d} units: 1 unit = ${tot} ÷ ${d} = ${u}.`, `Boys are ${n} units, so girls are ${d - n} units.`, `Girls = ${d - n} × ${u} = ${(d - n) * u}.`],
        mistakes: [m(n * u, "found the boys"), m(u, "found one unit only"), m(tot - n, "took the numerator away")] };
    }),
    W("w-trays", 4, "4.OA.A.3", "intermediate", (c) => {
      const food = c.thing("food").many, t = c.ri(3, 9), k = c.ri(6, 12), s = c.ri(5, t * k - 5);
      return { text: `A baker bakes ${t} trays of ${k} ${food} and sells ${s} of them. How many ${food} are left?`, answer: t * k - s,
        model: { t: "pw", parts: [s, t * k - s], labels: ["sold", "left"], unk: 1, whole: t * k },
        steps: [`First find how many were baked: ${t} × ${k} = ${t * k}.`, `Then take away the ${s} sold: ${t * k} − ${s} = ${t * k - s}.`],
        mistakes: [m(t * k + s, "added the ones sold"), m(t * k, "forgot to take away"), m(t + k - s, "added the trays instead of multiplying")] };
    }),
    W("w-give-compare", 4, "4.OA.A.3", "intermediate", (c) => {
      const [p, q] = [c.name(), c.name()], item = c.thing("collect").many, b = c.ri(10, 50), g = c.ri(3, 15), a = b + 2 * g + c.ri(2, 30);
      return { text: `${p} has ${a} ${item} and ${q} has ${b}. ${p} gives ${g} ${item} to ${q}. How many more ${item} does ${p} have than ${q} now?`, answer: a - b - 2 * g,
        steps: [`After giving, ${p} has ${a} − ${g} = ${a - g} and ${q} has ${b} + ${g} = ${b + g}.`, `Difference: ${a - g} − ${b + g} = ${a - b - 2 * g}.`, `Giving ${g} closes the gap by 2 × ${g}, not ${g}.`],
        mistakes: [m(a - b - g, "closed the gap by the gift only once"), m(a - b, "used the numbers before the gift"), m(a - g, `gave ${p}'s new number`)] };
    }),
    W("w-save", 4, "4.OA.A.3", "intermediate", (c) => {
      const n = c.name(), toy = c.thing("toys").one, s = c.ri(3, 15), w = c.ri(3, 12), cost = s * w;
      return { text: `${n} saves $${s} each week to buy a ${toy} that costs $${cost}. How many weeks will it take?`, answer: w,
        steps: [`Each week adds $${s}. Count how many $${s} make $${cost}.`, `$${cost} ÷ $${s} = ${w} weeks.`],
        mistakes: [m(cost - s, "subtracted"), m(w + 1, "counted one week too many"), m(s, "gave the weekly saving")] };
    }),
    W("w-sum-diff-big", 4, "4.OA.A.3", "intermediate", (c) => {
      const [p, q] = [c.name(), c.name()], what = c.pick(["pages", "points", "laps", "minutes of reading"]), small = c.ri(12, 80), d = c.ri(4, 40), t = 2 * small + d;
      return { text: `${p} and ${q} did ${t} ${what} in all. ${p} did ${d} more than ${q}. How many ${what} did ${p} do?`, answer: small + d,
        model: { t: "cmp", a: small, b: small + d, names: [q, p], unk: "big", total: t },
        steps: [`Take away the extra ${d}: ${t} − ${d} = ${t - d}, which is 2 equal units.`, `1 unit = ${(t - d) / 2}, which is ${q}.`, `${p} = ${small} + ${d} = ${small + d}.`],
        mistakes: [m(small, `found ${q}`), m(t - d, "forgot to halve"), m(Math.floor(t / 2), "halved without taking the extra away")] };
    }),
    W("w-spend", 5, "5.NF.B.6", "intermediate", (c) => {
      const n = c.name(), th = c.thing("toys").one, d = c.pick([3, 4, 5, 8]), a = c.ri(1, d - 1), u = c.ri(4, 15), money = d * u, k = c.ri(1, (d - a) * u - 1);
      return { text: `${n} had $${money}. ${n} spent ${a}/${d} of it on a ${th} and $${k} on lunch. How much money does ${n} have left?`, answer: money - a * u - k, form: "money",
        model: { t: "units", n: d, shade: a, unit: u, total: money, note: `Shaded: the ${th}.` },
        steps: [`1/${d} of $${money} is $${u}, so the ${th} cost ${a} × $${u} = $${a * u}.`, `Left after the ${th}: $${money} − $${a * u} = $${money - a * u}.`, `Take away lunch: $${money - a * u} − $${k} = $${money - a * u - k}.`],
        mistakes: [m(money - a * u, "forgot lunch"), m(money - k, `forgot the ${th}`), m(money - a - k, "took away the numerator, not the fraction of the money")] };
    }),
    W("w-classes", 5, "5.NBT.B.6", "intermediate", (c) => {
      const k = c.ri(2, 8), j = c.ri(2, 6), b = k * j, p = c.pick([10, 12, 15, 20, 24, 25]), item = c.thing("school").many;
      return { text: `A school orders ${b} boxes of ${p} ${item} and shares them equally among ${k} classes. How many ${item} does each class get?`, answer: j * p,
        steps: [`Total: ${b} × ${p} = ${b * p} ${item}.`, `Each class: ${b * p} ÷ ${k} = ${j * p}.`],
        mistakes: [m(b * p, "forgot to share"), m(b * p - k, "subtracted the classes"), m(j, "gave boxes per class")] };
    }),
    W("w-fence", 4, "4.MD.A.3", "intermediate", (c) => {
      const l = c.ri(5, 20), w = c.ri(3, 12), k = c.ri(2, 9), what = c.pick(["garden", "playground", "dog run", "vegetable patch"]);
      return { text: `A rectangular ${what} is ${l} m long and ${w} m wide. Fencing costs $${k} a meter. How much does it cost to fence all the way around?`, answer: 2 * (l + w) * k, form: "money",
        steps: [`Perimeter: 2 × (${l} + ${w}) = ${2 * (l + w)} m.`, `Cost: ${2 * (l + w)} × $${k} = $${2 * (l + w) * k}.`],
        mistakes: [m(l * w * k, "used the area"), m((l + w) * k, "fenced only two sides"), m(2 * (l + w), "gave the perimeter, not the cost")] };
    }),
    W("w-decimal-change", 5, "5.NBT.B.7", "intermediate", (c) => {
      const n = c.name(), item = c.thing("school").many, k = c.ri(2, 4), cents = c.ri(105, 395), cost = k * cents, bill = cost < 1000 ? 10 : 20;
      return { text: `${n} buys ${k} ${item} at $${(cents / 100).toFixed(2)} each and pays with a $${bill} bill. How much change does ${n} get?`, answer: (bill * 100 - cost) / 100, form: "cents",
        steps: [`Cost: ${k} × $${(cents / 100).toFixed(2)} = $${(cost / 100).toFixed(2)}.`, `Change: $${bill}.00 − $${(cost / 100).toFixed(2)} = ${usd((bill * 100 - cost) / 100)}.`],
        mistakes: [m(cost / 100, "gave the cost"), m((bill * 100 - cents) / 100, "paid for one only"), m((bill * 100 - cost) / 100 + 1, "forgot to rename a dollar")] };
    }),
  ],
  advanced: [
    W("w-remainder", 5, "5.NF.B.6", "advanced", (c) => {
      const n = c.name(), a = c.ri(2, 5), b = c.ri(2, 5), k = c.ri(2, 12);
      const total = a * b * k, left = (a - 1) * (b - 1) * k;
      return { text: `${n} spent 1/${a} of ${n}'s money on a book and 1/${b} of the remainder on a pen. ${n} had $${left} left. How much money did ${n} have at first?`, answer: total, form: "money",
        model: { t: "units", n: a * b, shade: (a - 1) * (b - 1), unit: null, total: null, note: `Cut the money into ${units(a * b, true)}. ${units((a - 1) * (b - 1), true)} ${(a - 1) * (b - 1) === 1 ? "is" : "are"} left (shaded).` },
        steps: [
          `Draw the money as ${units(a)}. The book is 1 unit, leaving ${units(a - 1)}.`,
          `To take 1/${b} of the remainder, cut every unit into ${b}: now there are ${units(a * b, true)} and the remainder is ${units((a - 1) * b, true)}.`,
          `The pen is ${units(a - 1, true)}, so ${(a - 1) * b} − ${a - 1} = ${units((a - 1) * (b - 1), true)} ${(a - 1) * (b - 1) === 1 ? "is" : "are"} left.`,
          `${units((a - 1) * (b - 1), true)} = $${left}, so 1 small unit = $${k}. At first: ${a * b} × $${k} = $${total}.`,
        ],
        mistakes: [m((a - 1) * b * k, "gave the money after the book"), m(left * a, "undid only the first step"), m(total - left, "gave the money spent")] };
    }),
    W("w-same-after", 6, "6.EE.B.7", "advanced", (c) => {
      const [p, q] = [c.name(), c.name()], item = c.thing("collect").many, k = c.pick([2, 3]);
      let u = c.ri(4, 20);
      if (((k - 1) * u) % 2) u++;
      const g = ((k - 1) * u) / 2;
      return { text: `${p} has ${k} times as many ${item} as ${q}. After ${p} gives ${g} ${item} to ${q}, they have the same number. How many ${item} did ${p} have at first?`, answer: k * u,
        model: { t: "ratio", r: k, b: 1, total: (k + 1) * u, names: [p, q], noun: item },
        steps: [
          `Before: ${q} is 1 unit and ${p} is ${k} units. The difference is ${k - 1} unit${k > 2 ? "s" : ""}.`,
          `Giving ${g} closes the gap from both sides, so the difference is 2 × ${g} = ${2 * g}.`,
          `${k - 1} unit${k > 2 ? "s" : ""} = ${2 * g}, so 1 unit = ${u}. ${p} had ${k} × ${u} = ${k * u}.`,
        ],
        mistakes: [m(u, `found ${q}`), m(k * g, "multiplied the gift"), m((k + 1) * u, "found both together")] };
    }),
    W("w-ages", 6, "6.EE.B.7", "advanced", (c) => {
      const n = c.name(), a = c.ri(5, 12), y = c.ri(2, 15), f = 2 * a + y;
      return { text: `${n} is ${a} years old and ${n}'s father is ${f}. In how many years will the father be exactly twice as old as ${n}?`, answer: y,
        model: { t: "cmp", a: a + y, b: f + y, names: [n, "Father"], unk: "diff" },
        steps: [
          `The age gap never changes: ${f} − ${a} = ${f - a} years.`,
          `When the father is twice as old, the gap equals ${n}'s age, so ${n} will be ${f - a}.`,
          `That is ${f - a} − ${a} = ${y} years from now.`,
        ],
        mistakes: [m(f - a, "gave the age gap"), m(a, `gave ${n}'s age now`), m(2 * a, "doubled the age")] };
    }),
    W("w-club", 6, "6.RP.A.3", "advanced", ({ ri }) => {
      let r1 = ri(1, 4), r2 = ri(r1 + 1, 7);
      while (gcd(r1, r2) !== 1) { r1 = ri(1, 4); r2 = ri(r1 + 1, 7); }
      const u = ri(3, 12), k = (r2 - r1) * u;
      return { text: `The ratio of boys to girls in a club is ${r1} : ${r2}. After ${k} more boys join, there are as many boys as girls. How many girls are in the club?`, answer: r2 * u,
        model: { t: "ratio", r: r1, b: r2, total: (r1 + r2) * u, names: ["Boys", "Girls"], noun: "children" },
        steps: [
          `Boys are ${r1} units and girls are ${r2} units. The girls stay the same.`,
          `The ${k} new boys fill the gap of ${r2 - r1} unit${r2 - r1 > 1 ? "s" : ""}, so 1 unit = ${k} ÷ ${r2 - r1} = ${u}.`,
          `Girls = ${r2} × ${u} = ${r2 * u}.`,
        ],
        mistakes: [m(r1 * u, "found the boys"), m(k, "gave the boys who joined"), m((r1 + r2) * u, "found everyone")] };
    }),
    W("w-fraction-then-amount", 5, "5.NF.B.6", "advanced", (c) => {
      const n = c.name(), d = c.pick([3, 4, 5]), a = c.ri(1, d - 1), j = c.ri(1, 4), u = c.ri(j + 2, j + 12);
      const k = (d - a) * j, left = (d - a) * (u - j), what = c.pick(["shoes", "a jacket", "a bike helmet", "a board game"]);
      return { text: `${n} spent ${a}/${d} of ${n}'s money on ${what} and $${k} on a cap. ${n} had $${left} left. How much money did ${n} have at first?`, answer: d * u, form: "money",
        model: { t: "units", n: d, shade: d - a, unit: null, total: null, note: `Shaded: the ${units(d - a)} left after ${what}.` },
        steps: [
          `Draw the money as ${units(d)}. After ${what}, ${units(d - a)} ${d - a === 1 ? "is" : "are"} left.`,
          `Those ${units(d - a)} are the cap and what was left: $${k} + $${left} = $${k + left}.`,
          `1 unit = $${k + left} ÷ ${d - a} = $${u}. At first: ${d} × $${u} = $${d * u}.`,
        ],
        mistakes: [m(k + left, "forgot the fraction"), m(d * (u - j), "forgot the cap"), m(a * u, `gave the cost of ${what}`)] };
    }),
    W("w-heads-legs", 5, "5.OA.A.2", "advanced", (c) => {
      const ch = c.ri(3, 20), rb = c.ri(2, 15), h = ch + rb, legs = 2 * ch + 4 * rb;
      return { text: `A farm has chickens and rabbits. Together they have ${h} heads and ${legs} legs. How many rabbits are there?`, answer: rb,
        steps: [`If all ${h} animals were chickens there would be ${h} × 2 = ${2 * h} legs.`, `There are ${legs} − ${2 * h} = ${legs - 2 * h} extra legs. Each rabbit adds 2 extra legs.`, `Rabbits: ${legs - 2 * h} ÷ 2 = ${rb}.`],
        mistakes: [m(ch, "found the chickens"), m(legs / 4, "divided the legs by 4"), m(legs - 2 * h, "forgot to halve the extra legs")] };
    }),
    W("w-backwards", 5, "5.OA.A.2", "advanced", (c) => {
      const [n, p, q] = [c.name(), c.name(), c.name()], item = c.thing("collect").many, k = c.ri(2, 15), left = c.ri(3, 30);
      return { text: `${n} gave half of ${n}'s ${item} to ${p}, then gave ${k} to ${q}. ${n} had ${left} ${item} left. How many ${item} did ${n} have at first?`, answer: 2 * (left + k),
        steps: [`Work backwards. Before giving ${k} to ${q}, ${n} had ${left} + ${k} = ${left + k}.`, `That was the half kept, so at first ${n} had 2 × ${left + k} = ${2 * (left + k)}.`],
        mistakes: [m(left + k, "undid only the last step"), m(2 * left + k, "undid the steps in the wrong order"), m(2 * left, "forgot the ones given to " + q)] };
    }),
    W("w-excess", 6, "6.EE.B.7", "advanced", (c) => {
      const kids = c.ri(4, 15), a = c.ri(2, 6), b = c.ri(a + 1, a + 3), e = c.ri(1, (b - a) * kids - 1), s = (b - a) * kids - e, sweet = c.thing("food").many;
      return { text: `If each child gets ${a} ${sweet}, there are ${e} left over. If each child gets ${b}, there are ${s} too few. How many children are there?`, answer: kids,
        steps: [`Going from ${a} to ${b} each needs ${e} + ${s} = ${e + s} more ${sweet}.`, `Each child gets ${b - a} more, so there are ${e + s} ÷ ${b - a} = ${kids} children.`],
        mistakes: [m(e + s, "forgot to divide by the extra per child"), m(a * kids + e, `gave the number of ${sweet}`), m(Math.abs(e - s), "subtracted the leftovers")] };
    }),
    W("w-percent-spend", 6, "6.RP.A.3c", "advanced", (c) => {
      const n = c.name();
      let p1 = 0, p2 = 0, T = 0, left = 0.5;
      while (!Number.isInteger(left)) {
        p1 = c.pick([20, 25, 40, 50]); p2 = c.pick([20, 25, 50]); T = 20 * c.ri(4, 25);
        left = (T * (100 - p1) * (100 - p2)) / 10000;
      }
      const after = (T * (100 - p1)) / 100;
      return { text: `${n} spent ${p1}% of ${n}'s savings on a bag and ${p2}% of the rest on shoes. ${n} had $${left} left. How much were ${n}'s savings at first?`, answer: T, form: "money",
        steps: [`After the bag, ${100 - p1}% is left. The shoes take ${p2}% of that, so ${100 - p2}% of it is left.`, `$${left} is ${100 - p2}% of the rest, so the rest was $${after}.`, `$${after} is ${100 - p1}% of the savings, so the savings were $${T}.`],
        mistakes: [m(after, "undid only the shoes"), m((left * 100) / (100 - p1 - p2), "took both percents from the whole"), m(T - left, "gave the money spent")] };
    }),
    W("w-same-start", 6, "6.EE.B.7", "advanced", (c) => {
      const [p, q] = [c.name(), c.name()], k = c.pick([2, 3, 4]), u = c.ri(3, 20), a = c.ri(2, 20), b = a + (k - 1) * u, x = u + b;
      return { text: `${p} and ${q} had the same amount of money. ${p} spent $${a} and ${q} spent $${b}. Now ${p} has ${k} times as much as ${q}. How much did each of them have at first?`, answer: x, form: "money",
        model: { t: "ratio", r: k, b: 1, total: (k + 1) * u, names: [p, q], noun: "dollars left" },
        steps: [`After spending, ${q} has 1 unit and ${p} has ${k} units.`, `${q} spent $${b - a} more, and that is the gap of ${k - 1} unit${k > 2 ? "s" : ""}: 1 unit = $${u}.`, `At first: $${u} + $${b} = $${x}.`],
        mistakes: [m(u, `gave what ${q} has now`), m(k * u, `gave what ${p} has now`), m(b - a, "gave the difference in spending")] };
    }),
    W("w-consecutive", 6, "6.EE.B.7", "advanced", (c) => {
      const mid = c.ri(8, 90), s = 3 * mid, big = c.ri(0, 1) === 1;
      return { text: `Three consecutive whole numbers add up to ${s}. What is the ${big ? "largest" : "smallest"} of them?`, answer: big ? mid + 1 : mid - 1,
        steps: [`The middle number is the average: ${s} ÷ 3 = ${mid}.`, `The numbers are ${mid - 1}, ${mid} and ${mid + 1}.`],
        mistakes: [m(mid, "gave the middle number"), m(big ? mid - 1 : mid + 1, `gave the ${big ? "smallest" : "largest"}`), m(s - 3, "took away 3")] };
    }),
    W("w-pipes", 6, "6.RP.A.3b", "advanced", (c) => {
      const [a, b] = c.shuffle([...c.pick([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [6, 30], [12, 60], [15, 30], [8, 24]] as const)]);
      const [what, filler] = c.pick([["a tank", "Tap"], ["a pool", "Hose"], ["a bathtub", "Tap"], ["a water trough", "Pump"]] as const), both = (a * b) / (a + b);
      const lo = Math.min(a, b), hi = Math.max(a, b);
      return { text: `${filler} A fills ${what} in ${a} minutes. ${filler} B fills ${what} in ${b} minutes. How many minutes do they take to fill it together?`, answer: both,
        steps: [`In ${hi} minutes, the faster one fills ${hi / lo} and the slower one fills 1: that is ${hi / lo + 1} in ${hi} minutes.`, `Filling 1 takes ${hi} ÷ ${hi / lo + 1} = ${both} minutes.`],
        mistakes: [m((a + b) / 2, "averaged the times"), m(a + b, "added the times"), m(hi - lo, "subtracted the times")] };
    }),
  ],
};

/* ---------------- equations ---------------- */

const EQ: Record<Level, Template[]> = {
  easy: [
    W("e-add", 6, "6.EE.B.7", "easy", ({ ri }) => {
      const x = ri(2, 40), a = ri(3, 30), b = x + a;
      return { text: `Solve for x: x + ${a} = ${b}`, answer: x,
        model: { t: "pw", parts: [x, a], labels: ["", ""], unk: 0, whole: b },
        steps: [`x and ${a} make ${b}.`, `Subtract ${a} from both sides: x = ${b} − ${a} = ${x}.`],
        mistakes: [m(b + a, "added instead of subtracting"), m(b, "copied the total"), m(a, "copied the number added")] };
    }),
    W("e-sub", 6, "6.EE.B.7", "easy", ({ ri }) => {
      const x = ri(10, 60), a = ri(2, x - 2);
      return { text: `Solve for x: x − ${a} = ${x - a}`, answer: x,
        steps: [`Taking ${a} from x leaves ${x - a}.`, `Add ${a} to both sides: x = ${x - a} + ${a} = ${x}.`],
        mistakes: [m(Math.abs(x - 2 * a), "subtracted instead of adding"), m(x - a, "copied the right side"), m(a, "copied the number taken away")] };
    }),
    W("e-mul", 6, "6.EE.B.7", "easy", ({ ri }) => {
      const a = ri(2, 9), x = ri(2, 12);
      return { text: `Solve for x: ${a}x = ${a * x}`, answer: x,
        model: { t: "eq", n: a, c: 0, total: a * x, x: null },
        steps: [`${a}x means ${a} units of x, which make ${a * x}.`, `Divide both sides by ${a}: x = ${a * x} ÷ ${a} = ${x}.`],
        mistakes: [m(a * x - a, "subtracted instead of dividing"), m(a * a * x, "multiplied instead of dividing"), m(a * x, "copied the right side")] };
    }),
    W("e-div", 6, "6.EE.B.7", "easy", ({ ri }) => {
      const a = ri(2, 9), b = ri(2, 12);
      return { text: `Solve for x: x ÷ ${a} = ${b}`, answer: a * b,
        steps: [`x shared into ${a} equal parts gives ${b} in each part.`, `Multiply both sides by ${a}: x = ${b} × ${a} = ${a * b}.`],
        mistakes: [m(b, "copied the right side"), m(a + b, "added instead of multiplying"), m(b / a, "divided again")] };
    }),
    W("e-flip", 6, "6.EE.B.7", "easy", ({ ri }) => {
      const x = ri(2, 50), a = ri(3, 40), b = x + a;
      return { text: `Solve for x: ${b} = x + ${a}`, answer: x,
        steps: [`The equation reads the same both ways: x + ${a} = ${b}.`, `x = ${b} − ${a} = ${x}.`],
        mistakes: [m(b + a, "added instead of subtracting"), m(b, "copied the left side"), m(a, "copied the number added")] };
    }),
    W("e-take", 6, "6.EE.B.7", "easy", ({ ri }) => {
      const b = ri(20, 90), x = ri(2, b - 5), cc = b - x;
      return { text: `Solve for x: ${b} − x = ${cc}`, answer: x,
        steps: [`${b} take away x leaves ${cc}, so x is the part taken away.`, `x = ${b} − ${cc} = ${x}.`],
        mistakes: [m(b + cc, "added the numbers"), m(cc, "copied the right side"), m(Math.abs(cc - x), "mixed up the two parts")] };
    }),
    W("e-share", 6, "6.EE.B.7", "easy", ({ ri }) => {
      const x = ri(2, 12), cc = ri(2, 12), b = x * cc;
      return { text: `Solve for x: ${b} ÷ x = ${cc}`, answer: x,
        steps: [`${b} shared into x equal parts gives ${cc} in each.`, `x = ${b} ÷ ${cc} = ${x}.`],
        mistakes: [m(b * cc, "multiplied instead of dividing"), m(b - cc, "subtracted"), m(cc, "copied the right side")] };
    }),
  ],
  intermediate: [
    W("e-2step-add", 7, "7.EE.B.4a", "intermediate", ({ ri }) => {
      const a = ri(2, 9), x = ri(2, 15), b = ri(1, 30), cc = a * x + b;
      return { text: `Solve for x: ${a}x + ${b} = ${cc}`, answer: x,
        model: { t: "eq", n: a, c: b, total: cc, x: null },
        steps: [`Subtract ${b} from both sides: ${a}x = ${cc - b}.`, `Divide both sides by ${a}: x = ${x}.`, `Check: ${a} × ${x} + ${b} = ${cc}.`],
        mistakes: [m(cc - b, "forgot to divide"), m(cc - b - a, "subtracted the coefficient instead of dividing"), m((cc + b) / a, "added instead of subtracting"), m(cc / a - b, "divided before subtracting")] };
    }),
    W("e-2step-sub", 7, "7.EE.B.4a", "intermediate", ({ ri }) => {
      const a = ri(2, 9), x = ri(3, 15), b = ri(1, a * x - 1), cc = a * x - b;
      return { text: `Solve for x: ${a}x − ${b} = ${cc}`, answer: x,
        steps: [`Add ${b} to both sides: ${a}x = ${cc + b}.`, `Divide both sides by ${a}: x = ${x}.`, `Check: ${a} × ${x} − ${b} = ${cc}.`],
        mistakes: [m(cc + b, "forgot to divide"), m(cc + b - a, "subtracted the coefficient instead of dividing"), m((cc - b) / a, "subtracted instead of adding"), m(cc / a + b, "divided before adding")] };
    }),
    W("e-brackets", 7, "7.EE.B.4a", "intermediate", ({ ri }) => {
      const a = ri(2, 6), b = ri(1, 9), x = ri(1, 12), cc = a * (x + b);
      return { text: `Solve for x: ${a}(x + ${b}) = ${cc}`, answer: x,
        steps: [`Divide both sides by ${a}: x + ${b} = ${cc / a}.`, `Subtract ${b}: x = ${x}.`, `Check: ${a} × (${x} + ${b}) = ${cc}.`],
        mistakes: [m(cc / a, "forgot to subtract"), m((cc - b) / a, "subtracted before dividing"), m(cc / a + b, "added instead of subtracting")] };
    }),
    W("e-over", 7, "7.EE.B.4a", "intermediate", ({ ri }) => {
      const a = ri(2, 6), q = ri(2, 10), b = ri(1, 15), x = a * q;
      return { text: `Solve for x: x/${a} + ${b} = ${q + b}`, answer: x,
        steps: [`Subtract ${b} from both sides: x/${a} = ${q}.`, `Multiply both sides by ${a}: x = ${x}.`],
        mistakes: [m(q, "forgot to multiply"), m((q + b) * a, "multiplied before subtracting"), m(a * q + b, "added instead of subtracting")] };
    }),
    W("e-brackets-minus", 7, "7.EE.B.4a", "intermediate", ({ ri }) => {
      const a = ri(2, 6), b = ri(1, 9), x = ri(b + 1, b + 12), cc = a * (x - b);
      return { text: `Solve for x: ${a}(x − ${b}) = ${cc}`, answer: x,
        steps: [`Divide both sides by ${a}: x − ${b} = ${cc / a}.`, `Add ${b}: x = ${x}.`, `Check: ${a} × (${x} − ${b}) = ${cc}.`],
        mistakes: [m(cc / a - b, "subtracted instead of adding"), m(cc / a, "forgot to add"), m(cc + b, "added but forgot to divide"), m((cc + b) / a, "added before dividing")] };
    }),
    W("e-over-group", 7, "7.EE.B.4a", "intermediate", ({ ri }) => {
      const a = ri(2, 6), q = ri(3, 12), b = ri(1, a * q - 1), x = a * q - b;
      return { text: `Solve for x: (x + ${b}) ÷ ${a} = ${q}`, answer: x,
        steps: [`Multiply both sides by ${a}: x + ${b} = ${a * q}.`, `Subtract ${b}: x = ${x}.`],
        mistakes: [m(a * q + b, "added instead of subtracting"), m(a * q, "forgot to subtract"), m(q - b, "subtracted before multiplying")] };
    }),
    W("e-like-terms", 7, "7.EE.B.4a", "intermediate", ({ ri }) => {
      const a = ri(2, 7), b = ri(2, 7), x = ri(2, 12), cc = (a + b) * x;
      return { text: `Solve for x: ${a}x + ${b}x = ${cc}`, answer: x,
        steps: [`Combine like terms: ${a}x + ${b}x = ${a + b}x.`, `${a + b}x = ${cc}, so x = ${cc} ÷ ${a + b} = ${x}.`],
        mistakes: [m(cc / (a * b), "multiplied the coefficients"), m(cc - a - b, "subtracted the coefficients"), m(cc / a, "used only the first term"), m(cc / b, "used only the second term"), m(a + b, "gave the combined coefficient")] };
    }),
  ],
  advanced: [
    W("e-both-sides", 8, "8.EE.C.7b", "advanced", ({ ri }) => {
      const cc = ri(1, 6), a = ri(cc + 1, cc + 6), x = ri(-8, 12) || 3, b = ri(1, 15) * (ri(0, 1) ? 1 : -1), d = (a - cc) * x + b;
      return { text: `Solve for x: ${a}x ${sgn(b)} = ${cc}x ${sgn(d)}`, answer: x, negatives: true,
        steps: [
          `Subtract ${cc}x from both sides: ${a - cc}x ${sgn(b)} = ${d}.`,
          `${b >= 0 ? `Subtract ${b}` : `Add ${-b}`} on both sides: ${a - cc}x = ${d - b}.`,
          `Divide by ${a - cc}: x = ${x}.`,
        ],
        mistakes: [m(-x, "made a sign error"), m(d - b, "forgot to divide"), m((d - b) / (a + cc), "added the x terms"), m((d + b) / (a - cc), "moved the constant without changing its sign")] };
    }),
    W("e-expand", 8, "8.EE.C.7b", "advanced", ({ ri }) => {
      const a = ri(2, 6), b = ri(1, 9), cc = ri(1, a - 1 || 1), x = ri(-6, 12) || 2;
      const d = a * (x - b) - cc * x;
      return { text: `Solve for x: ${a}(x − ${b}) = ${cc}x ${sgn(d)}`, answer: x, negatives: true,
        steps: [
          `Expand the brackets: ${a}x − ${a * b} = ${cc}x ${sgn(d)}.`,
          `Subtract ${cc}x: ${a - cc}x − ${a * b} = ${d}.`,
          `Add ${a * b}: ${a - cc}x = ${d + a * b}, so x = ${x}.`,
        ],
        mistakes: [m(-x, "made a sign error"), m((d + b) / (a - cc), "only multiplied the x by " + a), m((d - a * b) / (a - cc), "subtracted instead of adding")] };
    }),
    W("e-negative", 7, "7.EE.B.4a", "advanced", ({ ri }) => {
      const a = ri(2, 9), x = -ri(1, 12), b = ri(1, 40), cc = a * x + b;
      return { text: `Solve for x: ${a}x + ${b} = ${signed(cc)}`, answer: x, negatives: true,
        steps: [`Subtract ${b} from both sides: ${a}x = ${cc - b}.`, `Divide by ${a}: x = ${x}. A negative answer is fine: check ${a} × (${x}) + ${b} = ${cc}.`],
        mistakes: [m(-x, "dropped the minus sign"), m((cc + b) / a, "added instead of subtracting"), m(cc - b, "forgot to divide")] };
    }),
    W("e-fractions", 8, "8.EE.C.7b", "advanced", ({ ri, pick }) => {
      const [p, q] = pick([[2, 3], [3, 4], [2, 5], [3, 6], [4, 6], [4, 5], [2, 6], [5, 10]] as const);
      const l = (p * q) / gcd(p, q), x = l * ri(1, 10), cc = x / p + x / q;
      return { text: `Solve for x: x/${p} + x/${q} = ${cc}`, answer: x,
        steps: [
          `Multiply every term by ${l} (the lowest common multiple of ${p} and ${q}): ${l / p}x + ${l / q}x = ${cc * l}.`,
          `Combine: ${l / p + l / q}x = ${cc * l}.`,
          `Divide: x = ${x}.`,
        ],
        mistakes: [m(cc * (p + q), "added the denominators"), m(cc * l, "forgot to combine and divide"), m((cc * (p + q)) / 2, "averaged the denominators")] };
    }),
    W("e-proportion", 8, "8.EE.C.7b", "advanced", ({ ri, pick }) => {
      const [d, b] = pick([[2, 3], [2, 5], [3, 4], [3, 5], [4, 5], [2, 7]] as const), k = ri(2, 9), x = ri(k * d + 1, k * b - 1);
      const a = k * b - x, cc = x - k * d;
      return { text: `Solve for x: (x + ${a})/${b} = (x − ${cc})/${d}`, answer: x, negatives: true,
        steps: [`Cross-multiply: ${d}(x + ${a}) = ${b}(x − ${cc}).`, `Expand: ${d}x + ${d * a} = ${b}x − ${b * cc}.`, `Collect: ${d * a + b * cc} = ${b - d}x, so x = ${x}.`],
        mistakes: [m(-x, "made a sign error"), m((d * a - b * cc) / (b - d), "dropped a minus sign when expanding"), m((a + cc) / (b - d), "forgot to multiply the constants")] };
    }),
    W("e-neg-coef", 8, "8.EE.C.7b", "advanced", ({ ri }) => {
      const a = ri(2, 9), x = ri(-8, 9) || 4, b = ri(1, 30), cc = b - a * x;
      return { text: `Solve for x: −${a}x + ${b} = ${signed(cc)}`, answer: x, negatives: true,
        steps: [`Subtract ${b} from both sides: −${a}x = ${signed(cc - b)}.`, `Divide by −${a}: x = ${x}.`],
        mistakes: [m(cc - b, "forgot to divide"), m(-x, "divided by " + a + " instead of −" + a), m((cc + b) / a, "added instead of subtracting"), m((b + cc) / -a, "moved the constant without changing its sign")] };
    }),
    W("e-distribute", 8, "8.EE.C.7b", "advanced", ({ ri }) => {
      const cc = ri(1, 5), a = ri(cc + 1, cc + 5), b = ri(1, 9), d = ri(1, 9), x = ri(-6, 10) || 3, e = (a - cc) * x + a * b + cc * d;
      return { text: `Solve for x: ${a}(x + ${b}) − ${cc}(x − ${d}) = ${signed(e)}`, answer: x, negatives: true,
        steps: [`Expand: ${a}x + ${a * b} − ${cc}x + ${cc * d} = ${e}. Minus times minus is plus.`, `Collect: ${a - cc}x + ${a * b + cc * d} = ${e}.`, `${a - cc}x = ${e - a * b - cc * d}, so x = ${x}.`],
        mistakes: [m((e - a * b + cc * d) / (a - cc), "wrote −" + cc + " × −" + d + " as negative"), m(-x, "made a sign error"), m(e - a * b - cc * d, "forgot to divide"), m((e - a * b - cc * d) / (a + cc), "added the x terms")] };
    }),
  ],
};

export function generators(kind: Kind, level: Level): Template[] {
  return (kind === "word" ? WORD : EQ)[level];
}

/** A practice set: cycles through every problem type for the level in random order, with no repeats. */
export function practiceSet(kind: Kind, level: Level, r: Rng, n = 10): Question[] {
  const gens = generators(kind, level);
  const order = helpers(r).shuffle(Array.from({ length: n }, (_, i) => i % gens.length));
  const seen = new Set<string>();
  return order.map((i) => pickFresh(seen, () => render(gens[i], r).question));
}

/** One problem type, for building test papers from. */
export interface ProblemType {
  kind: Kind;
  level: Level;
  grade: Grade;
  std: string;
  make: (r: Rng) => Question;
}

/** Every word-problem and equation type, with the grade and standard it is written for. */
export function problemTypes(): ProblemType[] {
  const out: ProblemType[] = [];
  for (const kind of ["word", "equations"] as Kind[]) {
    for (const { id: level } of LEVELS) {
      for (const tpl of generators(kind, level)) {
        out.push({ kind, level, grade: tpl.grade, std: tpl.std, make: (r) => render(tpl, r).question });
      }
    }
  }
  return out;
}
