/**
 * Quick-fire templates for standards that the Massachusetts MCAS tests and the original
 * quick-fire set left out: geometry in Grades 3–5 and 8, expressions and equations in
 * Grade 6, functions in Grade 8, and a few smaller standards. They join the end of each
 * grade's quick-fire list in quickfire.ts. Every question is original; none is copied
 * from a released MCAS item.
 */
import type { Grade } from "./questions";
import { gcd } from "./rng";
import { frac, type Ctx, type Draft, type Mistake, type Template, type Tier } from "./templates";

const T = (id: string, grade: Grade, std: string, make: (c: Ctx) => Draft, tier: Tier = 1): Template => ({ id, grade, std, tier, make });
const m = (value: number | string, why: string): Mistake => ({ value, why });

/** A point written the way a book does, with a real minus sign: (−3, 4). */
const pt = (x: number, y: number) => `(${x}, ${y})`.replace(/-/g, "−");

const G3: Template[] = [
  T("q3-quad", 3, "3.G.A.1", (c) => {
    const n = c.name(), a = c.ri(2, c.by([6, 12, 20])), b = a + c.ri(1, c.by([4, 8, 15]));
    switch (c.ri(0, 3)) {
      case 0:
        return { text: `${n} draws a shape with 4 sides, each ${a} cm long, and 4 right angles. What is the best name for the shape?`, answer: "square",
          mistakes: [m("rhombus", "noticed the equal sides but not the right angles"), m("rectangle", "gave a name that fits, but not the best one"), m("trapezoid", "thought any shape with 4 sides is a trapezoid")] };
      case 1:
        return { text: `${n} draws a shape with 4 right angles. Two sides are ${a} cm long and the other two are ${b} cm long. What is the best name for the shape?`, answer: "rectangle",
          mistakes: [m("square", "thought 4 right angles always make a square"), m("rhombus", "thought opposite sides that match make a rhombus"), m("trapezoid", "thought any shape with 4 sides is a trapezoid")] };
      case 2:
        return { text: `${n} draws a shape with 4 sides, each ${a} cm long, and no right angles. What is the best name for the shape?`, answer: "rhombus",
          mistakes: [m("square", "thought equal sides always make a square"), m("rectangle", "did not check the angles"), m("trapezoid", "thought any shape with 4 sides is a trapezoid")] };
      default:
        return { text: `${n} draws a shape with 4 sides and exactly one pair of parallel sides. The parallel sides are ${a} cm and ${b} cm long. What is the best name for the shape?`, answer: "trapezoid",
          mistakes: [m("rectangle", "thought parallel sides make a rectangle"), m("rhombus", "did not check the side lengths"), m("square", "thought any shape with 4 sides is a square")] };
    }
  }),
  T("q3-sides", 3, "3.G.A.1", (c) => {
    const n = c.name(), top = c.by([3, 5, 9]), a = c.ri(1, top), b = c.ri(1, top), d = c.ri(1, top);
    const s = (k: number, one: string) => `${k} ${one}${k === 1 ? "" : "s"}`;
    return { text: `${n} draws ${s(a, "triangle")}, ${s(b, "quadrilateral")} and ${s(d, "pentagon")}. How many sides do the shapes have in all?`, answer: 3 * a + 4 * b + 5 * d,
      mistakes: [m(a + b + d, "counted the shapes, not the sides"), m(4 * (a + b + d), "counted 4 sides on every shape"), m(3 * a + 4 * b, "left out the pentagons"), m(4 * a + 5 * b + 6 * d, "counted one side too many on each shape")] };
  }),
  T("q3-parts", 3, "3.G.A.2", (c) => {
    const n = c.name(), k = c.pick(c.by([[2, 3, 4], [2, 3, 4, 6, 8], [3, 4, 6, 8]] as const)), what = c.pick(["pan of cornbread", "garden bed", "sheet of paper", "chocolate bar", "rectangular cake", "quilt"]);
    return c.ri(0, 1)
      ? { text: `${n} cuts a ${what} into equal pieces. Each piece is 1/${k} of the whole. How many pieces are there?`, answer: k,
          mistakes: [m(k - 1, "counted the cuts, not the pieces"), m(2 * k, "doubled the bottom number"), m(k + 1, "counted one piece too many"), m(1, "read the top number")] }
      : { text: `${n} cuts a ${what} into ${k} equal pieces. What fraction of the whole is each piece?`, answer: `1/${k}`,
          mistakes: [m(`1/${k - 1}`, "counted the cuts, not the pieces"), m(`1/${k + 1}`, "counted one piece too many"), m(`${k - 1}/${k}`, "gave the rest of the whole"), m(String(k), "gave the number of pieces")] };
  }),
  T("q3-tiles", 3, "3.MD.C.7d", (c) => {
    const n = c.name(), hi = c.by([5, 8, 12]), a = c.ri(2, hi), b = c.ri(2, hi), d = c.ri(1, hi), e = c.ri(2, hi), what = c.pick(["kitchen floor", "patio", "bathroom floor", "classroom rug", "game board"]);
    return { text: `${n}'s ${what} is made of square tiles, each 1 square foot. It is two rectangles side by side: one is ${a} by ${b} tiles, the other is ${d} by ${e} tiles. What is the area in square feet?`, answer: a * b + d * e,
      mistakes: [m(a * b, "found the first rectangle only"), m(2 * (a + b) + 2 * (d + e), "found the perimeters"), m((a + d) * (b + e), "added the lengths, then multiplied"), m(a + b + d + e, "added the side lengths")] };
  }),
  T("q3-grid", 3, "3.MD.C.6", (c) => {
    const n = c.name(), w = c.ri(c.by([3, 6, 10]), c.by([9, 16, 30])), h = 2 * c.ri(1, c.by([3, 5, 8]));
    return { text: `${n} draws a shape on centimeter grid paper. It covers ${w} whole squares and ${h} half squares. What is its area in square centimeters?`, answer: w + h / 2,
      mistakes: [m(w + h, "counted each half square as a whole one"), m(w, "left out the half squares"), m(w + 2 * h, "counted each half square as two"), m(h / 2, "counted only the half squares")] };
  }),
  T("q3-multi-equal", 3, "3.OA.B.5", (c) => {
    const a = c.ri(2, c.by([5, 9, 9])), b = c.ri(3, c.by([6, 9, 12])), b1 = c.ri(1, b - 1), b2 = b - b1;
    return { text: `Which expressions are equal to ${a} × ${b}?`, format: "multi", answer: "",
      right: [`${b} × ${a}`, `${a} × ${b1} + ${a} × ${b2}`],
      mistakes: [m(`${a} + ${b}`, "added instead of multiplying"), m(`${a} × ${b1} + ${b2}`, "multiplied only one part"), m(`${a} × ${b + 1}`, "used one group too many"), ...(b === a + 1 ? [] : [m(`${a + 1} × ${b - 1}`, "moved one from one factor to the other")])] };
  }),
  T("q3-two-stickers", 3, "3.OA.D.8", (c) => {
    const n = c.name(), th = c.thing("collect"), k = c.ri(2, c.by([4, 6, 9])), p = c.ri(3, c.by([6, 9, 10])), g = c.ri(2, k * p - 2);
    return { text: `${n} buys ${k} packs of ${th.many} with ${p} in each pack, then gives ${g} ${th.many} to a friend.`, format: "twopart", answer: "", mistakes: [],
      parts: [
        { text: `How many ${th.many} does ${n} have left?`, answer: k * p - g,
          mistakes: [m(k + p - g, "added the packs and the number in each"), m(k * p + g, "added the ones given away"), m(k * p, "forgot the ones given away")] },
        { text: `Which equation could ${n} use? Let s stand for the ${th.many} left.`, answer: `s = ${k} × ${p} − ${g}`,
          mistakes: [m(`s = ${k} + ${p} − ${g}`, "added instead of multiplying"), m(`s = ${k} × ${p} + ${g}`, "added the ones given away"), m(`s = ${k} × (${p} − ${g})`, "took the gift from every pack")] },
      ] };
  }),
  T("q3-cr-garden", 3, "3.MD.D.8", (c) => {
    const n = c.name(), a = c.ri(2, c.by([5, 8, 9])), b = c.ri(a + 1, c.by([7, 10, 12])), area = a * b;
    // Another rectangle with the same area and a different perimeter.
    const others = Array.from({ length: area }, (_, i) => i + 1).filter((x) => area % x === 0 && x <= area / x && x !== a);
    const o = others.length ? c.pick(others) : 1, ob = area / o;
    return { text: `${n} plans a rectangular garden ${a} feet wide and ${b} feet long.`, format: "cr", answer: "", mistakes: [],
      steps: [`Area: ${a} × ${b} = ${area} square feet.`, `Perimeter: ${a} + ${b} + ${a} + ${b} = ${2 * (a + b)} feet.`, `${o} × ${ob} is also ${area}, so that garden has the same area.`, `Its perimeter is ${2 * (o + ob)} feet, so the same area can have a different perimeter.`],
      parts: [
        { text: "What is the area of the garden in square feet?", format: "typein", answer: area,
          mistakes: [m(2 * (a + b), "found the perimeter"), m(a + b, "added the sides"), m(area + a, "counted an extra row")] },
        { text: "How many feet of fence go all the way around it?", format: "typein", answer: 2 * (a + b),
          mistakes: [m(a + b, "added only two sides"), m(area, "found the area"), m(2 * a + b, "missed one side")] },
        { text: `Which garden has the same area as ${n}'s?`, answer: `${o} ft by ${ob} ft`,
          mistakes: [m(`${a + 1} ft by ${b - 1} ft`, "kept the same perimeter, not the same area"), m(`${a} ft by ${b + 1} ft`, "made one side longer"), m(`${b} ft by ${b} ft`, "used the longer side twice")] },
        { text: "Which sentence is true?", answer: "Two gardens can have the same area but different perimeters.",
          mistakes: [m("Gardens with the same area always have the same perimeter.", "thought area decides perimeter"), m("Area and perimeter are always the same number.", "mixed up area and perimeter"), m("A longer garden always has a smaller area.", "thought length alone decides area")] },
      ] };
  }),
  T("q3-cr-reading", 3, "3.OA.D.8", (c) => {
    const n = c.name(), p = c.ri(2, c.by([5, 9, 10])), d = c.ri(2, c.by([5, 7, 9])), read = p * d, left = c.ri(3, c.by([20, 50, 90])), book = read + left;
    return { text: `${n}'s book has ${book} pages. ${n} reads ${p} pages every day for ${d} days.`, format: "cr", answer: "", mistakes: [],
      steps: [`Pages read: ${d} × ${p} = ${read}.`, `Pages left: ${book} − ${read} = ${left}.`, `Check: ${read} + ${left} = ${book}.`],
      parts: [
        { text: "Which equation shows L, the number of pages left to read?", answer: `L = ${book} − ${d} × ${p}`,
          mistakes: [m(`L = ${book} − ${d} − ${p}`, "subtracted the days and the pages instead of multiplying"), m(`L = ${book} + ${d} × ${p}`, "added the pages read"), m(`L = (${book} − ${d}) × ${p}`, "subtracted before multiplying")] },
        { text: `How many pages has ${n} read so far?`, format: "typein", answer: read,
          mistakes: [m(p + d, "added instead of multiplying"), m(read + p, "counted one extra day"), m(read - p, "counted one day too few")] },
        { text: "How many pages are left to read?", format: "typein", answer: left,
          mistakes: [m(book - p, "took away only one day of reading"), m(book + read, "added the pages read"), m(book - p - d, "took away the days and the pages")] },
      ] };
  }),
];

const ANGLE_KINDS = ["acute", "right", "obtuse", "straight"] as const;
const ANGLE_WHY: Record<(typeof ANGLE_KINDS)[number], string> = {
  acute: "mixed up acute (less than 90°) and obtuse",
  right: "thought anything near 90° is a right angle",
  obtuse: "mixed up obtuse (between 90° and 180°) and acute",
  straight: "thought a big angle is a straight angle",
};

/** Lines of symmetry and number of sides of shapes a child can fold. */
const FOLDS = [
  ["square", 4, 4], ["rectangle that is not a square", 2, 4], ["equilateral triangle", 3, 3], ["regular hexagon", 6, 6],
  ["regular pentagon", 5, 5], ["isosceles triangle with one short side", 1, 3], ["regular octagon", 8, 8], ["rhombus that is not a square", 2, 4],
] as const;

const G4: Template[] = [
  T("q4-angle-kind", 4, "4.G.A.1", (c) => {
    const n = c.name(), kind = c.pick(ANGLE_KINDS);
    const d = kind === "acute" ? 5 * c.ri(2, 17) : kind === "obtuse" ? 5 * c.ri(19, 35) : kind === "right" ? 90 : 180;
    const how = c.pick(["with a protractor", "between two roads on a map", "between the hands of a clock", "on a worksheet"]);
    return { text: `${n} measures an angle ${how}. It is ${d}°. What kind of angle is it?`, answer: kind,
      mistakes: ANGLE_KINDS.filter((k) => k !== kind).map((k) => m(k, ANGLE_WHY[k])) };
  }),
  T("q4-symmetry", 4, "4.G.A.3", (c) => {
    const n = c.name(), [shape, lines, sides] = c.pick(FOLDS);
    return { text: `${n} folds a paper ${shape} so the two halves match exactly. How many different fold lines (lines of symmetry) does it have?`, answer: lines,
      mistakes: [m(sides, "counted the sides"), m(2 * lines, "counted both ends of each fold line"), m(lines - 1, "missed one of the fold lines"), m(lines + 1, "counted a fold that does not match")] };
  }),
  T("q4-triangle", 4, "4.G.A.2", (c) => {
    const kind = c.pick(["acute", "right", "obtuse"] as const);
    let a: number, b: number;
    if (kind === "right") { a = 5 * c.ri(4, 14); b = 90 - a; }
    else if (kind === "obtuse") { a = 5 * c.ri(19, 28); b = 5 * c.ri(2, (180 - a) / 5 - 2); }
    else { do { a = 5 * c.ri(10, 17); b = 5 * c.ri(Math.max(10, (90 - a) / 5 + 1), 17); } while (180 - a - b >= 90 || (a === 60 && b === 60)); }
    const angles = c.shuffle([a, b, 180 - a - b]);
    return { text: `A triangle has angles of ${angles[0]}°, ${angles[1]}° and ${angles[2]}°. What kind of triangle is it?`, answer: `${kind} triangle`,
      mistakes: [
        ...(["acute", "right", "obtuse"] as const).filter((k) => k !== kind).map((k) => m(`${k} triangle`, k === "acute" ? "only looked at the two smallest angles" : k === "right" ? "thought an angle near 90° is a right angle" : "thought the biggest angle must be obtuse")),
        m("equilateral triangle", "thought the angles were all the same"),
      ] };
  }),
  T("q4-multi-equiv", 4, "4.NF.A.1", (c) => {
    // Equal fractions whose denominators stay in the Massachusetts Grade 4 list (2, 3, 4, 5, 6, 8, 10, 12, 100).
    const b = c.pick(c.by([[2, 3, 4], [2, 3, 4, 5], [3, 4, 5]] as const)), a = c.pick(Array.from({ length: b - 1 }, (_, i) => i + 1).filter((x) => gcd(x, b) === 1));
    const [k1, k2] = c.shuffle([2, 3, 4, 5, 6, 8, 10, 12, 100].filter((x) => x > b && x % b === 0).map((x) => x / b)).slice(0, 2);
    return { text: `Which fractions are equal to ${a}/${b}?`, format: "multi", answer: "",
      right: [`${a * k1}/${b * k1}`, `${a * k2}/${b * k2}`],
      mistakes: [m(`${a + k1}/${b + k1}`, "added the same number to the top and bottom"), m(`${a * k1}/${b}`, "multiplied only the top"), m(`${a}/${b * k2}`, "multiplied only the bottom"), m(`${b}/${a + b}`, "mixed up the parts")] };
  }),
  T("q4-two-buses", 4, "4.OA.A.3", (c) => {
    const cap = c.pick(c.by([[10, 20], [12, 15, 20, 25], [24, 32, 36, 45]] as const)), full = c.ri(2, c.by([5, 8, 12])), r = c.ri(1, cap - 1), n = cap * full + r;
    const who = c.pick(["students", "campers", "fans", "scouts"]);
    return { text: `${n} ${who} are going on a trip. Each bus holds ${cap} ${who}.`, format: "twopart", answer: "", mistakes: [],
      parts: [
        { text: "How many buses are needed so everyone can go?", answer: full + 1,
          mistakes: [m(full, "dropped the remainder"), m(r, "gave the remainder"), m(full + 2, "added one bus too many")] },
        { text: "If every bus but the last is full, how many empty seats are on the last bus?", answer: cap - r,
          mistakes: [m(r, "gave the riders on the last bus"), m(cap, "counted the whole bus as empty"), m(cap - r + 1, "counted one seat too many")] },
      ] };
  }),
  T("q4-cr-shopping", 4, "4.OA.A.3", (c) => {
    const n = c.name(), [x, y] = c.pick([["notebooks", "pens"], ["paint sets", "brushes"], ["T-shirts", "caps"], ["books", "bookmarks"]] as const);
    const k = c.ri(2, c.by([4, 6, 9])), p = c.ri(3, c.by([9, 15, 25])), j = c.ri(2, c.by([5, 8, 12])), q = c.ri(1, c.by([4, 6, 9]));
    const cost = k * p + j * q, short = c.ri(0, 1) === 1;
    let have = short ? cost - c.ri(1, Math.min(9, cost - 1)) : cost + c.ri(1, 20);
    // Keep "what is left" and "what is short" different from the other amounts, so every choice is different.
    if (2 * have === cost || have === 2 * cost) have++;
    return { text: `${n} buys ${k} ${x} at $${p} each and ${j} ${y} at $${q} each. ${n} has $${have}.`, format: "cr", answer: "", mistakes: [],
      steps: [`The ${x}: ${k} × $${p} = $${k * p}.`, `The ${y}: ${j} × $${q} = $${j * q}.`, `Total: $${k * p} + $${j * q} = $${cost}.`, short ? `$${have} is less than $${cost}, so ${n} needs $${cost - have} more.` : `$${have} − $${cost} = $${have - cost} left.`],
      parts: [
        { text: `How much do the ${x} cost?`, format: "typein", answer: k * p, form: "money",
          mistakes: [m(k + p, "added instead of multiplying"), m(p, "gave the price of one"), m(k * p + p, "paid for one too many")] },
        { text: "What is the total cost?", format: "typein", answer: cost, form: "money",
          mistakes: [m(k * p + j + q, "added the pens' numbers instead of multiplying"), m(k * p, "left out the second item"), m((k + j) * (p + q), "multiplied the sums")] },
        { text: `Does ${n} have enough money?`, answer: short ? `No, ${n} needs $${cost - have} more.` : `Yes, with $${have - cost} left.`,
          mistakes: short
            ? [m(`Yes, with $${cost - have} left.`, "subtracted the wrong way round"), m(`No, ${n} needs $${cost} more.`, "forgot the money already saved"), m(`Yes, with $${have} left.`, "did not take away the cost"), m("Yes, with $0 left.", "thought the money was just enough")]
            : [m(`No, ${n} needs $${have - cost} more.`, "subtracted the wrong way round"), m(`Yes, with $${have} left.`, "did not take away the cost"), m(`Yes, with $${cost} left.`, "gave the cost, not what is left"), m(`No, ${n} needs $${cost} more.`, "forgot the money already saved")] },
      ] };
  }),
  T("q4-cr-brownies", 4, "4.NF.A.2", (c) => {
    // Two fractions with different denominators from the Grade 4 list, whose common denominator is at most 12.
    const pairs = [[2, 4], [2, 8], [4, 8], [3, 6], [3, 12], [4, 12], [6, 12], [2, 6], [2, 10], [5, 10], [2, 3], [3, 4], [2, 12], [4, 6]] as const;
    const [b, d] = c.shuffle([...c.pick(pairs)]), L = (b * d) / gcd(b, d);
    const a = c.ri(1, b - 1);
    let k = c.ri(1, d - 1);
    if (a * d === k * b) k = k === d - 1 ? k - 1 : k + 1;
    if (k < 1) k = 1;
    const A = (a * L) / b, C = (k * L) / d, n1 = c.name(), n2 = c.name(), more = A > C ? n1 : n2;
    const what = c.pick(["pan of brownies", "pizza", "tray of lasagna", "pan of cornbread"]);
    return { text: `${n1} eats ${a}/${b} of a ${what}. ${n2} eats ${k}/${d} of another ${what} the same size.`, format: "cr", answer: "", mistakes: [],
      steps: [`Write both with ${L} as the bottom number: ${a}/${b} = ${A}/${L} and ${k}/${d} = ${C}/${L}.`, `${Math.max(A, C)}/${L} > ${Math.min(A, C)}/${L}, so ${more} ate more, by ${Math.abs(A - C)} pieces of size 1/${L}.`, `Together: ${A}/${L} + ${C}/${L} = ${frac(A + C, L, true)}.`],
      parts: [
        { text: "Who ate more?", answer: more,
          mistakes: [m(more === n1 ? n2 : n1, "compared the bottom numbers or the top numbers alone"), m("They ate the same amount.", "thought different fractions can't be compared"), m("You can't tell without cutting the pieces the same size.", "did not find a common denominator")] },
        { text: "Which reason is correct?", answer: `With ${L} as the bottom number, ${n1} ate ${A}/${L} and ${n2} ate ${C}/${L}.`,
          mistakes: [m(`${b > d ? n1 : n2}'s piece is bigger because ${Math.max(b, d)} is more than ${Math.min(b, d)}.`, "thought a bigger bottom number means more"), m(a === k ? `They ate the same, because both top numbers are ${a}.` : `${a > k ? n1 : n2} ate more because ${Math.max(a, k)} is more than ${Math.min(a, k)}.`, "compared only the top numbers"), m("Both are less than 1 whole, so they are the same.", "thought all fractions less than 1 are equal")] },
        { text: `Cut each ${what} into ${L} equal pieces. How many more pieces did ${more} eat?`, format: "typein", answer: Math.abs(A - C),
          mistakes: [m(Math.abs(a - k), "subtracted the top numbers before making the bottoms match"), m(A + C, "added instead of subtracting"), m(Math.abs(b - d), "subtracted the bottom numbers")] },
        { text: `How much of a ${what} did they eat together?`, answer: frac(A + C, L, true),
          mistakes: [m(`${a + k}/${b + d}`, "added the tops and added the bottoms"), m(frac(A + C, 2 * L, true), "added the bottom numbers too"), m(frac(Math.abs(A - C), L, true), "subtracted instead of adding")] },
      ] };
  }),
];

const G5: Template[] = [
  T("q5-coord", 5, "5.G.A.2", (c) => {
    const [from, to] = c.pick([["school", "library"], ["park", "pool"], ["bus stop", "museum"], ["fire station", "bakery"], ["playground", "post office"]] as const);
    const hi = c.by([5, 9, 15]), x = c.ri(1, hi), y = c.ri(1, hi);
    const a = c.ri(1, hi);
    let b = c.ri(1, hi);
    if (a === b) b = a + 1;
    const units = (k: number) => `${k} unit${k === 1 ? "" : "s"}`;
    return { text: `On a town map, the ${from} is at (${x}, ${y}). The ${to} is ${units(a)} right and ${units(b)} up from the ${from}. Where is the ${to}?`, answer: pt(x + a, y + b),
      mistakes: [m(pt(y + b, x + a), "wrote the up number first"), m(pt(x + b, y + a), "mixed up right and up"), m(pt(a, b), "gave the moves, not the place"), m(pt(x + a, y), "forgot to move up")] };
  }),
  T("q5-axis", 5, "5.G.A.1", (c) => {
    const hi = c.by([6, 10, 20]), x = c.ri(1, hi);
    let y = c.ri(1, hi);
    if (y === x) y = x + 1;
    const p = c.pick(["A", "B", "P", "Q", "R"]);
    return c.ri(0, 1)
      ? { text: `Point ${p} is at (${x}, ${y}). How many units is it from the y-axis?`, answer: x,
          mistakes: [m(y, "used the second number"), m(x + y, "added both numbers"), m(Math.abs(x - y), "took one number from the other")] }
      : { text: `Point ${p} is at (${x}, ${y}). How many units is it above the x-axis?`, answer: y,
          mistakes: [m(x, "used the first number"), m(x + y, "added both numbers"), m(Math.abs(x - y), "took one number from the other")] };
  }),
  T("q5-pattern", 5, "5.OA.B.3", (c) => {
    const a = c.ri(2, c.by([5, 7, 9])), k = c.ri(2, c.by([4, 5, 6])), b = a * k, t = c.ri(3, c.by([8, 10, 15]));
    return { text: `Pattern A starts at 0 and adds ${a} each time. Pattern B starts at 0 and adds ${b} each time. When Pattern A reaches ${a * t}, what is the matching term in Pattern B?`, answer: b * t,
      mistakes: [m(a * t + (b - a), "added the difference in the rules once"), m(a * t + b, "added Pattern B's rule once"), m(a * t * b, "multiplied by Pattern B's rule"), m(b * (t + 1), "counted one term too many")] };
  }),
  T("q5-share-mixed", 5, "5.NF.B.3", (c) => {
    const n = c.name(), b = c.ri(2, c.by([4, 6, 9]));
    let a = c.ri(b + 1, c.by([12, 25, 50]));
    if (a % b === 0) a++;
    const [unit, stuff, who] = c.pick([["pounds", "clay", "friends"], ["liters", "juice", "bottles"], ["meters", "ribbon", "classmates"], ["cups", "flour", "bowls"], ["feet", "rope", "campers"]] as const);
    const q = Math.floor(a / b), r = a % b;
    return { text: `${n} shares ${a} ${unit} of ${stuff} equally among ${b} ${who}. How many ${unit} does each get?`, answer: frac(a, b, true),
      mistakes: [m(frac(b, a), "divided the wrong way round"), m(String(q), "dropped the remainder"), m(`${q}.${r}`, "wrote the remainder after a decimal point"), m(frac(r, b), "gave only the leftover part")] };
  }),
  T("q5-multi-decimals", 5, "5.NBT.A.3b", (c) => {
    const w = c.ri(0, c.by([0, 9, 99])), b = c.ri(2, 7), d = c.ri(2, 8), e = c.ri(1, 9), f = c.ri(1, 9);
    const at = (x: string) => `${w}.${x}`;
    return { text: `Which numbers are greater than ${at(`${b}${d}`)}?`, format: "multi", answer: "",
      right: [at(`${b + 1}`), at(`${b}${d}${e}`), at(`${b + 1}0${f}`)].slice(0, c.ri(2, 3)),
      mistakes: [m(at(`${b}0${e}`), "thought a number with more digits is bigger"), m(at(`${b}${d - 1}${f}`), "compared the last digits"), m(at(`${b - 1}${f}${e}`), "thought more digits make a bigger number"), m(at(`${b}`), "thought fewer digits make a bigger number")] };
  }),
  T("q5-two-box", 5, "5.MD.C.5b", (c) => {
    const l = c.ri(2, c.by([6, 10, 15])), w = c.ri(2, c.by([5, 8, 12])), h = c.ri(2, c.by([5, 8, 10])), k = c.pick([2, 3]);
    const what = c.pick(["toy box", "fish tank", "planter", "storage bin", "sandbox"]);
    return { text: `A ${what} is a rectangular prism ${l} ft long, ${w} ft wide and ${h} ft tall.`, format: "twopart", answer: "", mistakes: [],
      parts: [
        { text: "What is its volume in cubic feet?", answer: l * w * h,
          mistakes: [m(l + w + h, "added the edges"), m(l * w, "found the area of the base only"), m(2 * (l * w + l * h + w * h), "found the surface area")] },
        { text: `A second ${what} is ${k} times as tall, with the same base. What is its volume in cubic feet?`, answer: k * l * w * h,
          mistakes: [m(l * w * h + k, `added ${k}`), m(l * w * (h + k), `added ${k} to the height`), m(k ** 3 * l * w * h, "made every edge longer")] },
      ] };
  }),
  T("q5-cr-recipe", 5, "5.NF.B.6", (c) => {
    const n = c.name(), d = c.pick([2, 3, 4]), u = c.ri(1, d - 1) + d * c.ri(0, 1), k = c.ri(2, c.by([4, 6, 8]));
    const each = frac(u, d, true), need = frac(u * k, d, true), have = c.ri(Math.ceil((u * k) / d) + 1, Math.ceil((u * k) / d) + 8);
    const batches = Math.floor((have * d) / u);
    const what = c.pick(["flour", "sugar", "oats", "milk"]);
    return { text: `A muffin recipe uses ${each} cups of ${what} per batch. ${n} wants to make ${k} batches and has ${have} cups of ${what}.`, format: "cr", answer: "", mistakes: [],
      steps: [`${k} × ${each} = ${need} cups for ${k} batches.`, `${have} ÷ ${each} = ${frac(have * d, u, true)}, so ${have} cups make ${batches} whole batches.`, `Multiplying by a whole number greater than 1 gives more than the fraction you started with.`],
      parts: [
        { text: `How many cups of ${what} do ${k} batches need?`, format: "typein", answer: need,
          mistakes: [m(frac(u + k, d, true), "added the batches to the top number"), m(frac(u, d * k, true), "multiplied the bottom number"), m(frac(u * k, d * k, true), "multiplied the top and the bottom")] },
        { text: `How many whole batches can ${n} make with ${have} cups?`, format: "typein", answer: batches,
          mistakes: [m(batches + 1, "rounded up past what the cups allow"), m(Math.floor(have / u), "divided by the top number only"), m(have * u, "multiplied instead of dividing")] },
        { text: `Why do ${k} batches need more than ${each} cups?`, answer: "Multiplying by a whole number greater than 1 makes the amount bigger.",
          mistakes: [m("Multiplying a fraction always makes it smaller.", "thought fractions shrink when multiplied"), m("The bottom number gets bigger, so the amount gets bigger.", "changed the bottom number"), m(`${k} batches need ${k} cups.`, "counted one cup per batch")] },
      ] };
  }),
  T("q5-cr-trip", 5, "5.NBT.B.6", (c) => {
    const cap = c.pick(c.by([[20, 24, 25, 30], [24, 30, 36, 40], [36, 40, 44, 48]] as const)), t = c.ri(3, 9);
    let s = c.ri(50, c.by([90, 150, 250]));
    if ((s + t) % cap === 0) s++;
    const people = s + t, q = Math.floor(people / cap), r = people % cap, buses = q + 1, empty = buses * cap - people;
    const price = c.ri(4, 12) + c.pick([0.25, 0.5, 0.75]), tp = price + c.pick([1, 2, 2.5]);
    const cost = (x: number) => +x.toFixed(2);
    return { text: `${s} students and ${t} teachers go on a field trip. Each bus holds ${cap} people. A ticket costs $${price.toFixed(2)} for a student and $${tp.toFixed(2)} for a teacher.`, format: "cr", answer: "", mistakes: [],
      steps: [`${people} ÷ ${cap} = ${q} R ${r}.`, `${q} buses are full, and ${r} people still need a seat, so ${buses} buses are needed.`, `Seats: ${buses} × ${cap} = ${buses * cap}, so ${buses * cap} − ${people} = ${empty} seats are empty.`, `Tickets: ${s} × $${price.toFixed(2)} + ${t} × $${tp.toFixed(2)} = $${cost(s * price + t * tp).toFixed(2)}.`],
      parts: [
        { text: "How many buses are needed?", format: "typein", answer: buses,
          mistakes: [m(q, "dropped the remainder"), m(Math.ceil(s / cap) === buses ? q + 2 : Math.ceil(s / cap), "left out the teachers"), m(r, "gave the remainder")] },
        { text: "Which sentence explains the number of buses?", answer: `${people} ÷ ${cap} = ${q} R ${r}, so ${q} buses are full and 1 more bus carries the other ${r} people.`,
          mistakes: [m(`${people} ÷ ${cap} = ${q} R ${r}, so ${q} buses are enough.`, "dropped the remainder"), m(`${people} ÷ ${cap} = ${q} R ${r}, so ${q + r} buses are needed.`, "added the remainder as buses"), m(`Only the students ride, so ${s} ÷ ${cap} buses are needed.`, "left out the teachers")] },
        { text: "How many seats on the buses are empty?", format: "typein", answer: empty,
          mistakes: [m(r, "gave the remainder, not the empty seats"), m(buses * cap, "gave all the seats"), m(empty + cap, "counted one bus too many")] },
        { text: "What do all the tickets cost?", answer: cost(s * price + t * tp), form: "cents",
          mistakes: [m(cost((s + t) * price), "charged everyone the student price"), m(cost(s * price + tp), "paid for only one teacher"), m(cost(s * tp + t * price), "swapped the two prices")] },
      ] };
  }),
];

const G6: Template[] = [
  T("q6-power", 6, "6.EE.A.1", (c) => {
    const b = c.ri(2, c.by([5, 9, 12])), e = c.ri(2, c.by([3, 3, 4]));
    if (c.ri(0, 2) === 0) {
      const k = c.ri(1, 20);
      return { text: `Evaluate ${k} + ${b}^${e}.`, answer: k + b ** e,
        mistakes: [m((k + b) ** e, "added before finding the power"), m(k + b * e, `worked out ${b}^${e} as ${b} × ${e}`), m(k + b + e, "added everything")] };
    }
    return { text: `What is ${b}^${e}?`, answer: b ** e,
      mistakes: [m(b * e, "multiplied the base by the exponent"), m(b + e, "added the base and the exponent"), m(b ** (e - 1), "multiplied one time too few"), m(e ** b, "swapped the base and the exponent")] };
  }),
  T("q6-words", 6, "6.EE.A.2a", (c) => {
    const a = c.ri(2, c.by([5, 9, 12]));
    let k = c.ri(1, c.by([9, 20, 50]));
    if (k === a) k++;
    return c.ri(0, 1)
      ? { text: `Which expression means "${k} less than ${a} times a number n"?`, answer: `${a}n − ${k}`,
          mistakes: [m(`${k} − ${a}n`, "wrote the numbers in the order they were read"), m(`${a}(n − ${k})`, "subtracted before multiplying"), m(`${a} + n − ${k}`, "added instead of multiplying")] }
      : { text: `Which expression means "${a} times the sum of a number n and ${k}"?`, answer: `${a}(n + ${k})`,
          mistakes: [m(`${a}n + ${k}`, "multiplied only n"), m(`${a} + n + ${k}`, "added instead of multiplying"), m(`${k}n + ${a}`, "mixed up the numbers")] };
  }),
  T("q6-equiv", 6, "6.EE.A.3", (c) => {
    const a = c.ri(2, c.by([5, 9, 12])), b = c.ri(1, c.by([9, 12, 20]));
    if (c.ri(0, 1)) return { text: `Which expression is equal to ${a}(n + ${b})?`, answer: `${a}n + ${a * b}`,
      mistakes: [m(`${a}n + ${b}`, "multiplied only the first term"), m(`n + ${a * b}`, "multiplied only the second term"), m(`${a + b}n`, "added the numbers"), m(`${a}n + ${a + b}`, "added instead of multiplying the second term")] };
    const d = c.ri(2, c.by([5, 9, 12])), k = c.ri(1, c.by([9, 12, 20]));
    return { text: `Which expression is equal to ${a}n + ${d}n + ${k}?`, answer: `${a + d}n + ${k}`,
      mistakes: [m(`${a + d + k}n`, "added every number"), m(`${a * d}n + ${k}`, "multiplied the n terms"), m(`${a + d}n`, "dropped the number on its own"), m(`${a + d}n + ${k}n`, "put n on every term")] };
  }),
  T("q6-ineq", 6, "6.EE.B.8", (c) => {
    const [text, v, sign] = c.pick([
      [(h: number) => `Riders must be at least ${h} inches tall. Which inequality shows the heights h that can ride?`, "h", "≥"],
      [(h: number) => `A suitcase can weigh at most ${h} pounds. Which inequality shows the weights w that are allowed?`, "w", "≤"],
      [(h: number) => `More than ${h} people came to the fair. Which inequality shows the number of people p?`, "p", ">"],
      [(h: number) => `${c.name()} read fewer than ${h} pages. Which inequality shows the number of pages p?`, "p", "<"],
      [(h: number) => `A team needs at least ${h} points to win. Which inequality shows the points s that win?`, "s", "≥"],
      [(h: number) => `A bridge holds at most ${h} tons. Which inequality shows the weights t it holds?`, "t", "≤"],
    ] as const);
    const h = c.ri(c.by([10, 20, 40]), c.by([60, 99, 250]));
    const strict: Record<string, string> = { "≥": ">", "≤": "<", ">": "≥", "<": "≤" };
    const flip: Record<string, string> = { "≥": "≤", "≤": "≥", ">": "<", "<": ">" };
    return { text: text(h), answer: `${v} ${sign} ${h}`,
      mistakes: [
        m(`${v} ${strict[sign]} ${h}`, sign === "≥" || sign === "≤" ? "forgot that exactly the number is allowed" : "let the number itself count"),
        m(`${v} ${flip[sign]} ${h}`, "turned the sign around"),
        m(`${v} ${flip[strict[sign]]} ${h}`, "turned the sign around and dropped the line under it"),
      ] };
  }),
  T("q6-equation", 6, "6.EE.C.9", (c) => {
    const n = c.name(), r = c.ri(2, c.by([9, 15, 25])), job = c.pick(["dog walking", "babysitting", "raking leaves", "tutoring", "washing cars"]);
    if (c.ri(0, 1)) return { text: `${n} earns $${r} for each hour of ${job}. Which equation shows the pay p for h hours?`, answer: `p = ${r}h`,
      mistakes: [m(`h = ${r}p`, "swapped the variables"), m(`p = h + ${r}`, "added instead of multiplying"), m(`p = ${r} ÷ h`, "divided instead of multiplying")] };
    let f = c.ri(2, c.by([9, 15, 30]));
    if (f === r) f++;
    return { text: `${n} charges $${f} to show up plus $${r} for each hour of ${job}. Which equation shows the pay p for h hours?`, answer: `p = ${r}h + ${f}`,
      mistakes: [m(`p = ${f}h + ${r}`, "swapped the fee and the hourly rate"), m(`p = ${r + f}h`, "added the fee to the hourly rate"), m(`p = ${r}(h + ${f})`, "multiplied the fee by the rate too")] };
  }),
  T("q6-primes", 6, "6.NS.B.4", (c) => {
    const size = c.by([3, 3, 4]) + (c.tier === 2 ? c.ri(0, 1) : 0);
    const fs = Array.from({ length: size }, () => c.pick([2, 2, 3, 3, 5, 7, 11])).sort((a, b) => a - b);
    const N = fs.reduce((a, b) => a * b, 1), show = (xs: number[]) => xs.join(" × ");
    // Two factors merged into one that is not prime.
    const dup = fs.findIndex((x, i) => i > 0 && fs[i - 1] === x);
    const j = dup > 0 ? dup - 1 : 0;
    const merged = [...fs.slice(0, j), fs[j] * fs[j + 1], ...fs.slice(j + 2)].sort((a, b) => a - b);
    const ask = c.ri(0, 1) ? `Which is the prime factorization of ${N}?` : `${c.name()} writes ${N} as a product of prime numbers. Which is right?`;
    return { text: ask, answer: show(fs),
      mistakes: [m(show(merged), "used a factor that is not prime"), m(show(fs.slice(1)), "left out one of the factors"), m(show([2, ...fs]), "split one factor too many times"), m(show([1, ...fs]), "counted 1 as a prime")] };
  }),
  T("q6-multi-ratio", 6, "6.RP.A.3a", (c) => {
    let a = c.ri(1, 6), b = c.ri(2, 9);
    while (gcd(a, b) !== 1 || a === b) { a = c.ri(1, 6); b = c.ri(2, 9); }
    const [k1, k2] = c.shuffle(c.by([[2, 3, 4], [2, 3, 4, 5, 6], [3, 4, 5, 6, 7, 8]] as const).slice()).slice(0, 2);
    const [x, y] = c.pick([["red", "blue"], ["cats", "dogs"], ["boys", "girls"], ["juice", "water"]] as const);
    return { text: `The ratio of ${x} to ${y} is ${a} : ${b}. Which ratios are equivalent?`, format: "multi", answer: "",
      right: [`${a * k1} : ${b * k1}`, `${a * k2} : ${b * k2}`],
      mistakes: [m(`${a + k1} : ${b + k1}`, "added the same number to both"), m(`${b * k1} : ${a * k1}`, "flipped the ratio"), m(`${a * k2} : ${b}`, "scaled only the first number"), m(`${a + b} : ${b}`, "used the total as a part")] };
  }),
  T("q6-two-budget", 6, "6.RP.A.3b", (c) => {
    const n = c.name(), th = c.thing("school"), k = c.pick([2, 3, 4, 5]), each = c.ri(2, c.by([5, 9, 15])), budget = each * c.ri(6, 20) + c.ri(1, each - 1);
    return { text: `${k} ${th.many} cost $${k * each}. ${n} has $${budget} to spend on ${th.many} at the same price.`, format: "twopart", answer: "", mistakes: [],
      parts: [
        { text: `What is the price of one ${th.one}?`, answer: each, form: "money",
          mistakes: [m(k * each, `gave the price of ${k}`), m(k * each - k, "subtracted instead of dividing"), m(k * each * k, "multiplied instead of dividing")] },
        { text: `What is the greatest number of ${th.many} ${n} can buy?`, answer: Math.floor(budget / each),
          mistakes: [m(Math.floor(budget / each) + 1, "rounded up past the budget"), m(Math.floor(budget / (k * each)), `counted groups of ${k}`), m(budget - each, "subtracted one price")] },
      ] };
  }),
  T("q6-cr-mix", 6, "6.RP.A.3a", (c) => {
    let a = c.ri(1, 4), b = c.ri(2, 7);
    while (gcd(a, b) !== 1 || a === b) { a = c.ri(1, 4); b = c.ri(2, 7); }
    const k = c.ri(2, c.by([5, 8, 12])), t = c.ri(2, c.by([4, 6, 9])), n = c.name();
    // A second mix with a different ratio, to compare.
    const [a2, b2] = c.pick([[a + 1, b], [a, b + 1], [2 * a, 2 * b + 1], [2 * a + 1, 2 * b]]);
    const stronger = a2 / b2 > a / b;
    return { text: `${n} mixes juice and water in the ratio ${a} : ${b}.`, format: "cr", answer: "", mistakes: [],
      steps: [`${a * k} cups of juice is ${k} times ${a}, so the water is ${k} × ${b} = ${b * k} cups.`, `One batch has ${a} + ${b} = ${a + b} cups; ${(a + b) * t} cups is ${t} batches, so the juice is ${t} × ${a} = ${a * t} cups.`, `Compare juice for each cup of water: ${a}/${b} and ${a2}/${b2}.`],
      parts: [
        { text: `${n} uses ${a * k} cups of juice. How many cups of water are needed?`, format: "typein", answer: b * k,
          mistakes: [m(a * k + (b - a), "added the difference instead of scaling"), m(b * a * k, "multiplied by the juice"), m(k, "found the scale factor only")] },
        { text: `${n} makes ${(a + b) * t} cups of the drink in all. How many cups are juice?`, format: "typein", answer: a * t,
          mistakes: [m(b * t, "found the water"), m(t, "found the number of batches"), m(((a + b) * t) / 2, "split the drink in half")] },
        { text: `A friend mixes juice and water ${a2} : ${b2}. Whose drink tastes more of juice?`, answer: stronger ? "The friend's" : `${n}'s`,
          mistakes: [m(stronger ? `${n}'s` : "The friend's", "compared the numbers of cups, not the ratios"), m("They taste the same", "thought adding one to a ratio keeps it the same"), m("You can't tell", "did not compare juice per cup of water")] },
      ] };
  }),
  T("q6-cr-savings", 6, "6.EE.C.9", (c) => {
    const n = c.name(), r = c.ri(2, c.by([6, 12, 25])), k = c.ri(3, c.by([8, 12, 20])), x = c.ri(3, c.by([8, 12, 20]));
    let s = c.ri(5, c.by([20, 40, 80]));
    if (s === r) s++;
    const goal = s + r * (x - 1) + c.ri(1, r - 1);
    return { text: `${n} has $${s} saved and adds $${r} every week.`, format: "cr", answer: "", mistakes: [],
      steps: [`After w weeks: t = ${r}w + ${s}.`, `The total depends on the number of weeks, so w is the independent variable and t is the dependent one.`, `After ${k} weeks: ${r} × ${k} + ${s} = ${s + r * k}.`, `${r}w + ${s} ≥ ${goal} means ${r}w ≥ ${goal - s}, and ${goal - s} ÷ ${r} = ${+((goal - s) / r).toFixed(2)}, so ${n} needs ${x} weeks.`],
      parts: [
        { text: "Which equation gives t, the total saved after w weeks?", answer: `t = ${r}w + ${s}`,
          mistakes: [m(`t = ${s}w + ${r}`, "swapped the starting amount and the weekly amount"), m(`t = ${r + s}w`, "added the two amounts"), m(`t = ${r}w`, "left out the starting amount")] },
        { text: "Which is the independent variable?", answer: "w, the number of weeks",
          mistakes: [m("t, the total saved", "mixed up independent and dependent"), m(`${r}, the amount added each week`, "picked a number that stays the same"), m(`${s}, the starting amount`, "picked a number that stays the same")] },
        { text: `How much will ${n} have after ${k} weeks?`, format: "typein", answer: s + r * k,
          mistakes: [m(r * k, "left out the starting amount"), m((r + s) * k, "added the starting amount every week"), m(s + r * (k - 1), "counted one week too few")] },
        { text: `${n} wants $${goal}. After how many weeks will ${n} first have enough?`, format: "typein", answer: x,
          mistakes: [m(x - 1, "dropped the remainder"), m(Math.ceil(goal / r), "forgot the starting amount"), m(goal - s, "forgot to divide")] },
      ] };
  }),
];

const G7: Template[] = [
  T("q7-tri-sides", 7, "7.G.A.2", (c) => {
    const hi = c.by([10, 20, 40]);
    const tri = () => {
      for (;;) {
        const a = c.ri(2, hi), b = c.ri(2, hi), d = c.ri(Math.abs(a - b) + 1, a + b - 1);
        if (d >= 2) return [a, b, d].sort((x, y) => x - y);
      }
    };
    const a = c.ri(2, hi), b = c.ri(2, hi), bad = [a, b, a + b + c.ri(0, 5)].sort((x, y) => x - y);
    const show = (xs: number[]) => xs.map((x) => `${x} cm`).join(", ");
    const seen = new Set([show(bad)]);
    const goods: string[] = [];
    while (goods.length < 3) { const s = show(tri()); if (!seen.has(s)) { seen.add(s); goods.push(s); } }
    return { text: `${c.name()} has straws of three lengths. Which set of lengths can NOT make a triangle?`, answer: show(bad),
      mistakes: [m(goods[0], "checked only two of the sides"), m(goods[1], "thought the longest side was too long"), m(goods[2], "thought the sides had to be close in length")] };
  }),
  T("q7-compound", 7, "7.SP.C.8", (c) => {
    const s = c.ri(2, c.by([3, 4, 6])), colors = ["red", "blue", "green", "yellow", "purple", "orange"].slice(0, s), col = c.pick(colors);
    const [event, k] = c.pick([["an even number", 3], ["an odd number", 3], ["a number less than 3", 2], ["a number greater than 4", 2], ["a 6", 1], ["a multiple of 3", 2], ["a number less than 5", 4]] as const);
    const total = s * 6;
    return { text: `A spinner has ${s} equal sections colored ${colors.slice(0, -1).join(", ")} and ${colors[s - 1]}. ${c.name()} spins it once and rolls a number cube once. What is the probability of landing on ${col} and rolling ${event}?`, answer: frac(k, total),
      mistakes: [m(frac(6 + s * k, total), "added the two probabilities"), m(frac(k, 6), "ignored the spinner"), m(frac(1 + k, s + 6), "added the counts top and bottom"), m(frac(1, s), "ignored the number cube")] };
  }),
  T("q7-multi-sign", 7, "7.NS.A.2", (c) => {
    const v = () => c.ri(2, c.by([9, 12, 15]));
    const neg = [`(−${v()}) × ${v()}`, `${v()} × (−${v()})`, `(−${v()}) × (−${v()}) × (−${v()})`, `(−${v()}) ÷ ${v()}`];
    const pos = [`(−${v()}) × (−${v()})`, `(−${v()}) ÷ (−${v()})`, `(−${v()}) × (−${v()}) × ${v()}`, `${v()} × ${v()}`];
    const [want, other] = c.ri(0, 1) ? [neg, pos] : [pos, neg];
    const right = c.shuffle(want).slice(0, c.ri(2, 3));
    return { text: `Which of these have a ${want === neg ? "negative" : "positive"} value?`, format: "multi", answer: "", negatives: true, right,
      mistakes: c.shuffle(other).map((e) => m(e, want === neg ? "thought every minus sign makes it negative" : "thought any minus sign makes it negative")) };
  }),
  T("q7-two-sale", 7, "7.RP.A.3", (c) => {
    const p = c.pick([20, 40, 50, 60, 80, 120, 150, 200]), d = c.pick([10, 20, 25, 30, 40, 50]), t = c.pick([5, 6, 8, 10]), what = c.pick(["jacket", "backpack", "scooter", "board game", "pair of headphones"]);
    const sale = (p * (100 - d)) / 100, total = +(sale * (1 + t / 100)).toFixed(2);
    return { text: `A ${what} costs $${p}. It is on sale for ${d}% off, then ${t}% sales tax is added to the sale price.`, format: "twopart", answer: "", mistakes: [],
      parts: [
        { text: "What is the sale price before tax?", answer: sale, form: "cents",
          mistakes: [m((p * d) / 100, "gave the discount, not the price"), m(p - d, "took off dollars, not percent"), m(p + (p * d) / 100, "added the discount")] },
        { text: "What is the total with tax?", answer: total, form: "cents",
          mistakes: [m(+(p * (1 + t / 100)).toFixed(2), "added tax to the full price"), m(+(sale + t).toFixed(2), "added the tax as dollars"), m(+(p * (1 + (t - d) / 100)).toFixed(2), "added and took off the percents together")] },
      ] };
  }),
  T("q7-cr-rides", 7, "7.EE.B.4", (c) => {
    const n = c.name(), r = c.ri(2, c.by([4, 6, 9])), x = c.ri(3, c.by([8, 12, 20]));
    let f = c.ri(5, c.by([12, 20, 30]));
    if (f === r) f++;
    const T = f + r * x, budget = T + c.ri(1, r - 1) + r * c.ri(0, 3);
    const most = Math.floor((budget - f) / r);
    return { text: `A fair charges $${f} to get in plus $${r} for each ride.`, format: "cr", answer: "", mistakes: [],
      steps: [`Cost for x rides: ${f} + ${r}x.`, `${f} + ${r}x = ${T}, so ${r}x = ${T - f} and x = ${x}.`, `${f} + ${r}x ≤ ${budget}, so ${r}x ≤ ${budget - f} and x ≤ ${+((budget - f) / r).toFixed(2)}. The greatest whole number is ${most}.`],
      parts: [
        { text: `Which equation shows ${n} spending $${T} on x rides?`, answer: `${f} + ${r}x = ${T}`,
          mistakes: [m(`${r} + ${f}x = ${T}`, "swapped the entry fee and the ride price"), m(`${f + r}x = ${T}`, "added the fee to the ride price"), m(`${r}x = ${T}`, "left out the entry fee")] },
        { text: `How many rides did ${n} go on?`, format: "typein", answer: x,
          mistakes: [m((T + f) / r, "added the fee instead of subtracting"), m(Math.round(T / r), "forgot the entry fee"), m(T - f, "forgot to divide")] },
        { text: `A friend has $${budget}. What is the greatest number of rides the friend can go on?`, format: "typein", answer: most,
          mistakes: [m(most + 1, "rounded up past the budget"), m(Math.floor(budget / r), "forgot the entry fee"), m(budget - f, "forgot to divide")] },
      ] };
  }),
  T("q7-cr-bag", 7, "7.SP.C.7a", (c) => {
    const hi = c.by([5, 8, 12]), red = c.ri(1, hi), blue = c.ri(1, hi), green = c.ri(1, hi), all = red + blue + green, k = c.ri(2, c.by([4, 6, 10]));
    const n = c.name(), picks = all * k, expect = red * k, got = Math.max(0, expect + c.pick([-3, -2, -1, 1, 2, 3]));
    return { text: `A bag has ${red} red, ${blue} blue and ${green} green marbles. ${n} picks one without looking.`, format: "cr", answer: "", mistakes: [],
      steps: [`There are ${red} + ${blue} + ${green} = ${all} marbles, so P(red) = ${frac(red, all)}.`, `In ${picks} picks (putting the marble back each time): ${frac(red, all)} × ${picks} = ${expect} red.`, "Chance results are usually close to the prediction, not exactly on it.", `P(not green) = (${red} + ${blue}) ÷ ${all} = ${frac(red + blue, all)}.`],
      parts: [
        { text: "What is the probability of picking a red marble?", answer: frac(red, all),
          mistakes: [m(frac(red, all - red), "compared red with the other marbles"), m(frac(all - red, all), "found the chance of not red"), m("1/3", "thought each color is equally likely")] },
        { text: `${n} picks a marble and puts it back, ${picks} times in all. About how many times should a red marble come up?`, format: "typein", answer: expect,
          mistakes: [m(red, "gave the number of red marbles"), m(picks - expect, "counted the other colors"), m(Math.round(picks / 3), "thought each color is equally likely")] },
        { text: `Red actually came up ${got} times. Which sentence is true?`, answer: "Chance results are usually close to the prediction, but not exactly on it.",
          mistakes: [m("The probability must be wrong, since the results did not match.", "expected chance to match exactly"), m(`${n} must have counted wrong; it should be exactly ${expect}.`, "expected chance to match exactly"), m("Each color should come up the same number of times.", "thought each color is equally likely")] },
        { text: "What is the probability of picking a marble that is not green?", answer: frac(red + blue, all),
          mistakes: [m(frac(green, all), "found the chance of green"), m(frac(red * blue, all * all), "multiplied the chances"), m(frac(red + blue, all + green), "added the green marbles to the bottom")] },
      ] };
  }),
];

const G8: Template[] = [
  T("q8-angles", 8, "8.G.A.5", (c) => {
    if (c.ri(0, 1)) {
      const a = c.ri(25, 80), b = c.ri(25, 150 - a);
      return { text: `Two angles of a triangle are ${a}° and ${b}°. What is the exterior angle at the third corner?`, answer: a + b,
        mistakes: [m(180 - a - b, "found the third angle inside the triangle"), m(360 - a - b, "took the angles from 360°"), m(180 - a, "used only one angle")] };
    }
    const x = c.ri(35, 145);
    if (x === 90) return { text: "Two parallel lines are cut by a transversal. One angle is 90°. What is the corresponding angle?", answer: 90,
      mistakes: [m(180, "added the angles"), m(270, "took the angle from 360°"), m(45, "halved the angle")] };
    const [rel, ans] = c.pick([["alternate interior angle", x], ["corresponding angle", x], ["same-side interior angle", 180 - x], ["angle next to it on the same line", 180 - x]] as const);
    return { text: `Two parallel lines are cut by a transversal. One angle is ${x}°. What is the measure of its ${rel}?`, answer: ans,
      mistakes: [m(ans === x ? 180 - x : x, ans === x ? "thought the angles add to 180°" : "thought the angles are equal"), m(Math.abs(90 - x), "thought the angles add to 90°"), m(360 - x, "took the angle from 360°")] };
  }),
  T("q8-transform", 8, "8.G.A.3", (c) => {
    const hi = c.by([6, 9, 15]);
    const x = c.ri(1, hi) * (c.ri(0, 1) ? 1 : -1);
    let y = c.ri(1, hi) * (c.ri(0, 1) ? 1 : -1);
    if (Math.abs(x) === Math.abs(y)) y = y > 0 ? y + 1 : y - 1;
    const p = c.pick(["A", "B", "P", "Q"]);
    const kind = c.ri(0, 3);
    if (kind === 3) {
      const a = c.ri(-hi, hi) || 2;
      let b = c.ri(-hi, hi) || -3;
      if (b === a) b = -a;
      const move = `${Math.abs(a)} unit${Math.abs(a) === 1 ? "" : "s"} ${a > 0 ? "right" : "left"} and ${Math.abs(b)} unit${Math.abs(b) === 1 ? "" : "s"} ${b > 0 ? "up" : "down"}`;
      return { text: `Point ${p} is at ${pt(x, y)}. It is translated ${move}. Where does it land?`, answer: pt(x + a, y + b), negatives: true,
        mistakes: [m(pt(x + b, y + a), "mixed up the across and up moves"), m(pt(x - a, y - b), "moved the wrong way"), m(pt(a, b), "gave the move, not the new point"), m(pt(x + a, y), "forgot the up or down move")] };
    }
    const [how, ans] = ([["reflected over the x-axis", pt(x, -y)], ["reflected over the y-axis", pt(-x, y)], ["rotated 180° about the origin", pt(-x, -y)]] as const)[kind];
    const all = [pt(x, -y), pt(-x, y), pt(-x, -y), pt(y, x)];
    const whys = ["changed the sign of y only", "changed the sign of x only", "changed both signs", "swapped the coordinates"];
    return { text: `Point ${p} is at ${pt(x, y)}. It is ${how}. Where does it land?`, answer: ans, negatives: true,
      mistakes: all.map((v, i) => m(v, whys[i])).filter((mk) => mk.value !== ans) };
  }),
  T("q8-dilate", 8, "8.G.A.3", (c) => {
    const k = c.by([2, c.pick([2, 3]), c.pick([3, 4, 5])]), x = c.ri(1, c.by([10, 10, 12])), y = c.ri(1, c.by([10, 10, 12]));
    const yy = y === x ? y + 1 : y;
    return { text: `A triangle has a corner at ${pt(x, yy)}. It is dilated by a scale factor of ${k} with the center at the origin. Where does that corner land?`, answer: pt(k * x, k * yy),
      mistakes: [m(pt(x + k, yy + k), "added the scale factor"), m(pt(k * x, yy), "scaled only the x-coordinate"), m(pt(x, k * yy), "scaled only the y-coordinate"), m(pt(k * yy, k * x), "swapped the coordinates")] };
  }),
  T("q8-linear", 8, "8.F.A.3", (c) => {
    const a = c.ri(2, 9), b = c.ri(1, 12), d = c.ri(2, 9), e = c.ri(1, 15), f = c.ri(2, 9), k = c.ri(1, 12);
    const odd = c.pick([`y = x² + ${k}`, `y = ${k}/x`, `y = ${f}x² − ${k}`, `y = ${f}x³`]);
    return { text: "Which equation does NOT describe a linear function?", answer: odd,
      mistakes: [m(`y = ${a}x + ${b}`, "thought adding a number makes it curve"), m(`y = ${d}x`, "thought a line must not go through (0, 0)"), m(`y = ${e} − ${f}x`, "thought a minus sign makes it nonlinear")] };
  }),
  T("q8-fn-compare", 8, "8.F.A.2", (c) => {
    const a = c.ri(2, c.by([5, 8, 12]));
    let d = c.ri(2, c.by([5, 8, 12]));
    if (a === d) d = a + 1;
    // The slower function starts higher, so comparing starting values gives the wrong answer.
    const lo = c.ri(0, 10), hi = lo + c.ri(5, 20);
    const [b, s] = a > d ? [lo, hi] : [hi, lo];
    const aWins = a > d;
    return { text: `Function A is y = ${a}x + ${b}. Function B is shown in the table. Which function has the greater rate of change?`,
      figure: { t: "table", head: ["x", "y"], rows: [0, 1, 2, 3].map((x) => [x, s + d * x]) },
      answer: aWins ? "Function A" : "Function B",
      mistakes: [m(aWins ? "Function B" : "Function A", "compared the starting values"), m("They are the same", "thought every straight line has the same rate"), m("It can't be told from a table", "did not find the change from one row to the next")] };
  }),
  T("q8-model", 8, "8.F.B.4", (c) => {
    const r = c.ri(2, c.by([9, 15, 30])), W = r * c.ri(c.by([5, 10, 20]), c.by([20, 40, 60]));
    if (c.ri(0, 1)) return { text: `A tank holds ${W} liters and drains ${r} liters each minute. Which equation gives the liters y left after x minutes?`, answer: `y = ${W} − ${r}x`,
      mistakes: [m(`y = ${W} + ${r}x`, "added the water that drains"), m(`y = ${r}x − ${W}`, "swapped the start and the rate"), m(`y = ${W}x − ${r}`, "multiplied the start by the time")] };
    const n = c.name(), S = r + c.ri(1, c.by([30, 80, 200]));
    return { text: `${n} has $${S} saved and adds $${r} every week. Which equation gives the savings y after x weeks?`, answer: `y = ${r}x + ${S}`,
      mistakes: [m(`y = ${S}x + ${r}`, "swapped the start and the rate"), m(`y = ${r + S}x`, "added the start to the rate"), m(`y = ${r}x − ${S}`, "took the savings away")] };
  }),
  T("q8-sci-div", 8, "8.EE.A.4", (c) => {
    const [a, b] = c.pick([[2, 2], [2, 3], [2, 4], [3, 3], [3, 2], [4, 2], [2, 1.5], [1.5, 4], [2.5, 2], [3, 1.5]] as const);
    const q = c.ri(2, c.by([4, 6, 9])), p = q + c.ri(2, c.by([4, 6, 9]));
    return { text: `(${+(a * b).toFixed(1)} × 10^${p}) ÷ (${b} × 10^${q}) = ${a} × 10^n. What is n?`, answer: p - q,
      mistakes: [m(p + q, "added the exponents"), m(p, "kept the first exponent"), m(p * q, "multiplied the exponents"), m(Math.round(p / q), "divided the exponents")] };
  }),
  T("q8-multi-powers", 8, "8.EE.A.1", (c) => {
    const b = c.pick([2, 3, 5, 10]), n = c.pick(c.by([[6, 8], [6, 8, 10, 12], [8, 10, 12, 15]] as const)), a = c.ri(2, n - 2);
    const half = n % 2 === 0 ? `(${b}^2)^${n / 2}` : `(${b}^3)^${n / 3}`;
    return { text: `Which expressions are equal to ${b}^${n}?`, format: "multi", answer: "",
      right: [`${b}^${a} × ${b}^${n - a}`, half, `${b}^${n + 2} ÷ ${b}^2`],
      mistakes: [m(`${b}^${a} × ${b}^${n}`, "multiplied by an extra power"), m(`(${b}^${a})^${n - a}`, "multiplied exponents that should be added"), m(`${b}^${n + 2} ÷ ${b}^${n - 2}`, "took away the wrong exponent"), m(`${b}^${a} + ${b}^${n - a}`, "added instead of multiplying")] };
  }),
  T("q8-two-plans", 8, "8.EE.C.8", (c) => {
    const r2 = c.ri(2, c.by([6, 10, 15])), r1 = r2 + c.ri(1, c.by([4, 6, 9])), x = c.ri(2, c.by([6, 10, 15])), f1 = c.ri(5, 40), f2 = f1 + (r1 - r2) * x;
    const what = c.pick([["gym", "month", "months"], ["streaming service", "month", "months"], ["art class", "week", "weeks"], ["bike rental", "day", "days"]] as const);
    return { text: `Plan A for a ${what[0]} costs $${f1} to join plus $${r1} a ${what[1]}. Plan B costs $${f2} to join plus $${r2} a ${what[1]}.`, format: "twopart", answer: "", mistakes: [],
      parts: [
        { text: `After how many ${what[2]} do the two plans cost the same?`, answer: x,
          mistakes: [m(Math.round((f1 + f2) / (r1 + r2)), "added the rates instead of subtracting"), m(f2 - f1, "found the difference in joining fees only"), m(x + 1, "counted one too many")] },
        { text: "What is the cost of each plan then?", answer: f1 + r1 * x, form: "money",
          mistakes: [m(f1 + r2 * x, "mixed up the plans"), m(r1 * x, "left out the joining fee"), m(f1 + f2 + (r1 + r2) * x, "added both plans together")] },
      ] };
  }),
  T("q8-cr-table", 8, "8.F.B.4", (c) => {
    const rate = c.ri(2, c.by([5, 9, 15])), step = c.pick([1, 2]), xs = [1, 2, 3, 4].map((i) => i * step), big = c.ri(10, c.by([20, 40, 60]));
    let start = c.ri(5, c.by([20, 40, 80]));
    if (start === rate) start++;
    const [what, unit] = c.pick([["A plant's height", "cm after x weeks"], ["A savings account", "dollars after x weeks"], ["A tank filling up", "liters after x minutes"], ["A stack of cups", "cm tall with x extra cups"]] as const);
    const y = (x: number) => start + rate * x;
    return { text: `${what} is shown in the table (y is the ${unit}).`, format: "cr", answer: "", mistakes: [],
      figure: { t: "table", head: ["x", "y"], rows: xs.map((x) => [x, y(x)]) },
      steps: [`Rate of change: (${y(xs[1])} − ${y(xs[0])}) ÷ (${xs[1]} − ${xs[0]}) = ${rate}.`, `Initial value: go back to x = 0: ${y(xs[0])} − ${rate} × ${xs[0]} = ${start}.`, `y = ${rate}x + ${start}.`, `At x = ${big}: y = ${rate} × ${big} + ${start} = ${y(big)}.`],
      parts: [
        { text: "What is the rate of change?", format: "typein", answer: rate, negatives: true,
          mistakes: [m(-rate, "subtracted in the wrong order"), m(y(xs[1]) - y(xs[0]), "did not divide by the change in x"), m(y(xs[0]), "gave a y-value")] },
        { text: "What is the initial value (y when x = 0)?", format: "typein", answer: start,
          mistakes: [m(y(xs[0]), "gave the first y in the table"), m(start + rate, "went back one step too few"), m(start - rate, "went back one step too many")] },
        { text: "Which equation fits the table?", answer: `y = ${rate}x + ${start}`,
          mistakes: [m(`y = ${start}x + ${rate}`, "swapped the rate and the start"), m(`y = ${rate}x + ${y(xs[0])}`, "used the first y as the start"), m(`y = ${rate}x`, "left out the initial value"), m(`y = x + ${start}`, "left out the rate")] },
        { text: `What is y when x = ${big}?`, format: "typein", answer: y(big),
          mistakes: [m(start + rate, "forgot to multiply by x"), m(rate * big, "left out the start"), m(y(xs[0]) + rate * big, "started from the first row, not x = 0")] },
      ] };
  }),
  T("q8-cr-ramp", 8, "8.G.B.7", (c) => {
    const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]] as const;
    const s = c.ri(1, c.by([2, 3, 4])), [p, q, hyp] = c.pick(triples).map((x) => x * s), [a, b] = c.shuffle([p, q]);
    const [x, y, z] = c.pick(triples), yes = c.ri(0, 1) === 1, z2 = yes ? z : z + 1;
    const right = yes ? `Yes, because ${x}² + ${y}² = ${z2}².` : `No, because ${x}² + ${y}² ≠ ${z2}².`;
    return { text: `A ramp rises ${a} feet over a flat distance of ${b} feet.`, format: "cr", answer: "", mistakes: [],
      steps: [`The ramp is the hypotenuse: ${a}² + ${b}² = c².`, `${a * a} + ${b * b} = ${hyp * hyp}, so c = ${hyp} feet.`, `For the second ramp: ${b}² = ${hyp}² − ${a}², so it rises ${b} feet.`, `${x}² + ${y}² = ${x * x + y * y} and ${z2}² = ${z2 * z2}, so ${yes ? "it is" : "it is not"} a right triangle.`],
      parts: [
        { text: "Which equation finds c, the length of the ramp?", answer: `${a}² + ${b}² = c²`,
          mistakes: [m(`${a} + ${b} = c`, "added the sides without squaring"), m(`${a}² + c² = ${b}²`, "treated the ramp as a leg"), m(`${Math.max(a, b)}² − ${Math.min(a, b)}² = c²`, "subtracted the squares")] },
        { text: "How long is the ramp, in feet?", format: "typein", answer: hyp,
          mistakes: [m(a + b, "added the sides"), m(a * a + b * b, "forgot the square root"), m(Math.round(Math.sqrt(Math.abs(a * a - b * b))), "subtracted the squares")] },
        { text: `A second ramp is also ${hyp} feet long but covers a flat distance of ${a} feet. How high does it rise?`, format: "typein", answer: b,
          mistakes: [m(hyp - a, "subtracted the sides without squaring"), m(hyp * hyp - a * a, "forgot the square root"), m(Math.round(Math.sqrt(hyp * hyp + a * a)), "added the squares")] },
        { text: `Is a triangle with sides ${x}, ${y} and ${z2} feet a right triangle?`, answer: right,
          mistakes: [m(yes ? `No, because ${x}² + ${y}² ≠ ${z2}².` : `Yes, because ${x}² + ${y}² = ${z2}².`, "squared and added wrong"), m(`Yes, because ${x} + ${y} > ${z2}.`, "checked that it is a triangle, not that it is right"), m("No, because its sides are not 3, 4 and 5.", "thought 3, 4, 5 is the only right triangle")] },
      ] };
  }),
];

export const MCAS_QUICK: Partial<Record<Grade, Template[]>> = { 3: G3, 4: G4, 5: G5, 6: G6, 7: G7, 8: G8 };
