/**
 * Kindergarten quick-fire templates: counting to 100, counting how many, comparing,
 * number bonds and making 10, adding and taking away within 10, teen numbers, shapes,
 * and measuring and sorting. Each is tagged with its Common Core K code.
 *
 * Questions are short enough to be read aloud, and most come with pictures to count
 * (a `pics` figure), a ten frame or a shape, so a child who cannot read yet can still
 * answer. Answers are always tapped, never typed (see `ways` in formats.ts).
 */
import type { Shape, ShapeColor } from "./figures";
import type { Question } from "./questions";
import { helpers, type Rng } from "./rng";
import { render, type Ctx, type Draft, type Mistake, type Template, type Tier } from "./templates";

const T = (id: string, std: string, make: (c: Ctx) => Draft, tier: Tier = 1): Template => ({ id, grade: 0, std, tier, make });
const m = (value: number | string, why: string): Mistake => ({ value, why });

/** Something to count, drawn as an emoji. */
interface Pic {
  icon: string;
  one: string;
  many: string;
}
const p = (icon: string, one: string, many = one + "s"): Pic => ({ icon, one, many });

export const PICS: Pic[] = [
  p("🍎", "apple"), p("⭐", "star"), p("🦆", "duck"), p("⚽", "ball"), p("🐟", "fish", "fish"), p("🌸", "flower"),
  p("🚗", "car"), p("🍪", "cookie"), p("🐝", "bee"), p("🐸", "frog"), p("🎈", "balloon"), p("🧁", "cupcake"),
  p("🍓", "strawberry", "strawberries"), p("🦋", "butterfly", "butterflies"), p("🐶", "puppy", "puppies"), p("🐱", "kitten"),
];

/** `k` different pictures. */
const pics = (c: Ctx, k: number) => c.shuffle([...PICS]).slice(0, k);
const row = (pic: Pic, n: number, extra: { label?: string; gone?: number } = {}) => ({ icons: Array<string>(n).fill(pic.icon), ...extra });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "1 apple" or "3 apples". */
const count = (n: number, pic: { one: string; many: string }) => `${n} ${n === 1 ? pic.one : pic.many}`;

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
/** Digits a young child mixes up because they look alike. */
const LOOKS_LIKE: Record<number, number> = { 0: 8, 1: 7, 2: 5, 3: 8, 4: 9, 5: 2, 6: 9, 7: 1, 8: 3, 9: 6, 10: 1 };

const COLORS: ShapeColor[] = ["red", "blue", "green", "yellow", "purple", "orange"];
const SIDES: Partial<Record<Shape, number>> = { triangle: 3, square: 4, rectangle: 4, hexagon: 6 };
const FLAT: Shape[] = ["circle", "square", "triangle", "rectangle", "hexagon"];
/** Why a child might give one flat shape's name for another. */
const MIXUP: Record<string, string> = {
  circle: "picked a round shape, but a circle has no corners",
  square: "picked a square, but a square has 4 sides that are all the same length",
  triangle: "picked a triangle, but a triangle has 3 sides",
  rectangle: "picked a rectangle, but a rectangle has 2 long sides and 2 short sides",
  hexagon: "picked a hexagon, but a hexagon has 6 sides",
};

const SOLIDS = ["sphere", "cube", "cone", "cylinder"] as const;
/** Things around us and the shape each is like. */
const OBJECTS: [string, (typeof SOLIDS)[number], string][] = [
  ["a beach ball", "sphere", "circle"], ["an orange", "sphere", "circle"], ["a globe", "sphere", "circle"],
  ["a sugar cube", "cube", "square"], ["an ice cube", "cube", "square"], ["a toy block", "cube", "square"],
  ["an ice cream cone", "cone", "triangle"], ["a party hat", "cone", "triangle"], ["a traffic cone", "cone", "triangle"],
  ["a soup can", "cylinder", "rectangle"], ["a drum", "cylinder", "circle"], ["a candle", "cylinder", "rectangle"],
];

const AWAY = [
  { pic: p("🐦", "bird"), go: ["flies away", "fly away"] }, { pic: p("🦆", "duck"), go: ["swims away", "swim away"] },
  { pic: p("🐸", "frog"), go: ["hops away", "hop away"] }, { pic: p("🐝", "bee"), go: ["buzzes away", "buzz away"] },
  { pic: p("🎈", "balloon"), go: ["floats away", "float away"] }, { pic: p("🍪", "cookie"), go: ["gets eaten", "get eaten"] },
  { pic: p("🐰", "bunny", "bunnies"), go: ["hops away", "hop away"] }, { pic: p("🦋", "butterfly", "butterflies"), go: ["flies away", "fly away"] },
];

const LONG = ["pencil", "crayon", "straw", "ribbon", "spoon", "worm", "snake", "train", "rope", "scarf"];

export const K: Template[] = [
  T("k-count", "K.CC.B.5", (c) => {
    const n = c.n([[1, 5], [4, 10], [8, 20]]), [pic] = pics(c, 1);
    return {
      text: `How many ${pic.many} are there? Count them.`, answer: n, figure: { t: "pics", rows: [row(pic, n)] },
      steps: [`Touch each ${pic.one} once as you count.`, `The last number you say tells how many: ${n}.`],
      mistakes: [m(n - 1, `missed one ${pic.one}`), m(n + 1, `counted one ${pic.one} twice`), m(n - 2, `missed two ${pic.many}`), m(n + 2, `counted two ${pic.many} twice`)],
    };
  }, 0),
  T("k-next", "K.CC.A.2", (c) => {
    const s = c.n([[1, 6], [5, 16], [20, 96]]), name = c.name();
    return {
      text: `${name} counts: ${s}, ${s + 1}, ${s + 2}. What number comes next?`, answer: s + 3,
      steps: [`After ${s + 2} comes ${s + 3}.`],
      mistakes: [m(s + 2, "said the last number again"), m(s + 4, "skipped a number"), m(s + 1, "counted back"), m(s + 13, "jumped ahead ten")],
    };
  }),
  T("k-tens", "K.CC.A.1", (c) => {
    const k = c.ri(1, 7), name = c.name(), [a, b, d] = [k, k + 1, k + 2].map((x) => 10 * x);
    return {
      text: `${name} counts by tens: ${a}, ${b}, ${d}. What number comes next?`, answer: d + 10,
      steps: [`Counting by tens adds one ten each time: ${d} and 10 more is ${d + 10}.`],
      mistakes: [m(d + 1, "counted on by one, not by ten"), m(d, "said the last number again"), m(d + 20, "skipped a ten"), m(k + 3, "counted the tens, not the number")],
    };
  }),
  T("k-numeral", "K.CC.A.3", (c) => {
    const n = c.n([[0, 10], [0, 10], [11, 20]]);
    const teen = n > 10 ? [m(Number(String(n).split("").reverse().join("")), "wrote the digits the wrong way round"), m(n - 10, "left out the ten")] : [m(LOOKS_LIKE[n], "picked a number that looks alike")];
    return {
      text: `Which number is ${WORDS[n]}?`, answer: n, ask: "Find the number.",
      mistakes: [...teen, m(n + 1, "picked the number after"), m(n - 1, "picked the number before"), m(n + 2, "picked a number two after")],
    };
  }),
  T("k-more", "K.CC.C.6", (c) => {
    const ps = pics(c, 3), ns = c.shuffle(Array.from({ length: c.by([5, 8, 10]) }, (_, i) => i + 1)).slice(0, 3), most = c.ri(0, 1) === 1;
    const best = ns.indexOf(most ? Math.max(...ns) : Math.min(...ns));
    const label = (i: number) => cap(ps[i].many);
    return {
      text: `Which group has the ${most ? "most" : "fewest"}?`, answer: label(best),
      figure: { t: "pics", rows: ps.map((pic, i) => row(pic, ns[i], { label: label(i) })) },
      steps: [`Count each group: ${ps.map((pic, i) => count(ns[i], pic)).join(", ")}.`, `${ns[best]} is the ${most ? "greatest" : "least"}, so the ${ps[best].many} have the ${most ? "most" : "fewest"}.`],
      mistakes: [...[0, 1, 2].filter((i) => i !== best).map((i) => m(label(i), `picked the ${ps[i].many}, which have ${ns[i]}`)), m("They are all the same", "did not count the groups")],
    };
  }),
  T("k-greatest", "K.CC.C.7", (c) => {
    // On the easy tier the numbers are at least 2 apart.
    const pool = Array.from({ length: c.by([10, 10, 20]) }, (_, i) => i + 1);
    let ns: number[];
    do ns = c.shuffle([...pool]).slice(0, 4).sort((a, b) => a - b);
    while (c.tier === 0 && ns.some((x, i) => i > 0 && x - ns[i - 1] < 2));
    const most = c.ri(0, 1) === 1, answer = most ? ns[3] : ns[0];
    return {
      text: `Which number is the ${most ? "greatest" : "least"}?`, answer,
      steps: [most ? `${answer} comes last when you count, so it is the greatest.` : `${answer} comes first when you count, so it is the least.`],
      mistakes: ns.filter((x) => x !== answer).map((x) => m(x, x === (most ? ns[0] : ns[3]) ? `picked the ${most ? "least" : "greatest"} number` : "did not check every number")),
    };
  }),
  T("k-bond", "K.OA.A.3", (c) => {
    const w = c.n([[3, 5], [5, 10], [7, 10]]), a = c.ri(1, w - 1), name = c.name(), [pic] = pics(c, 1);
    return {
      text: `${name} puts ${w} ${pic.many} in two baskets. ${count(a, pic)} ${a === 1 ? "goes" : "go"} in the first basket. How many go in the second basket?`,
      answer: w - a, model: { t: "bond", w, p: [a, null] },
      steps: [`${w} is made of ${a} and ${w - a}.`, `${a} + ${w - a} = ${w}.`],
      mistakes: [m(w + a, "added the numbers"), m(a, "gave the first basket"), m(w, "gave all the " + pic.many), m(w - a + 1, "counted on one too many")],
    };
  }),
  T("k-make10", "K.OA.A.4", (c) => {
    const n = c.n([[5, 9], [3, 9], [1, 9]]), name = c.name();
    return {
      text: `${name} puts dots in a ten frame. How many more dots are needed to make 10?`, answer: 10 - n,
      figure: { t: "frame", filled: n, frames: 1 },
      steps: [`There are ${n} dots and ${10 - n} empty boxes.`, `${n} and ${10 - n} make 10.`],
      mistakes: [m(n, "counted the dots, not the empty boxes"), m(10, "said 10"), m(11 - n, "counted one too many"), m(9 - n, "counted one too few")],
    };
  }),
  T("k-add", "K.OA.A.5", (c) => {
    const w = c.ri(2, c.by([5, 5, 10])), a = c.ri(1, w - 1), b = w - a, [pic] = pics(c, 1);
    return {
      text: `What is ${a} + ${b}?`, answer: w, figure: { t: "pics", rows: [row(pic, a), row(pic, b)] },
      steps: [`Count all the ${pic.many}: ${a} and ${b} more makes ${w}.`],
      mistakes: [m(Math.abs(a - b), "took away"), m(w + 1, "counted one twice"), m(w - 1, "missed one"), m(Math.max(a, b), "only counted one group")],
    };
  }, 0),
  T("k-take", "K.OA.A.5", (c) => {
    const w = c.ri(2, c.by([5, 5, 10])), a = c.ri(1, w - 1), [pic] = pics(c, 1);
    return {
      text: `What is ${w} − ${a}?`, answer: w - a, figure: { t: "pics", rows: [row(pic, w, { gone: a })] },
      steps: [`Start with ${w}. Cross out ${a}.`, `${w - a} are left.`],
      mistakes: [m(w + a, "added"), m(a, "gave the number taken away"), m(w - a + 1, "counted one too many"), m(w, "did not take any away")],
    };
  }, 0),
  T("k-story-add", "K.OA.A.2", (c) => {
    const w = c.ri(2, c.by([5, 10, 10])), a = c.ri(1, w - 1), b = w - a, [x, y] = [c.name(), c.name()], th = c.thing(c.pick(["food", "toys", "collect"] as const));
    return {
      text: `${x} has ${c.count(a, th)}. ${y} gives ${x} ${b} more. How many ${th.many} does ${x} have now?`, answer: w,
      model: { t: "pw", parts: [a, b], labels: ["had", "more"], unk: "whole" },
      steps: [`${a} and ${b} more: ${a} + ${b} = ${w}.`],
      mistakes: [m(Math.abs(a - b), "took away"), m(a, `gave what ${x} had at first`), m(w + 1, "counted on one too many"), m(w - 1, "counted on one too few")],
    };
  }),
  T("k-story-take", "K.OA.A.2", (c) => {
    const { pic, go } = c.pick(AWAY), w = c.ri(2, c.by([5, 10, 10])), a = c.ri(1, w - 1);
    return {
      text: `There are ${w} ${pic.many}. ${a} ${go[a === 1 ? 0 : 1]}. How many are left?`, answer: w - a,
      figure: { t: "pics", rows: [row(pic, w, { gone: a })] },
      model: { t: "pw", parts: [a, w - a], labels: ["gone", "left"], unk: 1, whole: w },
      steps: [`Start with ${w}. Take away ${a}.`, `${w} − ${a} = ${w - a}.`],
      mistakes: [m(w + a, "added"), m(a, "gave the number that went away"), m(w, "did not take any away"), m(w - a + 1, "counted back one too few")],
    };
  }),
  T("k-teen", "K.NBT.A.1", (c) => {
    const ones = c.n([[1, 5], [1, 9], [1, 9]]), n = 10 + ones, name = c.name();
    const mistakes = [m(100 + ones, `wrote 10 and then ${ones}`), m(ones, "left out the ten"), m(n + 1, "counted one too many"), m(n - 1, "counted one too few"), m(Number(`${ones}1`), "wrote the digits the wrong way round")];
    return c.ri(0, 1)
      ? { text: `${name} fills one ten frame and puts ${ones} more ${ones === 1 ? "dot" : "dots"} in the next. How many dots in all?`, answer: n,
          figure: { t: "frame", filled: n, frames: 2 }, steps: [`A full ten frame is 10. 10 and ${ones} more is ${n}.`], mistakes }
      : { text: `${name} has 10 ${c.pick(PICS).many} and ${ones} more. How many is that?`, answer: n, steps: [`10 and ${ones} make ${n}: one ten and ${ones} ones.`], mistakes };
  }),
  T("k-shape", "K.G.A.2", (c) => {
    const shape = c.pick(FLAT), color = c.pick(COLORS);
    return {
      text: "What is the name of this shape?", answer: shape, ask: "What do we call it?",
      figure: { t: "shape", shape, color, turn: shape === "circle" ? 0 : c.pick([0, 0, 15, 30, 45]) },
      steps: [shape === "circle" ? "It is round with no corners, so it is a circle." : `It has ${SIDES[shape]} straight sides${shape === "square" ? ", all the same length" : shape === "rectangle" ? ", 2 long and 2 short" : ""}, so it is a ${shape}.`],
      mistakes: FLAT.filter((s) => s !== shape).map((s) => m(s, MIXUP[s])),
    };
  }),
  T("k-sides", "K.G.B.4", (c) => {
    const shape = c.pick(["triangle", "square", "rectangle", "hexagon"] as const), n = SIDES[shape]!, what = c.pick(["sides", "corners"]);
    return {
      text: `How many ${what} does this ${shape} have?`, answer: n,
      figure: { t: "shape", shape, color: c.pick(COLORS), turn: c.pick([0, 0, 15, 30, 45]) },
      steps: [`Touch each ${what === "sides" ? "side" : "corner"} as you count: ${Array.from({ length: n }, (_, i) => i + 1).join(", ")}.`],
      mistakes: [m(n - 1, "missed one"), m(n + 1, "counted one twice"), m(n === 4 ? 3 : 4, "guessed from another shape"), m(n + 2, "counted two twice")],
    };
  }),
  T("k-solid", "K.G.A.1", (c) => {
    if (c.ri(0, 2) === 0) {
      // Flat or solid (K.G.A.3).
      const solid = c.pick(SOLIDS), flats = c.shuffle([...FLAT]).slice(0, 4);
      return { std: "K.G.A.3", text: "Which shape is solid, not flat?", answer: solid,
        steps: [`A ${solid} is solid: you can pick it up and hold it. Circles, squares, triangles, rectangles and hexagons are flat.`],
        mistakes: flats.map((f) => m(f, `picked a ${f}, which is flat`)) };
    }
    const [thing, shape, flat] = c.pick(OBJECTS);
    return {
      text: `What shape is ${thing}?`, answer: shape,
      steps: [`${cap(thing)} is solid and shaped like a ${shape}.`],
      mistakes: [m(flat, `picked a flat shape, but ${thing} is solid`), ...SOLIDS.filter((s) => s !== shape).map((s) => m(s, `picked a ${s}`))],
    };
  }),
  T("k-longest", "K.MD.A.2", (c) => {
    const names = c.shuffle([...LONG]).slice(0, 3), ns = c.shuffle(Array.from({ length: c.by([6, 8, 10]) }, (_, i) => i + 1)).slice(0, 3);
    const long = c.ri(0, 1) === 1, best = ns.indexOf(long ? Math.max(...ns) : Math.min(...ns));
    const block = c.pick(["🟩", "🟦", "🟧", "🟨"]);
    return {
      text: `Which is the ${long ? "longest" : "shortest"}?`, answer: cap(names[best]),
      figure: { t: "pics", rows: names.map((label, i) => ({ icons: Array<string>(ns[i]).fill(block), label: cap(label) })) },
      steps: [`Count the blocks: ${names.map((x, i) => `${x} ${ns[i]}`).join(", ")}.`, `The ${names[best]} is the ${long ? "longest" : "shortest"}.`],
      mistakes: [...[0, 1, 2].filter((i) => i !== best).map((i) => m(cap(names[i]), `picked the ${names[i]}, which is ${ns[i]} blocks`)), m("They are all the same", "did not compare the lengths")],
    };
  }),
  T("k-sort", "K.MD.B.3", (c) => {
    const [a, b, d] = pics(c, 3), na = c.ri(2, c.by([4, 6, 7])), nb = c.ri(1, c.by([3, 4, 5])), nd = c.tier === 0 ? 0 : c.ri(1, 3);
    const icons = c.shuffle([...row(a, na).icons, ...row(b, nb).icons, ...row(d, nd).icons]);
    return {
      text: `Sort the pictures. How many ${a.many} are there?`, answer: na, figure: { t: "pics", rows: [{ icons }] },
      steps: [`Count only the ${a.many}: ${na}.`, `There ${nb === 1 ? "is" : "are"} also ${count(nb, b)}${nd ? ` and ${count(nd, d)}` : ""}.`],
      mistakes: [m(na + nb + nd, "counted every picture"), m(nb, `counted the ${b.many}`), m(na + 1, "counted one twice"), m(na - 1, "missed one")],
    };
  }),
];

/** Kindergarten practice topics: a few templates each, for the Learn pathway and /kindergarten. */
export interface KTopic {
  id: string;
  title: string;
  blurb: string;
  /** Where it sits on the Learn page. */
  domain: "bar-models" | "numbers" | "thinking";
  templates: string[];
}

export const K_TOPICS: KTopic[] = [
  { id: "count", domain: "numbers", title: "Count how many", blurb: "Count pictures up to 20 and match number words to numbers.", templates: ["k-count", "k-numeral"] },
  { id: "count-100", domain: "numbers", title: "Count to 100", blurb: "Say what comes next, by ones and by tens.", templates: ["k-next", "k-tens"] },
  { id: "compare", domain: "numbers", title: "More, fewer, greatest", blurb: "Compare groups and numbers up to 10.", templates: ["k-more", "k-greatest"] },
  { id: "bonds", domain: "numbers", title: "Number bonds to 10", blurb: "Split numbers into two parts and fill the ten frame.", templates: ["k-bond", "k-make10", "k-teen"] },
  { id: "add-take", domain: "numbers", title: "Add and take away", blurb: "Join groups and cross some out, within 10.", templates: ["k-add", "k-take"] },
  { id: "stories", domain: "bar-models", title: "Story problems", blurb: "Little stories to add or take away within 10.", templates: ["k-story-add", "k-story-take"] },
  { id: "shapes", domain: "thinking", title: "Shapes", blurb: "Name flat and solid shapes and count sides and corners.", templates: ["k-shape", "k-sides", "k-solid"] },
  { id: "measure", domain: "thinking", title: "Measure and sort", blurb: "Find the longest and shortest, and sort and count.", templates: ["k-longest", "k-sort"] },
];

export function getKTopic(id: string): KTopic | undefined {
  return K_TOPICS.find((t) => t.id === id);
}

/** The Common Core codes a topic practices, in template order. */
export function kTopicStds(t: KTopic): string[] {
  const stds = t.templates.map((id) => K.find((x) => x.id === id)!.std);
  return [...new Set(stds)];
}

/** One practice question from a Kindergarten topic, from any of its templates. */
export function kTopicQuestion(t: KTopic, r: Rng): Question {
  const id = helpers(r).pick(t.templates);
  const tpl = K.find((x) => x.id === id)!;
  return render(tpl, r).question;
}
