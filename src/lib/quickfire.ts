/**
 * Quick-fire templates per grade, used by Play, the free grade checkpoint and the
 * placement check. Each one is tagged with the Common Core standard it practises and
 * lists the wrong answers that real mistakes give. The first templates at each grade
 * are the original quick-fire set, kept in the same order.
 */
import type { Grade } from "./questions";
import { gcd } from "./rng";
import { frac, noCarry, smallFromLarge, type Ctx, type Draft, type Mistake, type Template, type Tier } from "./templates";

const T = (id: string, grade: Grade, std: string, make: (c: Ctx) => Draft, tier: Tier = 1): Template => ({ id, grade, std, tier, make });
const m = (value: number | string, why: string): Mistake => ({ value, why });

const roundTo = (n: number, p: number) => Math.round(n / p) * p;

const G1: Template[] = [
  T("q1-bond", 1, "1.OA.C.6", ({ ri }) => {
    const w = ri(8, 20), a = ri(2, w - 2);
    return { text: `Number bond: ${w} is made of ${a} and what number?`, answer: w - a, model: { t: "bond", w, p: [a, null] },
      mistakes: [m(w + a, "added the parts"), m(a, "repeated the part"), m(w - a + 1, "counted on one too many")] };
  }),
  T("q1-beads", 1, "1.OA.A.1", (c) => {
    const n = c.name(), a = c.ri(3, 12), b = c.ri(2, 8);
    return { text: `${n} has ${a} red beads and ${b} blue beads. How many beads in all?`, answer: a + b, model: { t: "pw", parts: [a, b], labels: ["red", "blue"], unk: "whole" },
      mistakes: [m(Math.abs(a - b), "subtracted"), m(a + b - 1, "missed one when counting on"), m(a, "only counted the red")] };
  }),
  T("q1-birds", 1, "1.OA.A.1", ({ ri }) => {
    const w = ri(10, 19), a = ri(3, 9);
    return { text: `There are ${w} birds. ${a} fly away. How many are left?`, answer: w - a, model: { t: "pw", parts: [a, w - a], labels: ["flew", "left"], unk: 1, whole: w },
      mistakes: [m(w + a, "added"), m(a, "gave the number that flew"), m(w - a + 1, "counted back one too few")] };
  }),
  T("q1-tens", 1, "1.NBT.C.4", ({ ri }) => {
    const a = ri(11, 69), k = ri(1, Math.floor((99 - a) / 10)), b = 10 * k;
    return { text: `What is ${a} + ${b}?`, answer: a + b,
      mistakes: [m(a + k, "added the tens as ones"), m(a + b + 10, "added one ten too many"), m(a + b - 10, "added one ten too few")] };
  }),
  T("q1-place", 1, "1.NBT.B.2", ({ ri }) => {
    const tens = ri(2, 9), ones = ri(1, 9), n = 10 * tens + ones;
    return ri(0, 1)
      ? { text: `How many tens are in ${n}?`, answer: tens, mistakes: [m(ones, "gave the ones digit"), m(10 * tens, "gave the value of the tens"), m(n, "gave the whole number")] }
      : { text: `How many ones are in ${n} after the tens are taken away?`, answer: ones, mistakes: [m(tens, "gave the tens digit"), m(10 * tens, "gave the value of the tens"), m(n - 1, "took away one")] };
  }),
  T("q1-three", 1, "1.OA.A.2", (c) => {
    const n = c.name(), th = c.thing("collect"), a = c.ri(2, 7), b = c.ri(2, 7), d = c.ri(1, 5);
    return { text: `${n} has ${a} red, ${b} blue and ${d} green ${th.many}. How many ${th.many} does ${n} have in all?`, answer: a + b + d,
      mistakes: [m(a + b, "forgot the green"), m(b + d, "forgot the red"), m(a + b + d - 1, "missed one when counting")] };
  }),
  T("q1-need", 1, "1.OA.B.4", (c) => {
    const n = c.name(), th = c.thing("food"), w = c.ri(11, 20), a = c.ri(3, w - 3);
    return { text: `${n} has ${c.count(a, th)} and needs ${w}. How many more ${th.many} does ${n} need?`, answer: w - a,
      mistakes: [m(w + a, "added"), m(w, "gave the number needed"), m(w - a + 1, "counted on one too many")] };
  }),
  T("q1-ten-more", 1, "1.NBT.C.5", ({ ri }) => {
    const n = ri(15, 85);
    return ri(0, 1)
      ? { text: `What is 10 more than ${n}?`, answer: n + 10, mistakes: [m(n + 1, "added one, not ten"), m(n - 10, "took ten away"), m(n + 100, "added a hundred")] }
      : { text: `What is 10 less than ${n}?`, answer: n - 10, mistakes: [m(n - 1, "took one, not ten"), m(n + 10, "added ten"), m(n - 11, "took eleven")] };
  }),
  T("q1-compare", 1, "1.OA.A.1", (c) => {
    const [p, q] = [c.name(), c.name()], th = c.thing(), a = c.ri(8, 20), b = c.ri(2, a - 2);
    return { text: `${p} has ${c.count(a, th)}. ${q} has ${c.count(b, th)}. How many more ${th.many} does ${p} have than ${q}?`, answer: a - b,
      model: { t: "cmp", a: b, b: a, names: [q, p], unk: "diff" },
      mistakes: [m(a + b, "added"), m(a, `gave ${p}'s number`), m(b, `gave ${q}'s number`)] };
  }),
  T("q1-missing", 1, "1.OA.D.8", ({ ri }) => {
    const a = ri(3, 9), w = ri(a + 2, a + 10);
    return { text: `${a} + ? = ${w}. What is the missing number?`, answer: w - a,
      mistakes: [m(w + a, "added the two numbers"), m(w, "copied the total"), m(w - a + 1, "counted on one too many")] };
  }),
  T("q1-clock", 1, "1.MD.B.3", (c) => {
    const n = c.name(), h = c.ri(1, 11), half = c.ri(0, 1) === 1, what = c.pick(["school starts", "lunch is ready", "the bus comes", "the movie starts", "soccer practice starts", "the library opens"]);
    const pad = (x: number) => String(x).padStart(2, "0");
    return half
      ? { text: `${n} looks at the clock when ${what}. The short hand is halfway between ${h} and ${h + 1}. The long hand points to 6. What time is it?`, answer: `${h}:30`,
          mistakes: [m(`${h + 1}:30`, "read the hour hand as the next number"), m(`6:${pad(h * 5)}`, "mixed up the hands"), m(`${h}:06`, "read the 6 as 6 minutes"), m(`${h + 1}:00`, "read the next hour")] }
      : { text: `${n} looks at the clock when ${what}. The short hand points to ${h}. The long hand points to 12. What time is it?`, answer: `${h}:00`,
          mistakes: [m(`12:${pad(h * 5)}`, "mixed up the hands"), m(`${h}:12`, "read the 12 as 12 minutes"), m(`${h}:30`, "thought the long hand on 12 means half past"), m(`${h + 1}:00`, "read the next hour")] };
  }),
];

const G2: Template[] = [
  T("q2-more", 2, "2.OA.A.1", (c) => {
    const n = c.name(), a = c.ri(20, 60), b = c.ri(5, 30);
    return { text: `${n} has ${a} stickers. Sam has ${b} more stickers than ${n}. How many stickers does Sam have?`, answer: a + b, model: { t: "cmp", a, b: a + b, names: [n, "Sam"] },
      mistakes: [m(a - b, "took away because of the word “more”"), m(a, `gave ${n}'s number`), m(b, "gave the difference")] };
  }),
  T("q2-baker", 2, "2.OA.A.1", ({ ri }) => {
    const a = ri(30, 70), b = ri(10, a - 10), d = ri(10, 30);
    return { text: `A baker made ${a} muffins, sold ${b}, then baked ${d} more. How many muffins now?`, answer: a - b + d,
      mistakes: [m(a + b + d, "added everything"), m(a - b - d, "took away both"), m(a - b, "forgot the second batch")] };
  }),
  T("q2-add", 2, "2.NBT.B.5", (c) => {
    const [a, b] = c.tier === 0 ? c.addPair(2, false) : [c.ri(25, 75), c.ri(12, 24)];
    return { text: `What is ${a} + ${b}?`, answer: a + b,
      mistakes: [m(noCarry(a, b), "forgot to carry the ten"), m(a + b + 10, "carried twice"), m(a + b - 10, "lost the carried ten")] };
  }),
  T("q2-sub", 2, "2.NBT.B.5", (c) => {
    const [a, b] = c.subPair(2, c.tier > 0);
    return { text: `What is ${a} − ${b}?`, answer: a - b,
      mistakes: [m(smallFromLarge(a, b), "took the smaller digit from the larger"), m(a - b + 10, "renamed but forgot to take the ten"), m(a + b, "added")] };
  }),
  T("q2-coins", 2, "2.MD.C.8", (c) => {
    const n = c.name(), q = c.ri(1, 3), d = c.ri(1, 5);
    return { text: `${n} has ${q} quarter${q > 1 ? "s" : ""} and ${d} dime${d > 1 ? "s" : ""}. How many cents is that?`, answer: 25 * q + 10 * d,
      mistakes: [m(q + d, "counted coins, not cents"), m(10 * q + 25 * d, "swapped the coin values"), m(25 * q + d, "counted each dime as 1 cent")] };
  }),
  T("q2-ribbon", 2, "2.MD.B.5", (c) => {
    const n = c.name(), a = c.ri(40, 95), b = c.ri(12, a - 15);
    return { text: `A ribbon is ${a} cm long. ${n} cuts off ${b} cm. How long is the ribbon now?`, answer: a - b,
      mistakes: [m(a + b, "added"), m(b, "gave the piece cut off"), m(smallFromLarge(a, b), "took the smaller digit from the larger")] };
  }),
  T("q2-hto", 2, "2.NBT.A.1", ({ ri }) => {
    const h = ri(1, 9), tn = ri(0, 9), o = ri(1, 9);
    return { text: `What number has ${h} hundred${h === 1 ? "" : "s"}, ${tn} ten${tn === 1 ? "" : "s"} and ${o} one${o === 1 ? "" : "s"}?`, answer: 100 * h + 10 * tn + o,
      mistakes: [m(100 * o + 10 * tn + h, "wrote the digits backwards"), m(100 * h + 10 * o + tn, "swapped tens and ones"), m(h + tn + o, "added the digits")] };
  }),
  T("q2-array", 2, "2.OA.C.4", (c) => {
    const th = c.thing("food"), rows = c.ri(2, 5), cols = c.ri(2, 5);
    return { text: `A tray has ${rows} rows of ${c.count(cols, th)}. How many ${th.many} are on the tray?`, answer: rows * cols,
      mistakes: [m(rows + cols, "added rows and columns"), m(rows * cols + cols, "counted one row twice"), m(rows * cols - rows, "missed a column")] };
  }),
  T("q2-hundred", 2, "2.NBT.B.8", ({ ri }) => {
    const n = ri(150, 899);
    return ri(0, 1)
      ? { text: `What is 100 less than ${n}?`, answer: n - 100, mistakes: [m(n - 10, "took ten, not a hundred"), m(n + 100, "added a hundred"), m(n - 1, "took one")] }
      : { text: `What is 100 more than ${n}?`, answer: n + 100, mistakes: [m(n + 10, "added ten, not a hundred"), m(n - 100, "took a hundred"), m(n + 1, "added one")] };
  }),
  T("q2-pages", 2, "2.OA.A.1", (c) => {
    const [p, q] = [c.name(), c.name()], a = c.ri(15, 40), b = c.ri(15, 40), d = c.ri(10, a + b - 5);
    return { text: `${p} read ${a} pages on Monday and ${b} pages on Tuesday. ${q} read ${d} pages. How many more pages did ${p} read than ${q}?`, answer: a + b - d,
      mistakes: [m(a + b + d, "added all three"), m(a + b, `gave ${p}'s total`), m(Math.abs(a - d), "forgot Tuesday")] };
  }),
];

const G3: Template[] = [
  T("q3-boxes", 3, "3.OA.A.3", ({ ri }) => {
    const g = ri(3, 9), e = ri(4, 9);
    return { text: `There are ${g} boxes with ${e} pencils in each box. How many pencils altogether?`, answer: g * e, model: { t: "units", n: g, shade: g, unit: e, total: null },
      mistakes: [m(g + e, "added"), m(g * e + e, "counted one box twice"), m(g * e - g, "multiplication fact slip")] };
  }),
  T("q3-share", 3, "3.OA.A.3", (c) => {
    const k = c.ri(3, 8), e = c.ri(3, 9), n = c.name();
    return { text: `${n} shares ${k * e} cookies equally among ${k} friends. How many cookies does each friend get?`, answer: e, model: { t: "units", n: k, shade: 1, unit: null, total: k * e },
      mistakes: [m(k * e - k, "subtracted instead of dividing"), m(k * e + k, "added"), m(k, "gave the number of friends")] };
  }),
  T("q3-perim", 3, "3.MD.D.8", ({ ri }) => {
    const l = ri(5, 15), w = ri(2, 9);
    return { text: `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter in cm?`, answer: 2 * (l + w),
      mistakes: [m(l * w, "found the area"), m(l + w, "added only two sides"), m(2 * l + w, "missed a side")] };
  }),
  T("q3-equiv", 3, "3.NF.A.3", ({ ri, pick }) => {
    // Grade 3 keeps denominators small (2, 3, 4, 6, 8 in the standard; up to 12 here).
    const d = pick([2, 3, 4, 5, 6]), k = pick([2, 3, 4, 5, 6].filter((x) => d * x <= 12)), n = pick(Array.from({ length: d - 1 }, (_, i) => i + 1).filter((x) => gcd(x, d) === 1));
    return ri(0, 1)
      ? { text: `${n}/${d} = ?/${d * k}. What is the missing numerator?`, answer: n * k,
          mistakes: [m(n, "kept the numerator the same"), m(n + k, "added instead of multiplying"), m(n + d * k - d, "added what was added to the bottom")] }
      : { text: `${n * k}/${d * k} = ?/${d}. What is the missing numerator?`, answer: n,
          mistakes: [m(n * k, "kept the numerator the same"), m(n * k - k, "subtracted instead of dividing"), m(n * k - (d * k - d), "took away what was taken from the bottom")] };
  }),
  T("q3-area", 3, "3.MD.C.7", (c) => {
    const l = c.ri(3, 12), w = c.ri(2, 9), what = c.pick(["garden", "rug", "poster", "patio"]), unit = what === "poster" ? "cm" : "m";
    return { text: `A ${what} is ${l} ${unit} long and ${w} ${unit} wide. What is its area in square ${unit}?`, answer: l * w,
      mistakes: [m(2 * (l + w), "found the perimeter"), m(l + w, "added the sides"), m(l * w + l, "multiplication fact slip")] };
  }),
  T("q3-add3", 3, "3.NBT.A.2", (c) => {
    // Grade 3 adds within 1000.
    let [a, b] = c.addPair(3, c.tier > 0);
    for (let i = 0; i < 50 && a + b > 999; i++) [a, b] = c.addPair(3, c.tier > 0);
    if (a + b > 999) b = 999 - a;
    return { text: `What is ${a} + ${b}?`, answer: a + b,
      mistakes: [m(noCarry(a, b), "forgot to carry"), m(a + b - 10, "lost a carried ten"), m(a + b + 100, "carried into the hundreds twice")] };
  }),
  T("q3-round", 3, "3.NBT.A.1", ({ ri }) => {
    const n = ri(101, 989);
    if (n % 10 === 0) return { text: `Round ${n + 3} to the nearest ten.`, answer: n, mistakes: [m(n + 10, "rounded up"), m(roundTo(n + 3, 100), "rounded to the nearest hundred"), m(n + 3, "did not round")] };
    return ri(0, 1)
      ? { text: `Round ${n} to the nearest ten.`, answer: roundTo(n, 10),
        mistakes: [m(Math.floor(n / 10) * 10 === roundTo(n, 10) ? roundTo(n, 10) + 10 : Math.floor(n / 10) * 10, "rounded the wrong way"), m(roundTo(n, 100), "rounded to the nearest hundred"), m(n - (n % 10), "cut off the ones")] }
      : { text: `Round ${n} to the nearest hundred.`, answer: roundTo(n, 100),
        mistakes: [m(roundTo(n, 10), "rounded to the nearest ten"), m(Math.floor(n / 100) * 100 === roundTo(n, 100) ? roundTo(n, 100) + 100 : Math.floor(n / 100) * 100, "rounded the wrong way"), m(Math.floor(n / 100), "gave the hundreds digit")] };
  }),
  T("q3-factor", 3, "3.OA.A.4", ({ ri }) => {
    const a = ri(3, 9), x = ri(2, 9), b = a * x;
    return ri(0, 1)
      ? { text: `? × ${a} = ${b}. What is the missing number?`, answer: x, mistakes: [m(b - a, "subtracted"), m(b + a, "added"), m(b * a, "multiplied")] }
      : { text: `${b} ÷ ${a} = ?`, answer: x, mistakes: [m(b - a, "subtracted"), m(x + 1, "times-table slip"), m(a, "gave the divisor")] };
  }),
  T("q3-tens-x", 3, "3.NBT.A.3", ({ ri }) => {
    const a = ri(2, 9), k = ri(2, 9);
    return { text: `What is ${a} × ${k * 10}?`, answer: a * k * 10,
      mistakes: [m(a * k, "forgot the zero"), m(a * k * 100, "added two zeros"), m(a + k * 10, "added")] };
  }),
  T("q3-minutes", 3, "3.MD.A.1", (c) => {
    const h = c.ri(1, 10), s = c.pick([30, 35, 40, 45, 50]), e = c.pick([5, 10, 15, 20, 25]), what = c.pick(["A lesson", "A swim class", "A movie", "Soccer practice"]);
    return { text: `${what} starts at ${h}:${s} and ends at ${h + 1}:${String(e).padStart(2, "0")}. How many minutes long is it?`, answer: 60 - s + e,
      mistakes: [m(100 - s + e, "subtracted the times like whole numbers"), m(s + e, "added the minutes"), m(Math.abs(s - e), "subtracted the minutes")] };
  }),
  T("q3-twostep", 3, "3.OA.D.8", (c) => {
    const n = c.name(), th = c.thing("collect"), p = c.ri(3, 8), k = c.ri(4, 9), g = c.ri(3, p * k - 3);
    return { text: `${n} buys ${p} packs of ${k} ${th.many}, then gives away ${g}. How many ${th.many} does ${n} have now?`, answer: p * k - g,
      mistakes: [m(p * k + g, "added the ones given away"), m(p * k, "forgot the ones given away"), m(p + k - g, "added the packs instead of multiplying")] };
  }),
];

const G4: Template[] = [
  T("q4-mul", 4, "4.NBT.B.5", ({ ri }) => {
    const a = ri(120, 899), b = ri(3, 9);
    const noCarryMul = Number(String(a).split("").map((d) => (Number(d) * b) % 10).join(""));
    return { text: `What is ${a} × ${b}?`, answer: a * b,
      mistakes: [m(noCarryMul, "wrote only the ones of each product"), m(a * b + a, "times-table slip"), m(a * b - 10 * b, "dropped a carried ten")] };
  }),
  T("q4-fracadd", 4, "4.NF.B.3", ({ ri, pick }) => {
    const d = pick([5, 6, 8, 10, 12]), a = ri(1, d - 3), b = ri(1, d - a - 1);
    return { text: `What is ${a}/${d} + ${b}/${d}?`, answer: frac(a + b, d), model: { t: "units", n: d, shade: a + b, unit: null, total: null },
      mistakes: [m(frac(a + b, 2 * d), "added the denominators too"), m(frac(a * b, d), "multiplied the numerators"), m(frac(a + b + 1, d), "counted one part too many")] };
  }),
  T("q4-change", 4, "4.OA.A.3", (c) => {
    const n = c.name(), bill = c.pick([20, 50]);
    let p = c.ri(2, 6), k = c.ri(3, 8);
    while (p * k >= bill) { p = c.ri(2, 6); k = c.ri(3, 8); }
    return { text: `Pens cost $${p} each. ${n} buys ${k} pens and pays with a $${bill} bill. How much change does ${n} get?`, answer: bill - p * k, form: "money",
      mistakes: [m(p * k, "gave the cost"), m(bill - p, "took away one pen"), m(bill - p - k, "took away both numbers")] };
  }),
  T("q4-boxes", 4, "4.OA.A.3", (c) => {
    const th = c.thing("food"), per = c.pick([4, 6, 8, 10, 12]), full = c.ri(5, 20), extra = c.ri(1, per - 1), total = full * per + extra;
    return { text: `${total} ${th.many} are packed into boxes of ${per}. How many boxes are needed to pack all of them?`, answer: full + 1,
      mistakes: [m(full, "forgot the box for the leftovers"), m(extra, "gave the leftovers"), m(total - per, "subtracted")] };
  }),
  T("q4-round", 4, "4.NBT.A.3", ({ ri }) => {
    const n = ri(1001, 98999);
    const near = (p: number) => roundTo(n, p);
    const other = Math.floor(n / 1000) * 1000 === near(1000) ? near(1000) + 1000 : Math.floor(n / 1000) * 1000;
    return { text: `Round ${n.toLocaleString("en-US")} to the nearest thousand.`, answer: near(1000),
      mistakes: [m(near(100), "rounded to the nearest hundred"), m(other, "rounded the wrong way"), m(near(10000), "rounded to the nearest ten thousand")] };
  }),
  T("q4-rect", 4, "4.MD.A.3", ({ ri }) => {
    const l = ri(4, 15), w = ri(2, 9), A = l * w;
    return { text: `A rectangle has an area of ${A} cm² and is ${l} cm long. What is its perimeter in cm?`, answer: 2 * (l + w),
      mistakes: [m(A, "gave the area"), m(w, "gave the width"), m(l + w, "added only two sides")] };
  }),
  T("q4-cm", 4, "4.MD.A.1", ({ ri, pick }) => {
    const x = ri(1, 9), y = ri(5, 95);
    return pick([0, 1])
      ? { text: `How many centimeters are in ${x} m ${y} cm?`, answer: 100 * x + y, mistakes: [m(10 * x + y, "used 10 cm in a meter"), m(x + y, "added the numbers"), m(1000 * x + y, "used 1,000 cm in a meter")] }
      : { text: `How many grams are in ${x} kg ${y} g?`, answer: 1000 * x + y, mistakes: [m(100 * x + y, "used 100 g in a kilogram"), m(x + y, "added the numbers"), m(1000 * x + 10 * y, "wrote the grams in the wrong place")] };
  }),
  T("q4-times", 4, "4.OA.A.2", (c) => {
    const [a, b] = [c.thing("toys"), c.thing("toys")], p = c.ri(3, 12), k = c.ri(2, 6);
    return { text: `A ${a.one} costs $${p}. A ${b.one} costs ${k} times as much. How much does the ${b.one} cost?`, answer: k * p, form: "money",
      mistakes: [m(k + p, "added instead of multiplying"), m(k * p + p, "found the total for both"), m(p, `gave the price of the ${a.one}`)] };
  }),
  T("q4-wholefrac", 4, "4.NF.B.4b", ({ ri, pick }) => {
    const d = pick([3, 4, 5, 6, 8]), a = ri(1, d - 1), k = ri(2, 6);
    return { text: `What is ${k} × ${a}/${d}? Write it as a mixed number if you can.`, answer: frac(k * a, d, true),
      mistakes: [m(frac(k * a, k * d, true), "multiplied the denominator too"), m(frac(k + a, d, true), "added the whole number"), m(frac(a, k * d, true), "multiplied only the denominator")] };
  }),
  T("q4-seats", 4, "4.NBT.B.4", (c) => {
    const [a, b] = c.subPair(4, true), where = c.pick(["A stadium", "A concert hall", "A theater"]);
    return { text: `${where} has ${a.toLocaleString("en-US")} seats. ${b.toLocaleString("en-US")} are filled. How many seats are empty?`, answer: a - b,
      mistakes: [m(smallFromLarge(a, b), "took the smaller digit from the larger"), m(a - b + 10, "renamed but did not take the ten"), m(a + b, "added")] };
  }),
  T("q4-angle", 4, "4.MD.C.7", ({ ri }) => {
    const right = ri(0, 1) === 1, a = right ? ri(10, 80) : ri(20, 160);
    return right
      ? { text: `Two angles together make a right angle. One is ${a}°. How many degrees is the other?`, answer: 90 - a, mistakes: [m(180 - a, "used 180°"), m(360 - a, "used 360°"), m(a, "repeated the angle")] }
      : { text: `Two angles together make a straight line. One is ${a}°. How many degrees is the other?`, answer: 180 - a, mistakes: [m(Math.abs(90 - a), "used 90°"), m(360 - a, "used 360°"), m(a, "repeated the angle")] };
  }),
];

const G5: Template[] = [
  T("q5-girls", 5, "5.NF.B.6", ({ ri, pick }) => {
    const d = pick([4, 5, 8]), n = ri(1, d - 1), u = ri(3, 9), tot = d * u;
    return { text: `${n}/${d} of the ${tot} students in a class are girls. How many girls are there?`, answer: n * u, model: { t: "units", n: d, shade: n, unit: null, total: tot },
      mistakes: [m(u, "found one unit only"), m((d - n) * u, "found the boys"), m(tot - n, "took the numerator away")] };
  }),
  T("q5-decx", 5, "5.NBT.B.7", ({ ri }) => {
    const a = ri(11, 49), b = ri(2, 6), t = a % 10 ? a : a + 1;
    return { text: `What is ${t / 10} × ${b}?`, answer: (t * b) / 10, form: "dec",
      mistakes: [m(t * b, "dropped the decimal point"), m((t * b) / 100, "put the point in the wrong place"), m(t / 10 + b, "added")] };
  }),
  T("q5-volume", 5, "5.MD.C.5", ({ ri }) => {
    const l = ri(3, 9), w = ri(2, 6), h = ri(2, 5);
    return { text: `A box is ${l} cm long, ${w} cm wide and ${h} cm high. What is its volume in cm³?`, answer: l * w * h,
      mistakes: [m(l * w, "found the base only"), m(l + w + h, "added"), m(2 * (l * w + l * h + w * h), "found the surface area")] };
  }),
  T("q5-share", 5, "5.NBT.B.6", (c) => {
    const k = c.ri(12, 48), each = c.ri(15, 99), total = k * each, what = c.pick(["a school trip", "a class party", "a team uniform order"]);
    return { text: `The cost of ${what} is $${total.toLocaleString("en-US")}, shared equally by ${k} families. How much does each family pay?`, answer: each, form: "money",
      mistakes: [m(each * 10, "added an extra zero in the quotient"), m(total - k, "subtracted"), m(Math.floor(each / 10), "dropped a digit of the quotient")] };
  }),
  T("q5-unlike", 5, "5.NF.A.1", ({ pick, ri }) => {
    const [b, d] = pick([[2, 3], [2, 5], [3, 4], [4, 6], [2, 7], [3, 5], [4, 5], [6, 8]] as const);
    let a = ri(1, b - 1), cc = ri(1, d - 1);
    while (gcd(a, b) !== 1) a = ri(1, b - 1);
    while (gcd(cc, d) !== 1) cc = ri(1, d - 1);
    return { text: `What is ${a}/${b} + ${cc}/${d}? Write it as a mixed number if you can.`, answer: frac(a * d + cc * b, b * d, true),
      mistakes: [m(frac(a + cc, b + d, true), "added tops and bottoms"), m(frac(a + cc, b * d, true), "multiplied the bottoms but did not rename the tops"), m(frac(a * cc, b * d, true), "multiplied")] };
  }),
  T("q5-digit", 5, "5.NBT.A.1", ({ pick, shuffle }) => {
    const [w, t1, h1] = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3), place = pick(["tenths", "hundredths"] as const);
    const d = place === "tenths" ? t1 : h1, value = place === "tenths" ? `0.${d}` : `0.0${d}`;
    return { text: `What is the value of the digit ${d} in ${w}.${t1}${h1}?`, answer: value,
      mistakes: [m(String(d), "gave the digit, not its value"), m(place === "tenths" ? `0.0${d}` : `0.${d}`, "mixed up tenths and hundredths"), m(place === "tenths" ? `${d}0` : String(d * 10), "read the place to the left of the point")] };
  }),
  T("q5-servings", 5, "5.NF.B.7c", (c) => {
    const k = c.pick([2, 3, 4, 5]), n = c.ri(2, 9), what = c.pick(["cups of rice", "liters of juice", "pounds of trail mix"]);
    return { text: `How many 1/${k} servings are in ${n} ${what}?`, answer: n * k,
      mistakes: [m(n + k, "added"), m(k, "gave the size of a serving"), m(frac(n, k), "divided by the denominator")] };
  }),
  T("q5-convert", 5, "5.MD.A.1", ({ pick, ri }) => {
    const x = ri(11, 95) / 10, [big, small, f] = pick([["kg", "g", 1000], ["L", "mL", 1000], ["m", "cm", 100]] as const);
    return { text: `How many ${small} are in ${x} ${big}?`, answer: Math.round(x * f),
      mistakes: [m(Math.round(x * f / 10), "moved the point one place too few"), m(Math.round(x * f * 10), "moved the point one place too many"), m(Math.round(x * 10) + f, "added")] };
  }),
  T("q5-order", 5, "5.OA.A.1", ({ ri }) => {
    const a = ri(2, 20), b = ri(2, 9), d = ri(2, 9);
    return ri(0, 1)
      ? { text: `Evaluate ${a} + ${b} × ${d}.`, answer: a + b * d, mistakes: [m((a + b) * d, "worked left to right"), m(a + b + d, "added everything"), m(a * b + d, "multiplied the wrong pair")] }
      : { text: `Evaluate (${a} + ${b}) × ${d}.`, answer: (a + b) * d, mistakes: [m(a + b * d, "ignored the brackets"), m(a + b + d, "added everything"), m(a * d + b, "multiplied only the first number")] };
  }),
  T("q5-buy", 5, "5.NBT.B.7", (c) => {
    const n = c.name(), th = c.thing("school"), k = c.ri(2, 6), cents = c.ri(105, 495);
    return { text: `${n} buys ${k} ${th.many} at $${(cents / 100).toFixed(2)} each. How much does ${n} spend?`, answer: (k * cents) / 100, form: "cents",
      mistakes: [m((k * cents) / 1000, "put the point in the wrong place"), m(cents / 100 + k, "added"), m((k * cents) / 100 - 1, "lost a carried dollar")] };
  }),
  T("q5-height", 5, "5.MD.C.5b", ({ ri }) => {
    const l = ri(3, 10), w = ri(2, 8), h = ri(2, 9), V = l * w * h;
    return { text: `A box has a volume of ${V} cm³. It is ${l} cm long and ${w} cm wide. How high is it in cm?`, answer: h,
      mistakes: [m(V - l - w, "subtracted"), m(l * w, "found the base area"), m(V / l, "divided by one side only")] };
  }),
];

const G6: Template[] = [
  T("q6-ratio", 6, "6.RP.A.3", ({ ri }) => {
    let r = ri(1, 4), b = ri(2, 5);
    while (gcd(r, b) !== 1 || r === b) { r = ri(1, 4); b = ri(2, 5); }
    const u = ri(4, 10);
    return { text: `The ratio of red to blue marbles is ${r} : ${b}. There are ${(r + b) * u} marbles in all. How many are blue?`, answer: b * u, model: { t: "ratio", r, b, total: (r + b) * u },
      mistakes: [m(r * u, "found the red marbles"), m(u, "found one unit only"), m((r + b) * u - b, "took the ratio number away")] };
  }),
  T("q6-pct", 6, "6.RP.A.3c", ({ pick }) => {
    const p = pick([10, 20, 25, 30, 40, 50, 60, 75, 80]), n = pick([40, 60, 80, 120, 160, 200, 240, 300]);
    return { text: `What is ${p}% of ${n}?`, answer: (p * n) / 100, form: "dec",
      mistakes: [m(n - (p * n) / 100, "found what is left"), m((p * n) / 10, "divided by 10, not 100"), m(n / p, "divided")] };
  }),
  T("q6-eval", 6, "6.EE.A.2c", ({ ri }) => {
    const k = ri(2, 7), cc = ri(1, 12), x = ri(2, 9);
    return { text: `Evaluate ${k}x + ${cc} when x = ${x}.`, answer: k * x + cc,
      mistakes: [m(Number(`${k}${x}`) + cc, `read ${k}x as the two-digit number ${k}${x}`), m(k * (x + cc), "multiplied the whole sum"), m(k + x + cc, "added everything")] };
  }),
  T("q6-unit", 6, "6.RP.A.3b", (c) => {
    const th = c.thing("food"), k = c.pick([3, 4, 5, 6]), each = c.ri(2, 9), n = c.ri(2, 12);
    return { text: `${k} ${th.many} cost $${k * each}. At the same price, how much do ${n} ${th.many} cost?`, answer: n * each, form: "money",
      mistakes: [m(k * each * n, "multiplied the total by the new number"), m(each, "gave the price of one"), m(k * each + n - k, "added the extra items as dollars")] };
  }),
  T("q6-speed", 6, "6.RP.A.3b", (c) => {
    const h = c.ri(2, 6), s = c.ri(8, 70), who = c.pick(["A car", "A train", "A cyclist", "A boat"]);
    return { text: `${who} travels ${s * h} km in ${h} hours at a steady speed. What is the speed in km per hour?`, answer: s,
      mistakes: [m(s * h * h, "multiplied"), m(s * h - h, "subtracted"), m(s * h, "gave the distance")] };
  }),
  T("q6-gcf", 6, "6.NS.B.4", ({ ri, pick }) => {
    const g = ri(2, 9);
    let a = ri(2, 6), b = ri(2, 7);
    while (gcd(a, b) !== 1 || a === b) { a = ri(2, 6); b = ri(2, 7); }
    if (pick([0, 1])) return { text: `What is the greatest common factor of ${g * a} and ${g * b}?`, answer: g,
      mistakes: [m(g * a * b, "found the least common multiple"), m(Math.min(a, b) * g, "gave the smaller number"), m(g * a * g * b, "multiplied the numbers")] };
    const [p, q] = pick([[4, 6], [6, 8], [6, 9], [8, 12], [10, 15], [9, 12], [12, 18], [10, 4], [15, 20]] as const);
    const l = (p * q) / gcd(p, q);
    return { text: `One bus leaves every ${p} minutes and another every ${q} minutes. They both leave now. In how many minutes will they next leave together?`, answer: l,
      mistakes: [m(p * q, "multiplied the times"), m(p + q, "added the times"), m(gcd(p, q), "found the greatest common factor")] };
  }),
  T("q6-temp", 6, "6.NS.C.7", ({ ri }) => {
    const a = ri(2, 12), b = ri(a + 1, a + 15);
    return { text: `At 6 a.m. the temperature was −${a}°C. By noon it rose ${b} degrees. What was the temperature at noon, in °C?`, answer: b - a, negatives: true,
      mistakes: [m(a + b, "ignored the minus sign"), m(-(a + b), "went down instead of up"), m(a - b, "subtracted the wrong way")] };
  }),
  T("q6-triangle", 6, "6.G.A.1", ({ ri }) => {
    const b = 2 * ri(2, 9), h = ri(3, 12);
    return { text: `A triangle has a base of ${b} cm and a height of ${h} cm. What is its area in cm²?`, answer: (b * h) / 2,
      mistakes: [m(b * h, "forgot to halve"), m(b + h, "added"), m(2 * (b + h), "found a perimeter")] };
  }),
  T("q6-story-x", 6, "6.EE.B.7", (c) => {
    const n = c.name(), th = c.thing("collect"), a = c.ri(5, 30), x = c.ri(5, 40);
    return { text: `${n} had some ${th.many}, then got ${a} more and now has ${x + a}. Solve x + ${a} = ${x + a} to find how many ${n} had at first.`, answer: x,
      mistakes: [m(2 * a + x, "added instead of subtracting"), m(x + a, "gave the total"), m(a, "gave the number added")] };
  }),
  T("q6-decadd", 6, "6.NS.B.3", ({ ri }) => {
    const a = ri(101, 999), b = ri(11, 99);
    return { text: `What is ${(a / 100).toFixed(2)} + ${(b / 10).toFixed(1)}?`, answer: (a + 10 * b) / 100, form: "dec",
      mistakes: [m((a + b) / 100, "lined up the last digits, not the points"), m(Math.floor(a / 100) + Math.floor(b / 10) + ((a % 100) + (b % 10)) / 100, "added the parts after the point as whole numbers"), m((a + 10 * b) / 10, "put the point in the wrong place")] };
  }),
  T("q6-walk", 6, "6.RP.A.3c", (c) => {
    const p = c.pick([10, 20, 25, 30, 40, 60, 75]), n = c.pick([20, 40, 60, 80, 100]) , what = c.pick(["walk to school", "bring lunch", "play an instrument", "have a pet"]);
    return { text: `There are ${n} students in a grade and ${p}% of them ${what}. How many students is that?`, answer: (p * n) / 100, form: "dec",
      mistakes: [m(n - (p * n) / 100, "found the students who don't"), m(p, "gave the percent"), m((p * n) / 10, "divided by 10, not 100")] };
  }),
];

const G7: Template[] = [
  T("q7-sale", 7, "7.RP.A.3", ({ pick }) => {
    const p = pick([40, 50, 60, 80, 90, 120, 150, 200]), d = pick([10, 15, 20, 25, 30, 40]), what = pick(["jacket", "pair of sneakers", "backpack", "video game", "bike"]);
    return { text: `A ${what} costs $${p}. It is on sale for ${d}% off. What is the sale price?`, answer: (p * (100 - d)) / 100, form: "cents",
      mistakes: [m((p * d) / 100, "gave the discount, not the price"), m(p - d, "took off dollars, not percent"), m(p + (p * d) / 100, "added the discount")] };
  }),
  T("q7-solve", 7, "7.EE.B.4a", ({ ri }) => {
    const a = ri(2, 9), x = ri(2, 12), b = ri(1, 20), cc = a * x + b;
    return { text: `Solve for x: ${a}x + ${b} = ${cc}`, answer: x, model: { t: "eq", n: a, c: b, total: cc, x: null },
      mistakes: [m(cc - b, "forgot to divide"), m((cc + b) / a, "added instead of subtracting"), m(cc - b - a, "subtracted the coefficient")] };
  }),
  T("q7-circle", 7, "7.G.B.4", ({ ri, pick }) => {
    const r = ri(2, 20), what = pick(["A circle", "A circular rug", "A round pizza", "A round pond"]), useD = ri(0, 1) === 1;
    return { text: `${what} has ${useD ? `a diameter of ${2 * r}` : `radius ${r}`} cm. Using π ≈ 3.14, what is its area in cm²?`, answer: +(3.14 * r * r).toFixed(2), form: "dec",
      mistakes: [m(+(2 * 3.14 * r).toFixed(2), "found the circumference"), m(+(3.14 * 2 * r).toFixed(2), "used π × diameter"), m(+(3.14 * 4 * r * r).toFixed(2), "used the diameter as the radius")] };
  }),
  T("q7-intadd", 7, "7.NS.A.1", ({ ri }) => {
    const a = ri(2, 20), b = ri(2, 20);
    if (a === b) return { text: `What is −${a} + ${b + 1}?`, answer: 1, negatives: true, mistakes: [m(-1, "flipped the sign"), m(2 * a + 1, "ignored the minus"), m(-(2 * a + 1), "added the sizes and kept the minus")] };
    return { text: `What is −${a} + ${b}?`, answer: b - a, negatives: true,
      mistakes: [m(a - b, "flipped the sign"), m(a + b, "ignored the minus"), m(-(a + b), "added the sizes and kept the minus")] };
  }),
  T("q7-intmul", 7, "7.NS.A.2", ({ ri }) => {
    const a = ri(2, 12), b = ri(2, 12), both = ri(0, 1) === 1;
    return both
      ? { text: `What is (−${a}) × (−${b})?`, answer: a * b, negatives: true, mistakes: [m(-a * b, "kept a minus sign"), m(-(a + b), "added"), m(a + b, "added the sizes")] }
      : { text: `What is (−${a}) × ${b}?`, answer: -a * b, negatives: true, mistakes: [m(a * b, "dropped the minus sign"), m(b - a, "added"), m(-(a + b), "added the sizes")] };
  }),
  T("q7-prop", 7, "7.RP.A.2", (c) => {
    const k = c.ri(2, 9), a = c.ri(2, 8), b = c.ri(a + 1, a + 9), what = c.pick([["cups of flour", "cakes", "need"], ["liters of paint", "walls", "need"], ["dollars", "tickets", "cost"], ["minutes", "laps", "take"]] as const);
    return { text: `The number of ${what[0]} is proportional to the number of ${what[1]}. ${a} ${what[1]} ${what[2]} ${k * a} ${what[0]}. How many ${what[0]} do ${b} ${what[1]} ${what[2]}?`, answer: k * b,
      mistakes: [m(k * a + (b - a), "added the difference instead of scaling"), m(k * a * b, "multiplied by the new number"), m(k, "found the rate only")] };
  }),
  T("q7-markup", 7, "7.RP.A.3", (c) => {
    const p = c.pick([20, 40, 50, 60, 80, 120, 200]), d = c.pick([5, 10, 15, 20, 25, 50]), what = c.pick(["A bike", "A game", "A ticket", "A jacket"]);
    return { text: `${what} cost $${p}. The price goes up by ${d}%. What is the new price?`, answer: (p * (100 + d)) / 100, form: "cents",
      mistakes: [m(p + d, "added dollars, not percent"), m((p * d) / 100, "gave the increase only"), m((p * (100 - d)) / 100, "took the percent off")] };
  }),
  T("q7-pctchange", 7, "7.RP.A.3", (c) => {
    const a = c.pick([20, 25, 40, 50, 80]), p = c.pick([10, 20, 25, 50]), b = (a * (100 + p)) / 100;
    const [what, unit] = c.pick([["A plant was", "cm tall"], ["A class had", "students"], ["A savings jar held", "dollars"], ["A team scored", "points last season"]] as const);
    const now = what === "A plant was" ? `Now it is ${b} cm tall` : `Now it ${what === "A team scored" ? "scored" : what === "A class had" ? "has" : "holds"} ${b}${what === "A team scored" ? " this season" : ""}`;
    return { text: `${what} ${a} ${unit}. ${now}. By what percent did it increase?`, answer: `${p}%`,
      mistakes: [m(`${b - a}%`, "gave the change, not the percent"), m(`${+(((b - a) / b) * 100).toFixed(1)}%`, "divided by the new amount"), m(`${+((b / a) * 100).toFixed(1)}%`, "gave new ÷ old as a percent")] };
  }),
  T("q7-cube", 7, "7.G.B.6", ({ ri, pick }) => {
    const s = ri(2, 15), what = pick(["A cube", "A cube-shaped box", "A dice-shaped gift box", "A cube of wood"]);
    return { text: `${what} has edges ${s} cm long. What is its surface area in cm²?`, answer: 6 * s * s,
      mistakes: [m(s * s * s, "found the volume"), m(4 * s * s, "counted only four faces"), m(6 * s, "forgot to square")] };
  }),
  T("q7-prob", 7, "7.SP.C.5", (c) => {
    const r = c.ri(1, 9), b = c.ri(1, 9), [x, y] = c.pick([["red", "blue"], ["green", "yellow"], ["black", "white"]] as const);
    return { text: `A bag holds ${r} ${x} and ${b} ${y} counters. One is picked without looking. What is the probability it is ${x}?`, answer: frac(r, r + b),
      mistakes: [m(frac(r, b), `compared ${x} to ${y}`), m(frac(b, r + b), `found ${y}`), m(frac(1, r + b), "counted one counter only")] };
  }),
  T("q7-money", 7, "7.EE.B.3", (c) => {
    const n = c.name(), th = c.thing("toys"), k = c.ri(2, 4), p = c.ri(3, 9), g = c.ri(5, 15), start = k * p + c.ri(5, 30);
    return { text: `${n} has $${start}, buys ${k} ${th.many} at $${p} each, then earns $${g}. How much money does ${n} have now?`, answer: start - k * p + g, form: "money",
      mistakes: [m(start - k * p - g, "took the earnings away"), m(start - p + g, "paid for one only"), m(start + k * p + g, "added the cost")] };
  }),
];

const G8: Template[] = [
  T("q8-both", 8, "8.EE.C.7", ({ ri }) => {
    const x = ri(2, 9), a = ri(4, 9), cc = ri(1, a - 1), b = ri(1, 10), d = a * x - b - cc * x;
    return { text: `Solve for x: ${a}x − ${b} = ${cc}x ${d >= 0 ? "+ " + d : "− " + -d}`, answer: x, negatives: true,
      mistakes: [m(-x, "made a sign error"), m(d + b, "forgot to divide"), m((d + b) / (a + cc), "added the x terms"), m((d - b) / (a - cc), "subtracted the constant the wrong way")] };
  }),
  T("q8-pythag", 8, "8.G.B.7", ({ pick, ri }) => {
    const [p0, q0, h] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]] as const), k = ri(1, 5);
    const [p, q] = ri(0, 1) ? [p0, q0] : [q0, p0];
    return { text: `A right triangle has legs ${k * p} and ${k * q}. How long is the hypotenuse?`, answer: k * h,
      mistakes: [m(k * p + k * q, "added the legs"), m(k * k * (p * p + q * q), "forgot the square root"), m(k * Math.max(p, q) + 1, "guessed just over the longer leg")] };
  }),
  T("q8-slope", 8, "8.F.B.4", ({ ri }) => {
    const x1 = ri(0, 4), y1 = ri(0, 5), s = ri(-3, 4) || 2, dx = ri(1, 4);
    return { text: `What is the slope of the line through (${x1}, ${y1}) and (${x1 + dx}, ${y1 + s * dx})?`, answer: s, negatives: true,
      mistakes: [m(-s, "subtracted in the wrong order"), m(s > 0 ? frac(1, s) : `-${frac(1, -s)}`, "found run over rise"), m(s * dx, "gave the rise only")] };
  }),
  T("q8-exp", 8, "8.EE.A.1", ({ ri, pick }) => {
    const base = pick([2, 3, 5, 10]), a = ri(2, 7), b = ri(2, 6);
    return pick([0, 1])
      ? { text: `${base}^${a} × ${base}^${b} = ${base}^n. What is n?`, answer: a + b, mistakes: [m(a * b, "multiplied the exponents"), m(Math.abs(a - b), "subtracted the exponents"), m(a + b + 1, "added an extra one")] }
      : { text: `(${base}^${a})^${b} = ${base}^n. What is n?`, answer: a * b, mistakes: [m(a + b, "added the exponents"), m(a ** b, "raised the exponent to a power"), m(a * b + 1, "added an extra one")] };
  }),
  T("q8-root", 8, "8.EE.A.2", (c) => {
    const s = c.ri(4, 25), what = c.pick(["square garden", "square tile", "square poster", "square field"]);
    return { text: `A ${what} has an area of ${s * s} square units. How long is each side?`, answer: s,
      mistakes: [m((s * s) / 2, "halved the area"), m((s * s) / 4, "divided by 4 as if it were the perimeter"), m(2 * s, "doubled instead of taking the square root"), m(s * s, "gave the area")] };
  }),
  T("q8-plan", 8, "8.F.B.4", (c) => {
    const b = c.ri(10, 30), k = c.ri(2, 9), x = c.ri(2, 12);
    return { text: `A phone plan costs $${b} a month plus $${k} for each GB of data. How much does a month with ${x} GB cost?`, answer: b + k * x, form: "money",
      mistakes: [m((b + k) * x, "multiplied the monthly fee too"), m(k * x, "forgot the monthly fee"), m(b * x + k, "swapped the fee and the rate")] };
  }),
  T("q8-sci", 8, "8.EE.A.4", ({ ri }) => {
    const d = ri(11, 99), e = ri(3, 6);
    return { text: `Write ${(d / 10).toFixed(1)} × 10^${e} as an ordinary number.`, answer: d * 10 ** (e - 1),
      mistakes: [m(d * 10 ** e, "moved the point one place too far"), m(d * 10 ** (e - 2), "moved the point one place too few"), m(d * e, "multiplied by the exponent")] };
  }),
  T("q8-cyl", 8, "8.G.C.9", ({ ri }) => {
    const r = ri(1, 6), h = ri(2, 10), pi = 3.14;
    return { text: `A cylinder has radius ${r} cm and height ${h} cm. Using π ≈ 3.14, what is its volume in cm³?`, answer: +(pi * r * r * h).toFixed(2), form: "dec",
      mistakes: [m(+(2 * pi * r * h).toFixed(2), "found the curved surface area"), m(+(pi * 4 * r * r * h).toFixed(2), "used the diameter as the radius"), m(+(pi * r * h).toFixed(2), "forgot to square the radius")] };
  }),
  T("q8-system", 8, "8.EE.C.8", ({ ri }) => {
    const small = ri(3, 40), d = ri(2, 30), s = 2 * small + d;
    return { text: `Two numbers add up to ${s}. Their difference is ${d}. What is the larger number?`, answer: small + d,
      mistakes: [m(small, "found the smaller number"), m(s - d, "took away the difference only"), m(s / 2, "halved the sum")] };
  }),
  T("q8-distance", 8, "8.G.B.8", ({ pick, ri }) => {
    const [p, q, h] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [9, 12, 15], [12, 5, 13]] as const), x1 = ri(-3, 5), y1 = ri(-3, 5);
    const pt = (x: number, y: number) => `(${x}, ${y})`.replace(/-/g, "−");
    return { text: `How far apart are the points ${pt(x1, y1)} and ${pt(x1 + p, y1 + q)}?`, answer: h, negatives: true,
      mistakes: [m(p + q, "added the across and up distances"), m(p * p + q * q, "forgot the square root"), m(Math.abs(p - q), "subtracted the distances")] };
  }),
];

export const QUICK: Record<Grade, Template[]> = { 1: G1, 2: G2, 3: G3, 4: G4, 5: G5, 6: G6, 7: G7, 8: G8 };
