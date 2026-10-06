/**
 * Data and thinking, Grades 1–8: the habits a child needs next to an AI that can
 * calculate for them. Reading graphs and spotting misleading ones, averages and
 * chance, patterns, rules and simple code, estimating to check an answer (including
 * one a robot or chatbot gave), explaining why a method works, and multi-step
 * problems with no single formula.
 *
 * Every topic makes a question with a worked solution and wrong answers taken from
 * real mistakes. Easy topics are free; intermediate and advanced topics need the
 * Pro plan and are only served by the API after a server-side plan check.
 */
import type { Figure } from "./figures";
import { LEVELS, type Level } from "./problems";
import { NAMES, type Grade, type Question } from "./questions";
import { gcd, helpers, type Rng } from "./rng";

type H = ReturnType<typeof helpers>;

interface Made {
  text: string;
  answer: string;
  /** Wrong answers from real mistakes. Duplicates and accidental right answers are dropped. */
  wrong: string[];
  steps: string[];
  figure?: Figure;
  /** When one topic asks about several standards. */
  std?: string;
}

export type Area = "data" | "logic" | "estimate" | "reasoning" | "multistep";

export const AREAS: { id: Area; title: string; blurb: string }[] = [
  { id: "data", title: "Data & chance", blurb: "Read graphs, spot misleading ones, find averages and think about chance." },
  { id: "logic", title: "Patterns, rules & code", blurb: "Find what comes next, follow if-then rules and run simple programs in your head." },
  { id: "estimate", title: "Estimate & check", blurb: "Decide whether an answer makes sense, even one a robot or chatbot gave you." },
  { id: "reasoning", title: "Explain why", blurb: "Pick the explanation that really shows why a method works." },
  { id: "multistep", title: "Multi-step problems", blurb: "Real problems with several steps and no single formula." },
];

export interface ThinkTopic {
  id: string;
  grade: Grade;
  area: Area;
  level: Level;
  /** Common Core content standard. */
  std: string;
  /** The Common Core Mathematical Practice the topic builds most. */
  mp: string;
  title: string;
  blurb: string;
  make: (h: H) => Made;
}

export const MP: Record<string, string> = {
  MP1: "Make sense of problems and persevere",
  MP3: "Construct arguments and critique reasoning",
  MP4: "Model with mathematics",
  MP6: "Attend to precision",
  MP7: "Look for and make use of structure",
  MP8: "Look for regularity in repeated reasoning",
};

/* ---------------- helpers ---------------- */

const num = (n: number) => n.toLocaleString("en-US");
const usd = (v: number) => "$" + (Number.isInteger(v) ? num(v) : v.toFixed(2));
/** n/d in simplest form, as "0", "1" or "3/4". */
function frac(n: number, d: number): string {
  const g = gcd(n, d) || 1;
  const [a, b] = [n / g, d / g];
  return b === 1 ? String(a) : `${a}/${b}`;
}
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const roundTo = (n: number, p: number) => Math.round(n / p) * p;
/** Round to the leading digit: 230 → 200, 10,580 → 10,000. */
const roundLead = (n: number) => roundTo(n, 10 ** Math.floor(Math.log10(Math.abs(n) || 1)));

/** "Yes, it is close to…" / "No, it should be about…" claims, exactly one of them true. */
function checkClaims(est: number, alts: number[], ok: boolean, shown: number) {
  const yes = (e: number) => `Yes, it is close to ${num(e)}`;
  const no = (e: number) => `No, it should be about ${num(e)}`;
  if (ok) return { answer: yes(est), wrong: [no(alts[0]), no(alts[1]), yes(alts[0]), yes(alts[1])] };
  return { answer: no(est), wrong: [yes(est), yes(roundLead(shown)), ...alts.map(no)] };
}

/* ---------------- graph data ---------------- */

const PICT = [
  { title: "Fruit our class likes", noun: "children", labels: ["Apples", "Bananas", "Grapes"] },
  { title: "Pets at home", noun: "pets", labels: ["Dogs", "Cats", "Fish"] },
  { title: "How we get to school", noun: "children", labels: ["Walk", "Bus", "Car"] },
  { title: "Weather this month", noun: "days", labels: ["Sunny", "Rainy", "Cloudy"] },
];

const BARS = [
  { title: "Favorite pets", noun: "children", labels: ["Dogs", "Cats", "Fish", "Birds"] },
  { title: "Books read this month", noun: "books", labels: ["Mei", "Diego", "Aisha", "Kenji"] },
  { title: "Snacks sold at the fair", noun: "snacks", labels: ["Popcorn", "Pretzels", "Fruit", "Juice"] },
];

/** Picture-graph questions: read a row, compare two rows, or add two rows. */
function pictQuestion(h: H, key: number, maxCount: number): Made {
  const { ri, pick, shuffle } = h;
  const s = pick(PICT);
  const counts = shuffle(range(1, maxCount)).slice(0, 3);
  const figure: Figure = { t: "pict", title: s.title, labels: s.labels, counts, key, noun: s.noun };
  const [i, j] = shuffle([0, 1, 2]);
  const [hi, lo] = counts[i] > counts[j] ? [i, j] : [j, i];
  const k = (c: number) => c * key;
  const each = key === 1 ? "Each dot stands for 1" : `Each dot stands for ${key}`;
  const form = ri(0, 2);
  if (form === 0) {
    const c = counts[i];
    return {
      text: `${key === 1 ? "" : `In this picture graph each ● stands for ${key} ${s.noun}. `}How many ${s.noun} does the ${s.labels[i]} row show?`,
      answer: num(k(c)),
      wrong: [num(c), num(k(c) + key), num(k(c) - key), num(c + key), ...counts.filter((_, x) => x !== i).map((x) => num(k(x)))],
      steps: [`Count the dots in the ${s.labels[i]} row: there ${c === 1 ? "is" : "are"} ${c}.`, key === 1 ? `${each}, so the row shows ${c} ${s.noun}.` : `${each}, so the row shows ${c} × ${key} = ${k(c)} ${s.noun}.`],
      figure,
    };
  }
  const d = counts[hi] - counts[lo], t = counts[hi] + counts[lo];
  if (form === 1) {
    return {
      text: `${key === 1 ? "" : `Each ● stands for ${key} ${s.noun}. `}How many more ${s.noun} are in the ${s.labels[hi]} row than in the ${s.labels[lo]} row?`,
      answer: num(k(d)),
      wrong: [num(d), num(k(t)), num(k(d) + key), num(k(counts[hi])), num(k(counts[lo]))],
      steps: [`${s.labels[hi]} has ${counts[hi]} dots and ${s.labels[lo]} has ${counts[lo]}, so ${s.labels[hi]} has ${d} more dot${d === 1 ? "" : "s"}.`, key === 1 ? `${each}: ${d} more ${s.noun}.` : `${each}: ${d} × ${key} = ${k(d)} more ${s.noun}.`],
      figure,
    };
  }
  return {
    text: `${key === 1 ? "" : `Each ● stands for ${key} ${s.noun}. `}How many ${s.noun} are in the ${s.labels[i]} and ${s.labels[j]} rows altogether?`,
    answer: num(k(t)),
    wrong: [num(t), num(k(d)), num(k(t) + key), num(k(t) - key), num(k(counts[hi]))],
    steps: [`${s.labels[i]} has ${counts[i]} dots and ${s.labels[j]} has ${counts[j]}: ${counts[i]} + ${counts[j]} = ${t} dots.`, key === 1 ? `${each}: ${t} ${s.noun}.` : `${each}: ${t} × ${key} = ${k(t)} ${s.noun}.`],
    figure,
  };
}

/* ---------------- reasoning banks ---------------- */

type Why = (h: H) => Made;

const WHY3: Why[] = [
  ({ ri }) => {
    const a = ri(3, 9);
    let b = ri(2, 9);
    if (b === a) b = a === 2 ? 3 : a - 1;
    return {
      std: "3.OA.B.5",
      text: `Why is ${a} × ${b} the same as ${b} × ${a}?`,
      answer: `An array of ${a} rows of ${b} turned on its side is ${b} rows of ${a}: the same dots`,
      wrong: ["Because multiplying always makes a bigger number", `Because ${a} + ${b} is the same as ${b} + ${a}`, "Because you can always swap the numbers in any sum, even in subtraction"],
      steps: [`Draw ${a} rows with ${b} dots in each: ${a * b} dots.`, `Turn the picture a quarter turn. Now there are ${b} rows of ${a}, and not a single dot moved.`, `So ${a} × ${b} = ${b} × ${a} = ${a * b}.`],
    };
  },
  ({ ri }) => {
    const a = ri(6, 9), b = ri(6, 9);
    return {
      std: "3.OA.B.5",
      text: `Why does ${a} × ${b} = ${a} × 5 + ${a} × ${b - 5}?`,
      answer: `${b} groups of ${a} is 5 groups of ${a} and ${b - 5} more groups of ${a}`,
      wrong: [`Because 5 + ${b - 5} = ${b}, so you can add the answers to ${a} + 5 and ${a} + ${b - 5}`, `Because ${a} × 5 = ${a * 5} and you just add ${b - 5}`, "Because you can split any number into 5 and the rest and nothing changes, even when you divide"],
      steps: [`${a} × ${b} means ${b} groups of ${a}.`, `Split the ${b} groups into 5 groups and ${b - 5} groups: ${a} × 5 = ${a * 5} and ${a} × ${b - 5} = ${a * (b - 5)}.`, `${a * 5} + ${a * (b - 5)} = ${a * b}, which is ${a} × ${b}.`],
    };
  },
  ({ pick }) => {
    const [a, b] = pick([[3, 4], [2, 3], [4, 6], [3, 8], [2, 6]] as const);
    return {
      std: "3.NF.A.3d",
      text: `Two bars are the same size. Why is 1/${a} of one bar bigger than 1/${b} of the other?`,
      answer: `Cutting a bar into ${a} equal parts makes bigger parts than cutting it into ${b}`,
      wrong: [`Because ${a} is less than ${b}, and a smaller number is always worth less`, `Because 1/${a} has more parts`, `Because ${a} + 1 = ${a + 1}`],
      steps: [`1/${a} is one of ${a} equal parts. 1/${b} is one of ${b} equal parts of the same size bar.`, `The more parts you cut, the smaller each part is.`, `So 1/${a} is bigger than 1/${b}.`],
    };
  },
  ({ ri }) => {
    const b = ri(12, 39), c = ri(11, 49), a = b + c;
    return {
      std: "3.NBT.A.2",
      text: `Why can you check ${a} − ${b} = ${c} by working out ${c} + ${b}?`,
      answer: `Subtraction finds a missing part. Adding the two parts back together must give the whole, ${a}`,
      wrong: ["Because adding and subtracting always give the same answer", `Because ${c} + ${b} = ${a} − ${b}`, "Because you can always swap the two numbers in a subtraction"],
      steps: [`In a bar model, ${a} is the whole and ${b} is one part.`, `${a} − ${b} finds the other part. If it is ${c}, the two parts ${c} and ${b} must make the whole.`, `${c} + ${b} = ${a}, so the subtraction is right.`],
    };
  },
];

const WHY5: Why[] = [
  ({ ri }) => {
    let t = ri(11, 99);
    if (t % 10 === 0) t++;
    const d = t / 10, s = d.toFixed(1);
    return {
      std: "5.NBT.A.2",
      text: `Why is ${s} × 10 = ${t}?`,
      answer: "Each digit moves one place to the left, so it is worth 10 times as much",
      wrong: [`Because you always put a 0 on the end when you multiply by 10, so it is ${s}0`, "Because the decimal point does not count when you multiply", `Because ${Math.floor(d)} × 10 = ${Math.floor(d) * 10} and you keep the ${t % 10} the same`],
      steps: [`${s} is ${Math.floor(d)} one${Math.floor(d) === 1 ? "" : "s"} and ${t % 10} tenth${t % 10 === 1 ? "" : "s"}.`, `Times 10, ${Math.floor(d)} one${Math.floor(d) === 1 ? "" : "s"} become ${Math.floor(d)} ten${Math.floor(d) === 1 ? "" : "s"} and ${t % 10} tenth${t % 10 === 1 ? "" : "s"} become ${t % 10} one${t % 10 === 1 ? "" : "s"}.`, `So ${s} × 10 = ${t}. Putting a 0 on the end would give ${s}0, which is still ${s}.`],
    };
  },
  ({ pick }) => {
    const [n, d] = pick([[2, 3], [3, 4], [1, 3], [2, 5], [3, 5]] as const), m = pick([3, 4]);
    return {
      std: "5.NF.A.1",
      text: `Why does ${n}/${d} = ${n * m}/${d * m}?`,
      answer: `Cut every part of the bar into ${m}: there are ${m} times as many parts and ${m} times as many shaded, but the shaded amount is the same`,
      wrong: [`Because ${n * m} and ${d * m} are both in the ${m} times table`, "Because bigger numbers always make a bigger fraction", `Because you multiply the top by ${m} and the bottom stays as ${d}`],
      steps: [`Draw ${n}/${d}: a bar cut into ${d} equal parts with ${n} shaded.`, `Cut every part into ${m} smaller parts. Now there are ${d} × ${m} = ${d * m} parts and ${n} × ${m} = ${n * m} are shaded.`, `Nothing new was shaded, so ${n}/${d} = ${n * m}/${d * m}.`],
    };
  },
  ({ ri }) => {
    const a = ri(3, 9), b = ri(11, a * 10 - 1);
    return {
      std: "5.NBT.A.3b",
      text: `Why is 0.${a} greater than 0.${b < 10 ? "0" + b : b}, even though ${b} is greater than ${a}?`,
      answer: `0.${a} is ${a} tenths, which is ${a * 10} hundredths, and ${a * 10} hundredths is more than ${b} hundredths`,
      wrong: ["Because a decimal with fewer digits is always greater", `Because ${a} is an odd number`, "Because you compare the last digits"],
      steps: [`Write both with hundredths: 0.${a} = 0.${a}0 = ${a * 10} hundredths.`, `0.${b} = ${b} hundredths.`, `${a * 10} > ${b}, so 0.${a} > 0.${b}. Fewer digits is not the rule: 0.1 is less than 0.25.`],
    };
  },
  ({ ri, pick }) => {
    const d = pick([2, 3, 4]), w = d * ri(2, 6);
    return {
      std: "5.NF.B.5b",
      text: `Why is ${w} × 1/${d} less than ${w}?`,
      answer: `Multiplying by 1/${d} means taking 1/${d} of ${w}, which is only part of it`,
      wrong: ["It isn't: multiplying always makes a number bigger", `Because you take away ${d}`, `Because ${d} is less than ${w}`],
      steps: [`${w} × 1/${d} means 1/${d} of ${w}.`, `Cut ${w} into ${d} equal parts: each part is ${w / d}.`, `Multiplying by a fraction less than 1 gives less than you started with.`],
    };
  },
];

const WHY6: Why[] = [
  ({ ri, pick }) => {
    const w = ri(2, 6), d = pick([2, 3, 4]);
    return {
      std: "6.NS.A.1",
      text: `Why is ${w} ÷ 1/${d} = ${w * d}?`,
      answer: `There are ${d} pieces of 1/${d} in each whole, so ${w} wholes hold ${w} × ${d} = ${w * d} pieces`,
      wrong: [`Because dividing always makes a number smaller, so the answer is really ${frac(w, d)}`, `Because ${w} ÷ ${d} = ${w * d}`, `Because you flip the ${w} to get 1/${w}`],
      steps: [`${w} ÷ 1/${d} asks: how many pieces of size 1/${d} fit into ${w}?`, `Each whole has ${d} pieces of 1/${d}.`, `${w} wholes have ${w} × ${d} = ${w * d} pieces. That is why dividing by 1/${d} is the same as multiplying by ${d}.`],
    };
  },
  ({ ri }) => {
    const a = ri(2, 6), b = ri(2, 9);
    return {
      std: "6.EE.A.3",
      text: `Why is ${a}(x + ${b}) the same as ${a}x + ${a * b}?`,
      answer: `${a} groups of (x + ${b}) is ${a} x's and ${a} lots of ${b}`,
      wrong: [`Because you add ${a} to everything inside the brackets`, `Because ${a} × ${b} = ${a * b} and the x stays as just x`, `Because the brackets mean you can ignore the ${a}`],
      steps: [`${a}(x + ${b}) means ${a} copies of x + ${b}.`, `Count the x's: ${a} of them. Count the ${b}'s: ${a} of them, which is ${a * b}.`, `So ${a}(x + ${b}) = ${a}x + ${a * b}.`],
    };
  },
  ({ pick }) => {
    const [n, d, p] = pick([[1, 4, 25], [3, 4, 75], [1, 5, 20], [2, 5, 40], [1, 2, 50], [3, 10, 30]] as const);
    return {
      std: "6.RP.A.3c",
      text: `Why is ${n}/${d} the same as ${p}%?`,
      answer: `Percent means "out of 100", and ${n}/${d} of 100 is ${p}`,
      wrong: [`Because ${n} + ${d} = ${n + d}, and you put a % sign after it`, `Because you write the ${n} and the ${d} next to each other`, "Because every fraction is less than 100%, so it must be about that"],
      steps: [`${p}% means ${p} out of 100.`, `Make the bottom number 100: ${n}/${d} = ${(n * 100) / d}/100.`, `${(n * 100) / d} out of 100 is ${p}%.`],
    };
  },
  ({ ri }) => {
    const n = ri(3, 12);
    return {
      std: "6.NS.B.2",
      text: `Why can't you divide ${n} by 0?`,
      answer: `No number times 0 makes ${n}, so ${n} ÷ 0 has no answer`,
      wrong: [`Because ${n} ÷ 0 = 0`, `Because ${n} ÷ 0 = ${n}`, "Because 0 is an even number"],
      steps: [`Division undoes multiplication: ${n} ÷ 3 = ? asks "what times 3 makes ${n}?"`, `${n} ÷ 0 = ? asks "what times 0 makes ${n}?"`, `Anything times 0 is 0, never ${n}. So there is no answer.`],
    };
  },
];

const WHY7: Why[] = [
  ({ ri }) => {
    const a = ri(2, 6), b = ri(2, 6);
    return {
      std: "7.NS.A.2a",
      text: `Why is (−${a}) × (−${b}) = ${a * b}?`,
      answer: `In the pattern −${a} × 1 = −${a}, −${a} × 0 = 0, −${a} × −1 = ${a}, the answer goes up by ${a} each step, so −${a} × −${b} = ${a * b}`,
      wrong: [`Because two minus signs always make a plus, like −${a} + −${b} = ${a + b}`, "Because negative numbers are bigger than positive ones", "Because you multiply the numbers and leave the signs off in every calculation"],
      steps: [`Count down: −${a} × 2 = −${2 * a}, −${a} × 1 = −${a}, −${a} × 0 = 0.`, `Each time you multiply by one less, the answer goes up by ${a}.`, `Keep going: −${a} × −1 = ${a}, −${a} × −2 = ${2 * a}, and −${a} × −${b} = ${a * b}.`],
    };
  },
  ({ ri }) => {
    const a = ri(2, 9), b = ri(1, 9);
    return {
      std: "7.NS.A.1c",
      text: `Why is ${a} − (−${b}) = ${a + b}?`,
      answer: `Subtracting a number moves the opposite way to adding it. Adding −${b} moves ${b} left, so subtracting −${b} moves ${b} right`,
      wrong: ["Because two minus signs next to each other make a minus", `Because ${a} − ${b} = ${a + b}`, `Because the negatives cancel out and leave ${a}`],
      steps: [`On a number line, adding −${b} moves ${b} to the left: ${a} + (−${b}) = ${a - b}.`, `Subtracting is the opposite move, so ${a} − (−${b}) moves ${b} to the right.`, `${a} + ${b} = ${a + b}.`],
    };
  },
  ({ pick }) => {
    const [n, d, dec, other] = pick([[2, 3, "0.666…", "0.75"], [1, 3, "0.333…", "0.4"], [5, 6, "0.833…", "0.9"], [1, 6, "0.166…", "0.2"]] as const);
    return {
      std: "7.NS.A.2d",
      text: `Why is ${other} greater than ${n}/${d}?`,
      answer: `${n}/${d} = ${n} ÷ ${d} = ${dec}, which is less than ${other}`,
      wrong: [`Because ${other.slice(2)} is bigger than ${d}`, "Because a decimal is always bigger than a fraction", `Because ${n}/${d} = 0.${n}${d}`],
      steps: [`Turn ${n}/${d} into a decimal by dividing: ${n} ÷ ${d} = ${dec}.`, `Compare tenths first: ${dec} vs ${other}.`, `${other} is greater.`],
    };
  },
];

/* ---------------- the topics ---------------- */

export const THINKING_TOPICS: ThinkTopic[] = [
  /* ---------------- Grade 1 ---------------- */
  {
    id: "g1-pict", grade: 1, area: "data", level: "easy", std: "1.MD.C.4", mp: "MP4",
    title: "Read a picture graph", blurb: "Count the dots in each row, then compare the rows.",
    make: (h) => pictQuestion(h, 1, 9),
  },
  {
    id: "g1-pattern", grade: 1, area: "logic", level: "easy", std: "1.OA.C.5", mp: "MP7",
    title: "What comes next?", blurb: "Find the part that repeats, or the jump between numbers.",
    make: ({ ri, pick, shuffle }) => {
      if (ri(0, 1)) {
        const SYM = ["●", "▲", "■", "★"];
        const sym = shuffle(SYM);
        const unit = pick([[0, 1], [0, 1, 1], [0, 0, 1], [0, 1, 2]]).map((i) => sym[i]);
        const len = ri(unit.length * 2, 9);
        const seq = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
        const next = unit[len % unit.length];
        return {
          text: `What comes next? ${seq.join(" ")} ?`,
          answer: next,
          wrong: SYM.filter((s) => s !== next),
          steps: [`The part that repeats is ${unit.join(" ")}.`, `Say it as you point: ${seq.join(" ")}, then ${next}.`],
        };
      }
      const step = pick([2, 5, 10]), start = step * ri(0, 6);
      const terms = [0, 1, 2, 3].map((i) => start + i * step), next = start + 4 * step;
      return {
        text: `What number comes next? ${terms.join(", ")}, ?`,
        answer: String(next),
        wrong: [String(next + 1), String(next - 1), String(terms[3]), String(next + step)],
        steps: [`Each number is ${step} more than the one before: count on by ${step}s.`, `${terms[3]} + ${step} = ${next}.`],
      };
    },
  },

  /* ---------------- Grade 2 ---------------- */
  {
    id: "g2-bar", grade: 2, area: "data", level: "easy", std: "2.MD.D.10", mp: "MP4",
    title: "Read a bar graph", blurb: "Read each bar against the numbers on the side.",
    make: ({ ri, pick, shuffle }) => {
      const s = pick(BARS);
      const values = shuffle(range(1, 8).map((x) => x * 2)).slice(0, 4);
      const figure: Figure = { t: "bar", title: s.title, labels: s.labels, values, step: 2 };
      const [i, j] = shuffle([0, 1, 2, 3]);
      const [hi, lo] = values[i] > values[j] ? [i, j] : [j, i];
      const v = (k: number) => String(values[k]);
      switch (ri(0, 3)) {
        case 0:
          return {
            text: `How many ${s.noun} does the ${s.labels[i]} bar show?`,
            answer: v(i), wrong: [String(values[i] + 1), String(values[i] - 1), String(values[i] + 2), v(j)],
            steps: [`Go to the top of the ${s.labels[i]} bar and across to the numbers on the side.`, `It lines up with ${values[i]}.`], figure,
          };
        case 1: {
          const d = values[hi] - values[lo];
          return {
            text: `How many more ${s.noun} does the ${s.labels[hi]} bar show than the ${s.labels[lo]} bar?`,
            answer: String(d), wrong: [String(values[hi] + values[lo]), v(hi), String(d + 2), String(d - 1)],
            steps: [`${s.labels[hi]}: ${values[hi]}. ${s.labels[lo]}: ${values[lo]}.`, `${values[hi]} − ${values[lo]} = ${d} more.`], figure,
          };
        }
        case 2: {
          const t = values[i] + values[j];
          return {
            text: `How many ${s.noun} do the ${s.labels[i]} and ${s.labels[j]} bars show altogether?`,
            answer: String(t), wrong: [String(values[hi] - values[lo]), String(t + 2), String(t - 2), String(t + 1)],
            steps: [`${s.labels[i]}: ${values[i]}. ${s.labels[j]}: ${values[j]}.`, `${values[i]} + ${values[j]} = ${t}.`], figure,
          };
        }
        default: {
          const most = ri(0, 1) === 1;
          const k = values.indexOf(most ? Math.max(...values) : Math.min(...values));
          return {
            text: `Which bar shows the ${most ? "most" : "fewest"} ${s.noun}?`,
            answer: s.labels[k], wrong: s.labels.filter((_, x) => x !== k),
            steps: [`The ${most ? "tallest" : "shortest"} bar shows the ${most ? "most" : "fewest"}.`, `That is ${s.labels[k]}, with ${values[k]}.`], figure,
          };
        }
      }
    },
  },
  {
    id: "g2-check", grade: 2, area: "estimate", level: "easy", std: "2.NBT.B.5", mp: "MP3",
    title: "Is the robot right?", blurb: "Robo the robot does sums fast, but not always right. Estimate to check.",
    make: ({ ri, pick }) => {
      const add = ri(0, 1) === 1;
      let ta: number, oa: number, tb: number, ob: number;
      if (add) {
        ta = ri(1, 6); tb = ri(1, 7 - ta); oa = ri(2, 9); ob = ri(10 - oa, 9);
      } else {
        ta = ri(3, 9); tb = ri(1, ta - 2); oa = ri(0, 7); ob = ri(oa + 1, 9);
      }
      const a = ta * 10 + oa, b = tb * 10 + ob;
      const correct = add ? a + b : a - b;
      const mistake = add ? correct - 10 : (ta - tb) * 10 + (ob - oa);
      const ok = ri(0, 2) === 0;
      const shown = ok ? correct : pick([mistake, mistake, correct + 10]);
      const op = add ? "+" : "−";
      const lo = add ? (ta + tb) * 10 : (ta - tb - 1) * 10, hi = add ? (ta + tb + 2) * 10 : (ta - tb + 1) * 10;
      const no = (v: number) => `No, it is ${v}`;
      return {
        text: `Robo the robot says ${a} ${op} ${b} = ${shown}. Is Robo right?`,
        answer: ok ? "Yes, Robo is right" : no(correct),
        wrong: ok
          ? [no(correct - 10), no(correct + 10), no(correct + 1), no(correct - 1)]
          : ["Yes, Robo is right", ...[correct + 10, correct - 10, correct + 1, correct - 1].filter((v) => v !== shown && v > 0).map(no)],
        steps: [
          `Estimate first: ${a} is between ${ta * 10} and ${ta * 10 + 10}, and ${b} is between ${tb * 10} and ${tb * 10 + 10}. So the answer is between ${lo} and ${hi}.`,
          add
            ? `Ones: ${oa} + ${ob} = ${oa + ob}. Write ${(oa + ob) % 10} and carry 1 ten. Tens: ${ta} + ${tb} + 1 = ${ta + tb + 1}.`
            : `You can't take ${ob} from ${oa}, so regroup: ${a} is ${ta - 1} tens and ${oa + 10} ones. ${oa + 10} − ${ob} = ${oa + 10 - ob}, and ${ta - 1} − ${tb} = ${ta - 1 - tb} tens.`,
          `${a} ${op} ${b} = ${correct}${ok ? ", so Robo is right." : `, not ${shown}. Robo made a mistake.`}`,
        ],
      };
    },
  },
  {
    id: "g2-ways", grade: 2, area: "multistep", level: "intermediate", std: "2.MD.C.8", mp: "MP1",
    title: "How many ways?", blurb: "Make an amount with coins, and list every way so you don't miss one.",
    make: ({ ri }) => {
      const n = 5 * ri(4, 12);
      const coins = n >= 25 && ri(0, 1) ? [25, 10, 5] : [10, 5];
      const NAME: Record<number, [string, string]> = { 25: ["quarter", "quarters"], 10: ["dime", "dimes"], 5: ["nickel", "nickels"] };
      const ways: number[][] = [];
      const go = (k: number, left: number, acc: number[]) => {
        if (k === coins.length - 1) { ways.push([...acc, left / coins[k]]); return; }
        for (let c = Math.floor(left / coins[k]); c >= 0; c--) go(k + 1, left - c * coins[k], [...acc, c]);
      };
      go(0, n, []);
      const say = (w: number[]) => w.map((c, k) => (c ? `${c} ${NAME[coins[k]][c === 1 ? 0 : 1]}` : "")).filter(Boolean).join(" + ");
      const names = coins.map((c) => NAME[c][1]);
      const list = ways.length <= 6 ? ways.map(say) : [...ways.slice(0, 4).map(say), "…", say(ways[ways.length - 1])];
      return {
        text: `How many different ways can you make ${n}¢ using ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}? You don't have to use every kind of coin.`,
        answer: String(ways.length),
        wrong: [String(ways.length + 1), String(ways.length - 1), String(ways.length + 2), String(n / 5), String(coins.length)],
        steps: [`Be systematic: start with as many ${names[0]} as you can, then use one fewer each time.`, ...list, `That is ${ways.length} ways.`],
      };
    },
  },

  /* ---------------- Grade 3 ---------------- */
  {
    id: "g3-scaled", grade: 3, area: "data", level: "easy", std: "3.MD.B.3", mp: "MP4",
    title: "Scaled picture graphs", blurb: "When each picture stands for 2, 5 or 10, multiply as you count.",
    make: (h) => pictQuestion(h, h.pick([2, 5, 10]), 8),
  },
  {
    id: "g3-estimate", grade: 3, area: "estimate", level: "intermediate", std: "3.OA.D.8", mp: "MP6",
    title: "Estimate to check", blurb: "Round to the nearest hundred to see whether an answer makes sense.",
    make: ({ ri, pick }) => {
      const add = ri(0, 1) === 1, op = add ? "+" : "−";
      if (ri(0, 1)) {
        const a = ri(110, 890), b = add ? ri(110, 980 - a) : ri(110, a - 110);
        const est = add ? roundTo(a, 100) + roundTo(b, 100) : roundTo(a, 100) - roundTo(b, 100);
        const down = add ? Math.floor(a / 100) * 100 + Math.floor(b / 100) * 100 : Math.floor(a / 100) * 100 - Math.floor(b / 100) * 100;
        return {
          text: `Round each number to the nearest hundred. Which is the best estimate of ${a} ${op} ${b}?`,
          answer: num(est),
          wrong: [num(down), num(est + 100), num(est - 100), num(est + 200)].filter((w) => w !== "0"),
          steps: [`${a} rounds to ${roundTo(a, 100)}: look at the tens digit.`, `${b} rounds to ${roundTo(b, 100)}.`, `${roundTo(a, 100)} ${op} ${roundTo(b, 100)} = ${est}. (The exact answer is ${add ? a + b : a - b}.)`],
        };
      }
      const H1 = ri(3, 8), H2 = add ? ri(1, 9 - H1) : ri(1, H1 - 2);
      const a = H1 * 100 + ri(-20, 20), b = H2 * 100 + ri(-20, 20);
      const exact = add ? a + b : a - b, est = add ? (H1 + H2) * 100 : (H1 - H2) * 100;
      const ok = ri(0, 1) === 1;
      const shown = ok ? exact : exact + pick([100, -100, 200]);
      const name = pick(NAMES);
      return {
        text: `${name} worked out ${a} ${op} ${b} = ${shown}. Round each number to the nearest hundred to check. Which is true?`,
        ...checkClaims(est, [est + 100, est - 100], ok, roundTo(shown, 100)),
        steps: [`${a} rounds to ${H1 * 100} and ${b} rounds to ${H2 * 100}.`, `${H1 * 100} ${op} ${H2 * 100} = ${est}, so the answer should be close to ${est}.`, ok ? `${shown} is close to ${est}, so it makes sense (and it is right).` : `${shown} is too far from ${est}, so there is a mistake. The exact answer is ${exact}.`],
      };
    },
  },
  {
    id: "g3-rule", grade: 3, area: "logic", level: "intermediate", std: "3.OA.D.9", mp: "MP7",
    title: "Find the rule", blurb: "A number machine changes every number the same way. Work out how.",
    make: ({ ri, pick, shuffle }) => {
      const mult = ri(0, 1) === 1, k = mult ? ri(2, 6) : ri(3, 12);
      const f = (x: number) => (mult ? x * k : x + k);
      const ins = shuffle(range(1, 10)).slice(0, 4);
      const rows = ins.slice(0, 3).sort((p, q) => p - q), x = ins[3];
      const rule = mult ? `Multiply by ${k}` : `Add ${k}`;
      const twice = pick([2, 3]);
      const rowsOut = rows.map((r) => [r, f(r)] as (string | number)[]);
      if (ri(0, 1)) {
        const cands = [
          { text: `Add ${f(rows[0]) - rows[0]}`, f: (n: number) => n + f(rows[0]) - rows[0] },
          { text: `Multiply by ${k + 1}`, f: (n: number) => n * (k + 1) },
          { text: `Add ${k + 1}`, f: (n: number) => n + k + 1 },
          { text: mult ? `Add ${k}` : `Multiply by ${twice}`, f: (n: number) => (mult ? n + k : n * twice) },
          { text: `Multiply by ${Math.max(2, k - 1)}`, f: (n: number) => n * Math.max(2, k - 1) },
        ];
        return {
          text: "Each number goes into the machine and comes out changed. What is the rule?",
          answer: rule,
          wrong: cands.filter((c) => c.text !== rule && !rows.every((r) => c.f(r) === f(r))).map((c) => c.text),
          steps: [`Try the first row: ${rows[0]} → ${f(rows[0])}. That could be several rules, so test each one on every row.`, `${rule}: ${rows.map((r) => `${r} → ${f(r)}`).join(", ")}. It works every time.`],
          figure: { t: "table", head: ["In", "Out"], rows: rowsOut },
        };
      }
      return {
        text: `The machine changes every number the same way. What comes out when ${x} goes in?`,
        answer: String(f(x)),
        wrong: mult
          ? [String(x + f(rows[0]) - rows[0]), String(f(x) + k), String(f(x) - k), String(x * (k + 1))]
          : [String(x + k + 1), String(x + k - 1), String(f(rows[2]) + (rows[2] - rows[1])), String(x * k)],
        steps: [`Look across each row: ${rows.map((r) => `${r} → ${f(r)}`).join(", ")}.`, `The rule is "${rule.toLowerCase()}" (check it on every row, not just one).`, `${x} → ${mult ? `${x} × ${k}` : `${x} + ${k}`} = ${f(x)}.`],
        figure: { t: "table", head: ["In", "Out"], rows: [...rowsOut, [x, "?"]] },
      };
    },
  },
  {
    id: "g3-why", grade: 3, area: "reasoning", level: "advanced", std: "3.OA.B.5", mp: "MP3",
    title: "Why does it work? Multiplying and checking", blurb: "Turn an array, split a times fact, compare unit fractions, check by adding.",
    make: (h) => h.pick(WHY3)(h),
  },

  /* ---------------- Grade 4 ---------------- */
  {
    id: "g4-ifthen", grade: 4, area: "logic", level: "easy", std: "4.OA.C.5", mp: "MP7",
    title: "If-then rules", blurb: "Follow a rule that does one thing if a number passes a test and another if it doesn't.",
    make: ({ ri }) => {
      if (ri(0, 1)) {
        const t = 5 * ri(6, 16), s = ri(5, 25), a = ri(5, 15), n = t + ri(-6, 6);
        const big = n > t, ans = big ? n - s : n + a;
        return {
          text: `Rule: if a number is more than ${t}, subtract ${s}. Otherwise, add ${a}. What does ${n} become?`,
          answer: String(ans),
          wrong: [String(big ? n + a : n - s), String(n), String(n - s + a), String(ans + 1)],
          steps: [`Test first: is ${n} more than ${t}? ${big ? "Yes" : n === t ? `No, ${n} is equal to ${t}, not more` : "No"}.`, big ? `So subtract ${s}: ${n} − ${s} = ${ans}.` : `So add ${a}: ${n} + ${a} = ${ans}.`],
        };
      }
      const n = ri(3, 20);
      const f = (x: number) => (x % 2 === 0 ? x / 2 : 3 * x + 1);
      const one = f(n), two = f(one);
      const swap = n % 2 === 0 ? 3 * n + 1 : n / 2;
      return {
        text: `Rule: if a number is even, halve it. If it is odd, multiply by 3 and add 1. Start at ${n} and use the rule twice. Where do you end up?`,
        answer: String(two),
        wrong: [String(one), String(f(two)), String(Number.isInteger(swap) ? f(swap) : two + 2), String(two + 1)],
        steps: [`${n} is ${n % 2 === 0 ? `even, so halve it: ${one}` : `odd, so 3 × ${n} + 1 = ${one}`}.`, `${one} is ${one % 2 === 0 ? `even, so halve it: ${two}` : `odd, so 3 × ${one} + 1 = ${two}`}.`],
      };
    },
  },
  {
    id: "g4-line-plot", grade: 4, area: "data", level: "intermediate", std: "4.MD.B.4", mp: "MP4",
    title: "Line plots", blurb: "Each dot is one person or thing. Count dots to answer questions about the data.",
    make: ({ ri, pick }) => {
      const s = pick([
        { title: "Books read last month", unit: "books", who: "students" },
        { title: "Goals scored per game", unit: "goals", who: "games" },
        { title: "Pets per family", unit: "pets", who: "families" },
      ]);
      const start = ri(0, 3);
      let counts: number[];
      do counts = Array.from({ length: 6 }, () => ri(0, 5));
      while (counts.filter(Boolean).length < 4 || sum(counts) < 8);
      const vals = counts.map((_, i) => start + i), total = sum(counts);
      const used = vals.filter((_, i) => counts[i]);
      const figure: Figure = { t: "dots", title: s.title, start, counts, unit: s.unit };
      const each = `Each dot is one of the ${s.who}.`;
      switch (ri(0, 3)) {
        case 0: {
          const i = pick(counts.map((c, k) => (c ? k : -1)).filter((k) => k >= 0));
          return {
            text: `How many ${s.who} had exactly ${vals[i]} ${s.unit}?`,
            answer: String(counts[i]), wrong: [String(vals[i]), String(counts[i] + 1), String(counts[i] - 1), String(counts[(i + 1) % 6])],
            steps: [each, `Count the dots above ${vals[i]}: ${counts[i]}.`], figure,
          };
        }
        case 1: {
          const i = ri(2, 4), atLeast = sum(counts.slice(i));
          return {
            text: `How many ${s.who} had ${vals[i]} or more ${s.unit}?`,
            answer: String(atLeast), wrong: [String(sum(counts.slice(i + 1))), String(counts[i]), String(total), String(sum(counts.slice(0, i)))],
            steps: [each, `"${vals[i]} or more" includes ${vals[i]}: add the dots above ${vals.slice(i).join(", ")}.`, `${counts.slice(i).join(" + ")} = ${atLeast}.`], figure,
          };
        }
        case 2: {
          const lo = used[0], hi = used[used.length - 1];
          return {
            text: `What is the range of the data (the greatest value minus the least value)?`,
            answer: String(hi - lo), wrong: [String(hi), String(used.length), String(hi - lo + 1), String(Math.max(...counts))],
            steps: [`The least value with a dot is ${lo}. The greatest is ${hi}.`, `Range = ${hi} − ${lo} = ${hi - lo}.`], figure,
          };
        }
        default:
          return {
            text: `How many ${s.who} are shown on the line plot?`,
            answer: String(total), wrong: [String(used.length), String(sum(counts.map((c, i) => c * vals[i]))), String(total + 1), String(total - 1)],
            steps: [each, `Add the dots in every column: ${counts.join(" + ")} = ${total}.`], figure,
          };
      }
    },
  },
  {
    id: "g4-ai-check", grade: 4, area: "estimate", level: "intermediate", std: "4.NBT.B.5", mp: "MP3",
    title: "Catch the AI's mistake", blurb: "A chatbot can sound sure and still be wrong. Round to the nearest ten to check.",
    make: ({ ri, pick }) => {
      const a = ri(21, 89), b = ri(21, 89);
      const ra = roundTo(a, 10), rb = roundTo(b, 10), est = ra * rb, exact = a * b;
      const ok = ri(0, 2) === 0;
      const shown = ok ? exact : pick([a * (b % 10) + a * Math.floor(b / 10), exact * 10]);
      return {
        text: `An AI helper says ${a} × ${b} = ${num(shown)}. Round each number to the nearest ten to check. Which is true?`,
        ...checkClaims(est, [est * 10, est / 10], ok, shown),
        steps: [
          `${a} rounds to ${ra} and ${b} rounds to ${rb}.`,
          `${ra} × ${rb} = ${num(est)}, so the answer should be about ${num(est)}.`,
          ok ? `${num(shown)} is close to ${num(est)}, so the AI's answer is reasonable (it is right).` : `${num(shown)} is nowhere near ${num(est)}, so the AI made a mistake. ${a} × ${b} = ${num(exact)}.`,
        ],
      };
    },
  },

  /* ---------------- Grade 5 ---------------- */
  {
    id: "g5-mean", grade: 5, area: "data", level: "easy", std: "5.MD.B.2", mp: "MP4",
    title: "Find the average", blurb: "The mean evens everything out: add it all up, then share it equally.",
    make: ({ ri, pick }) => {
      const n = pick([3, 4, 5]), m = ri(6, 18);
      let vals: number[];
      do {
        vals = Array.from({ length: n - 1 }, () => m + ri(-5, 5));
        vals.push(n * m - sum(vals));
      } while (vals[n - 1] < 1 || vals[n - 1] > 30 || new Set(vals).size < 2);
      const total = n * m, name = pick(NAMES), sorted = [...vals].sort((p, q) => p - q);
      const mid = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      return {
        text: `${name} scored ${vals.slice(0, -1).join(", ")} and ${vals[n - 1]} points in ${n} games. What is the mean (average) score?`,
        answer: String(m),
        wrong: [String(total), Number.isInteger(mid) ? String(mid) : "", String(sorted[n - 1] - sorted[0]), String(m + 1), String(m - 1)],
        steps: [`Add all the scores: ${vals.join(" + ")} = ${total}.`, `Share the total equally between ${n} games: ${total} ÷ ${n} = ${m}.`, `It is like evening out the bars until they are all the same height.`],
        figure: { t: "bar", title: "Points per game", labels: vals.map((_, i) => `Game ${i + 1}`), values: vals, step: Math.max(...vals) > 20 ? 5 : 2 },
      };
    },
  },
  {
    id: "g5-code", grade: 5, area: "logic", level: "intermediate", std: "5.OA.A.2", mp: "MP8",
    title: "Run the code", blurb: "Follow a short program with a loop or an if, one line at a time.",
    make: ({ ri }) => {
      switch (ri(0, 2)) {
        case 0: {
          const a = ri(1, 10), n = ri(2, 5), b = ri(2, 6), c = ri(2, 3), loop = a + n * b, ans = loop * c;
          return {
            text: "What does this program say at the end?",
            answer: String(ans),
            wrong: [String(loop), String((a + (n - 1) * b) * c), String((a + (n + 1) * b) * c), String(a * c + n * b)],
            steps: [`x starts at ${a}.`, `The loop adds ${b}, ${n} times: ${a} + ${n} × ${b} = ${loop}.`, `After the loop, x is multiplied by ${c}: ${loop} × ${c} = ${ans}.`],
            figure: { t: "code", lines: [`set x to ${a}`, `repeat ${n} times:`, `  add ${b} to x`, `multiply x by ${c}`, `say x`] },
          };
        }
        case 1: {
          const k = ri(6, 12), evens = range(1, k).filter((x) => x % 2 === 0), e = sum(evens), all = sum(range(1, k));
          return {
            text: "What does this program say at the end?",
            answer: String(e),
            wrong: [String(all), String(all - e), String(evens.length), String(e + k)],
            steps: [`The loop goes through 1, 2, 3, … ${k}, but only even numbers pass the "if".`, `So total = ${evens.join(" + ")} = ${e}.`],
            figure: { t: "code", lines: ["set total to 0", `for each number n from 1 to ${k}:`, "  if n is even:", "    add n to total", "say total"] },
          };
        }
        default: {
          const a = ri(1, 5), n = ri(2, 5), ans = a * 2 ** n;
          return {
            text: "What does this program say at the end?",
            answer: String(ans),
            wrong: [String(a * 2 * n), String(a + 2 * n), String(a * 2 ** (n - 1)), String(a * 2 ** (n + 1))],
            steps: [`x starts at ${a} and doubles ${n} times.`, `${range(0, n).map((i) => a * 2 ** i).join(" → ")}.`, `So the program says ${ans}.`],
            figure: { t: "code", lines: [`set x to ${a}`, `repeat ${n} times:`, "  multiply x by 2", "say x"] },
          };
        }
      }
    },
  },
  {
    id: "g5-why", grade: 5, area: "reasoning", level: "advanced", std: "5.NBT.A.2", mp: "MP3",
    title: "Why does it work? Decimals and fractions", blurb: "Times 10, equivalent fractions, comparing decimals, multiplying by a fraction.",
    make: (h) => h.pick(WHY5)(h),
  },

  /* ---------------- Grade 6 ---------------- */
  {
    id: "g6-center", grade: 6, area: "data", level: "easy", std: "6.SP.B.5c", mp: "MP4",
    title: "Mean, median and outliers", blurb: "One very big value pulls the mean but not the median.",
    make: ({ ri, pick, shuffle }) => {
      const b = ri(20, 30), base = Array.from({ length: 4 }, () => b + ri(-4, 4));
      let out = b * ri(3, 4);
      while ((sum(base) + out) % 5) out++;
      const vals = shuffle([...base, out]), sorted = [...vals].sort((p, q) => p - q);
      const mean = sum(vals) / 5, med = sorted[2], name = pick(NAMES);
      const text = `${name} read for ${vals.slice(0, -1).join(", ")} and ${vals[4]} minutes on five days.`;
      const order = `In order: ${sorted.join(", ")}.`;
      switch (ri(0, 3)) {
        case 0:
          return {
            text: `${text} What is the mean number of minutes?`,
            answer: String(mean), wrong: [String(med), String(sum(vals)), String(vals[2]), String(mean + 1), sum(base) % 4 ? "" : String(sum(base) / 4)],
            steps: [`Add them: ${vals.join(" + ")} = ${sum(vals)}.`, `Divide by 5: ${sum(vals)} ÷ 5 = ${mean}.`],
          };
        case 1:
          return {
            text: `${text} What is the median number of minutes?`,
            answer: String(med), wrong: [String(mean), String(vals[2]), String(med + 1), String(out)],
            steps: [`Put them in order first: ${sorted.join(", ")}.`, `The middle value is ${med}. (Taking the middle of the list as written would give ${vals[2]}.)`],
          };
        case 2:
          return {
            text: `${text} Which number better describes a typical day?`,
            answer: `The median (${med}), because one big value pulls the mean up`,
            wrong: [`The mean (${mean}), because it uses every value`, `The mean (${mean}), because the big value makes it more accurate`, `The greatest value (${out}), because it is the most important`],
            steps: [order, `The mean is ${mean} and the median is ${med}.`, `On four of the five days ${name} read less than ${mean} minutes. The one big value (${out}) pulls the mean up, so the median describes a typical day better.`],
          };
        default:
          return {
            text: `${text} What is the range?`,
            answer: String(sorted[4] - sorted[0]), wrong: [String(sorted[4]), String(sorted[4] - med), String(sorted[4] - sorted[0] + 1), String(mean)],
            steps: [order, `Range = greatest − least = ${sorted[4]} − ${sorted[0]} = ${sorted[4] - sorted[0]}.`],
          };
      }
    },
  },
  {
    id: "g6-misleading", grade: 6, area: "data", level: "intermediate", std: "6.SP.B.4", mp: "MP3",
    title: "Spot the misleading graph", blurb: "A graph that doesn't start at 0 can make a small difference look huge.",
    make: ({ ri, pick }) => {
      const s = pick([
        { title: "Votes for the class pet", noun: "votes", labels: ["Hamster", "Rabbit"] },
        { title: "Tickets sold", noun: "tickets", labels: ["Friday", "Saturday"] },
        { title: "Juice boxes sold", noun: "juice boxes", labels: ["Apple", "Orange"] },
      ]);
      const min = 10 * ri(5, 9), d = ri(2, 5), k = ri(2, 4), va = min + d, vb = min + k * d;
      const [A, B] = s.labels;
      const figure: Figure = { t: "bar", title: s.title, labels: s.labels, values: [va, vb], min, step: k * d > 12 ? 5 : 2 };
      const steps = [
        `Look at the numbers on the side: they start at ${min}, not 0, so the bottoms of the bars are cut off.`,
        `${A}: ${va}. ${B}: ${vb}. The real difference is only ${vb - va}, and ${vb} is about ${(vb / va).toFixed(1)} times ${va}, not ${k} times.`,
        "Starting the number line at 0 would show the true sizes.",
      ];
      switch (ri(0, 2)) {
        case 0:
          return {
            text: `On this graph the ${B} bar looks about ${k} times as tall as the ${A} bar. How many more ${s.noun} did ${B} really get than ${A}?`,
            answer: String(vb - va), wrong: [String(vb), String(k), String(va), String(k * d), String(vb + va)], steps, figure,
          };
        case 1:
          return {
            text: `A poster shows this graph and says "${B} got ${k} times as many ${s.noun} as ${A}!" Is that fair?`,
            answer: `No. ${B} got ${vb} and ${A} got ${va}, only ${vb - va} more`,
            wrong: [`Yes. The ${B} bar is ${k} times as tall`, `Yes. ${vb} is ${k} times ${va}`, `No. ${A} got more than ${B}`], steps, figure,
          };
        default:
          return {
            text: "How could you redraw this graph so it is not misleading?",
            answer: "Start the numbers on the side at 0",
            wrong: ["Make the bars wider", "Use brighter colors", "Take the numbers off the side"], steps, figure,
          };
      }
    },
  },
  {
    id: "g6-why", grade: 6, area: "reasoning", level: "advanced", std: "6.NS.A.1", mp: "MP3",
    title: "Why does it work? Dividing, brackets, percents", blurb: "Dividing by a fraction, the distributive law, percents and dividing by 0.",
    make: (h) => h.pick(WHY6)(h),
  },

  /* ---------------- Grade 7 ---------------- */
  {
    id: "g7-chance", grade: 7, area: "data", level: "easy", std: "7.SP.C.7a", mp: "MP4",
    title: "Probability", blurb: "How likely is it? Count the ways it can happen out of all the ways.",
    make: ({ ri, pick }) => {
      switch (ri(0, 2)) {
        case 0: {
          const r = ri(1, 9), b = ri(1, 9), g = ri(1, 9), t = r + b + g;
          const [c, color] = pick([[r, "red"], [b, "blue"], [g, "green"]] as const);
          return {
            text: `A bag has ${r} red, ${b} blue and ${g} green marbles. You pick one without looking. What is the probability it is ${color}?`,
            answer: frac(c, t), wrong: [frac(c, t - c), frac(t - c, t), "1/3", frac(c + 1, t), frac(c, t + 1)],
            steps: [`There are ${r} + ${b} + ${g} = ${t} marbles, all equally likely.`, `${c} of them are ${color}, so P(${color}) = ${c}/${t}${frac(c, t) !== `${c}/${t}` ? ` = ${frac(c, t)}` : ""}.`, `Comparing ${color} with the rest (${c} to ${t - c}) is a ratio, not a probability.`],
          };
        }
        case 1: {
          const word = pick(["Impossible", "Unlikely", "Likely", "Certain"] as const);
          const r = word === "Likely" ? ri(7, 12) : ri(1, 2), b = word === "Certain" ? 0 : ri(word === "Likely" ? 1 : 5, word === "Likely" ? 3 : 9);
          const bag = word === "Certain" ? `${r + 4} red marbles and nothing else` : `${r} red and ${b} blue marbles`;
          const ask = word === "Impossible" ? "yellow" : "red";
          return {
            std: "7.SP.C.5",
            text: `A bag has ${bag}. Which word best describes picking a ${ask} marble?`,
            answer: word, wrong: ["Impossible", "Unlikely", "Likely", "Certain"].filter((w) => w !== word),
            steps: [
              word === "Impossible" ? "There are no yellow marbles, so it can never happen: probability 0." : word === "Certain" ? "Every marble is red, so it always happens: probability 1." : `${r} of the ${r + b} marbles are red, which is ${word === "Likely" ? "more" : "less"} than half.`,
              `So picking ${ask} is ${word.toLowerCase()}.`,
            ],
          };
        }
        default: {
          const t = pick([10, 12, 15, 20]), r = ri(1, t - 2), b = ri(1, t - r - 1), g = t - r - b, k = ri(3, 6), n = t * k;
          return {
            std: "7.SP.C.6",
            text: `A bag has ${r} red, ${b} blue and ${g} green marbles. You pick one, note its color and put it back, ${n} times. About how many times would you expect red?`,
            answer: String(r * k), wrong: [String(r), String(Math.round(n / 3)), String(n - r * k), String(r * k + k)],
            steps: [`P(red) = ${r}/${t}.`, `In ${n} picks, expect about ${r}/${t} × ${n} = ${r * k} reds.`, "It won't be exactly that every time: chance varies, but it gets close over many tries."],
          };
        }
      }
    },
  },
  {
    id: "g7-sample", grade: 7, area: "data", level: "intermediate", std: "7.SP.A.2", mp: "MP4",
    title: "Samples and predictions", blurb: "Use a fair sample to predict for everyone, and spot a sample that isn't fair.",
    make: ({ ri, pick }) => {
      if (ri(0, 2)) {
        const n = pick([20, 25, 40, 50]), m = ri(10, 30), N = n * m, k = ri(2, n - 2), ans = k * m;
        return {
          text: `In a random sample of ${n} students at a school of ${num(N)}, ${k} said they walk to school. About how many students at the school walk?`,
          answer: num(ans), wrong: [num(k), num(N - ans), num(k * 10), num(ans + m), num(n * k)],
          steps: [`${k} out of ${n} in the sample walk: that is ${frac(k, n)} of the sample.`, `The school is ${num(N)} ÷ ${n} = ${m} times as big as the sample.`, `So about ${k} × ${m} = ${num(ans)} students walk.`],
        };
      }
      const s = pick([
        { q: "favorite sport", bad: "The 50 students on the soccer team" },
        { q: "favorite lunch", bad: "The 50 students in the pizza club" },
        { q: "usual bedtime", bad: "50 students at a sleepover party" },
      ]);
      return {
        std: "7.SP.A.1",
        text: `Ms. Lee wants to know the ${s.q} of the 600 students at her school. Which sample is best?`,
        answer: "50 students picked at random from the whole school",
        wrong: [s.bad, "Her own class of 25 students", "The first 50 students to answer an online poll"],
        steps: ["A fair sample gives every student the same chance of being picked.", "Picking at random from the whole school does that. The others leave out most students, or only include people who already care about the question."],
      };
    },
  },
  {
    id: "g7-trip", grade: 7, area: "multistep", level: "advanced", std: "7.RP.A.3", mp: "MP1",
    title: "Plan a class trip", blurb: "Bus, tickets and a group discount: put the steps in the right order.",
    make: ({ ri, pick }) => {
      const n = ri(20, 30), share = ri(5, 12), bus = n * share, disc = pick([10, 20]);
      const p = disc === 10 ? pick([10, 20, 30]) : pick([10, 15, 20, 25]), pd = (p * (100 - disc)) / 100, f = (100 - disc) / 100;
      const intro = `Your class of ${n} students is going to the science museum. The bus costs ${usd(bus)} in total. Tickets are ${usd(p)} each, and groups of 20 or more get ${disc}% off tickets.`;
      const steps = [`Discount: ${disc}% of ${usd(p)} is ${usd(p - pd)}, so a ticket costs ${usd(pd)}.`, `The discount is on tickets only, not the bus.`];
      if (ri(0, 1)) {
        return {
          text: `${intro} If everyone pays the same amount, how much does each student pay?`,
          answer: usd(share + pd), wrong: [usd(share + p), usd((share + p) * f), usd(pd), usd(bus + pd)],
          steps: [...steps, `Bus share: ${usd(bus)} ÷ ${n} = ${usd(share)} each.`, `Each student pays ${usd(share)} + ${usd(pd)} = ${usd(share + pd)}.`],
        };
      }
      return {
        text: `${intro} What is the total cost of the trip?`,
        answer: usd(bus + n * pd), wrong: [usd(bus + n * p), usd(n * pd), usd((bus + n * p) * f), usd(bus + pd)],
        steps: [...steps, `Tickets: ${n} × ${usd(pd)} = ${usd(n * pd)}.`, `Total: ${usd(bus)} + ${usd(n * pd)} = ${usd(bus + n * pd)}.`],
      };
    },
  },
  {
    id: "g7-why", grade: 7, area: "reasoning", level: "advanced", std: "7.NS.A.2a", mp: "MP3",
    title: "Why does it work? Negatives", blurb: "Negative times negative, subtracting a negative, fractions as decimals.",
    make: (h) => h.pick(WHY7)(h),
  },

  /* ---------------- Grade 8 ---------------- */
  {
    id: "g8-two-way", grade: 8, area: "data", level: "easy", std: "8.SP.A.4", mp: "MP4",
    title: "Two-way tables", blurb: "Sort people two ways at once, then compare the right rows or columns.",
    make: ({ ri }) => {
      const a = ri(4, 30), b = ri(4, 30), c = ri(4, 30), d = ri(4, 30), t = a + b + c + d;
      const figure: Figure = {
        t: "table", head: ["", "Instrument", "No instrument", "Total"],
        rows: [["Sport", a, b, a + b], ["No sport", c, d, c + d], ["Total", a + c, b + d, t]],
      };
      const intro = "The table shows which students in Grade 8 play a sport and which play an instrument.";
      switch (ri(0, 2)) {
        case 0:
          return {
            text: `${intro} What fraction of the students who play an instrument also play a sport?`,
            answer: frac(a, a + c), wrong: [frac(a, t), frac(a, a + b), frac(c, a + c), frac(a + c, t), frac(a, b + d), frac(c, c + d)],
            steps: [`"Of the students who play an instrument" means use the Instrument column: ${a + c} students.`, `${a} of them play a sport: ${a}/${a + c}${frac(a, a + c) !== `${a}/${a + c}` ? ` = ${frac(a, a + c)}` : ""}.`],
            figure,
          };
        case 1:
          return {
            text: `${intro} What fraction of the students who play a sport do not play an instrument?`,
            answer: frac(b, a + b), wrong: [frac(b, t), frac(b, b + d), frac(a, a + b), frac(a + b, t), frac(d, c + d), frac(b, a + c)],
            steps: [`"Of the students who play a sport" means use the Sport row: ${a + b} students.`, `${b} of them have no instrument: ${b}/${a + b}${frac(b, a + b) !== `${b}/${a + b}` ? ` = ${frac(b, a + b)}` : ""}.`],
            figure,
          };
        default:
          return {
            text: `${intro} How many students do not play a sport?`,
            answer: String(c + d), wrong: [String(d), String(c), String(b + d), String(t - d)],
            steps: [`The No sport row has ${c} with an instrument and ${d} without.`, `${c} + ${d} = ${c + d}.`],
            figure,
          };
      }
    },
  },
  {
    id: "g8-function", grade: 8, area: "logic", level: "intermediate", std: "8.F.A.1", mp: "MP7",
    title: "Programs as functions", blurb: "A function gives exactly one output for each input. Run it, or find its rule.",
    make: ({ ri }) => {
      const lin = (m: number, b: number) => (b ? `y = ${m}x + ${b}` : `y = ${m}x`);
      switch (ri(0, 2)) {
        case 0: {
          const T = ri(5, 15), a = ri(2, 4), b = ri(1, 9), c = ri(2, 9), x = T + ri(-2, 3);
          const big = x > T, ans = big ? x * a - b : x + c;
          return {
            text: `What is f(${x})?`,
            answer: String(ans), wrong: [String(big ? x + c : x * a - b), String(big ? x * (a - b) : x * c), String(x * a + b), String(ans + 1)],
            steps: [`Is ${x} > ${T}? ${big ? "Yes" : x === T ? `No: ${x} equals ${T}, and the test is "greater than"` : "No"}.`, big ? `So f(${x}) = ${x} × ${a} − ${b} = ${ans}.` : `So f(${x}) = ${x} + ${c} = ${ans}.`],
            figure: { t: "code", lines: ["function f(n):", `  if n > ${T}:`, `    return n × ${a} − ${b}`, "  otherwise:", `    return n + ${c}`] },
          };
        }
        case 1: {
          const s = ri(1, 5), L = [50, 100, 200][ri(0, 2)];
          let n = s, k = 0;
          const trail = [s];
          while (n < L) { n *= 2; k++; trail.push(n); }
          return {
            text: "What does this program say at the end?",
            answer: String(k), wrong: [String(k + 1), String(k - 1), String(n), String(k + 2)],
            steps: [`Double until the number is at least ${L}: ${trail.join(" → ")}.`, `That took ${k} doubles, so steps = ${k}.`],
            figure: { t: "code", lines: [`set n to ${s}`, "set steps to 0", `while n < ${L}:`, "  multiply n by 2", "  add 1 to steps", "say steps"] },
          };
        }
        default: {
          const m = ri(2, 6), b = ri(1, 9), xs = [1, 2, 3, 5], f = (x: number) => m * x + b;
          const cands: [number, number][] = [[1, f(1) - 1], [b, m], [m + 1, b - 1], [m, 0], [m - 1, b + 1]];
          return {
            text: "Which rule matches every row of the table?",
            answer: lin(m, b),
            wrong: cands.filter(([p, q]) => !xs.every((x) => p * x + q === f(x))).map(([p, q]) => lin(p, q)),
            steps: [`When x goes up by 1, y goes up by ${m}, so the rule is y = ${m}x + something.`, `When x = 1, ${m} × 1 + ${b} = ${f(1)}, so the something is ${b}.`, `Check x = 5: ${m} × 5 + ${b} = ${f(5)}. ✓`],
            figure: { t: "table", head: ["x", "y"], rows: xs.map((x) => [x, f(x)]) },
          };
        }
      }
    },
  },
  {
    id: "g8-plans", grade: 8, area: "multistep", level: "advanced", std: "8.EE.C.8c", mp: "MP1",
    title: "Compare two plans", blurb: "Monthly fee plus a rate, or one flat price? Find when they cost the same.",
    make: ({ ri, pick }) => {
      const F = ri(10, 25), r = pick([2, 3, 4, 5]), k = ri(4, 12), G = F + r * k;
      const intro = `Phone plan A costs ${usd(F)} a month plus ${usd(r)} for each GB of data. Plan B costs ${usd(G)} a month with unlimited data.`;
      const cost = (u: number) => F + r * u;
      switch (ri(0, 2)) {
        case 0:
          return {
            text: `${intro} For how many GB a month do the two plans cost the same?`,
            answer: String(k), wrong: [String(G - F), G % r ? "" : String(G / r), String(k + 1), String(k - 1)],
            steps: [`Plan A costs ${F} + ${r}g dollars for g GB. Plan B always costs ${G}.`, `Set them equal: ${F} + ${r}g = ${G}, so ${r}g = ${G - F}.`, `g = ${G - F} ÷ ${r} = ${k} GB.`],
          };
        case 1: {
          const u = k + pick([-3, -2, 2, 3]), diff = Math.abs(cost(u) - G), cheap = cost(u) < G ? "A" : "B", other = cheap === "A" ? "B" : "A";
          return {
            text: `${intro} ${pick(NAMES)} uses ${u} GB a month. Which plan is cheaper, and by how much?`,
            answer: `Plan ${cheap}, by ${usd(diff)}`,
            wrong: [`Plan ${other}, by ${usd(diff)}`, `Plan ${cheap}, by ${usd(diff + r)}`, "They cost the same", `Plan ${cheap}, by ${usd(cost(u))}`],
            steps: [`Plan A: ${usd(F)} + ${u} × ${usd(r)} = ${usd(cost(u))}. Plan B: ${usd(G)}.`, `Plan ${cheap} is cheaper by ${usd(diff)}.`, `Below ${k} GB plan A wins; above ${k} GB plan B wins.`],
          };
        }
        default: {
          const u = ri(3, 15), wrong = (F + r) * u;
          return {
            text: `${intro} A chatbot says: "If you use ${u} GB, plan A costs ${usd(wrong)}." What does plan A really cost?`,
            answer: usd(cost(u)), wrong: [usd(wrong), usd(r * u), usd(G), usd(F + r + u)],
            steps: [`The ${usd(F)} is charged once a month. Only the ${usd(r)} is charged per GB.`, `${usd(F)} + ${u} × ${usd(r)} = ${usd(cost(u))}.`, `The chatbot multiplied the monthly fee by ${u} too. A quick check: ${usd(wrong)} is more than plan B's ${usd(G)} for any amount of data.`],
          };
        }
      }
    },
  },
];

export function getThinkTopic(id: string): ThinkTopic | undefined {
  return THINKING_TOPICS.find((t) => t.id === id);
}

export function isFreeTopic(t: ThinkTopic): boolean {
  return LEVELS.find((l) => l.id === t.level)!.free;
}

const NUMERIC = /^\$?-?[\d,]+(\.\d+)?$/;
const neg = (s: string) => s.startsWith("-") || s.startsWith("$-");

export function thinkingQuestion(topic: ThinkTopic, r: Rng): Question {
  const h = helpers(r);
  const m = topic.make(h);
  const choices = [m.answer];
  for (const w of m.wrong) {
    if (choices.length >= 4) break;
    if (!w || choices.includes(w) || (neg(w) && !neg(m.answer))) continue;
    choices.push(w);
  }
  // Top up numeric answers with nearby numbers in the same form.
  if (choices.length < 4 && NUMERIC.test(m.answer)) {
    const v = Number(m.answer.replace(/[$,]/g, "")), money = m.answer.startsWith("$");
    for (let k = 1; choices.length < 4; k++) {
      for (const x of [v + k, v - k]) {
        const c = money ? usd(x) : num(x);
        if (choices.length < 4 && x >= 0 && !choices.includes(c)) choices.push(c);
      }
    }
  }
  if (choices.length < 4) throw new Error(`${topic.id}: not enough choices for "${m.text}"`);
  return {
    grade: topic.grade,
    text: m.text,
    std: m.std ?? topic.std,
    answer: m.answer,
    choices: h.shuffle(choices),
    figure: m.figure,
    steps: m.steps,
  };
}
