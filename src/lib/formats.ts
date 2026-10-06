/**
 * Question formats. A generator makes a multiple-choice question; `vary` then asks
 * the same question another way (type the answer, true or false, find the mistake,
 * estimate, or with the bar model shown) so a practice set is not one format all the
 * way through. Templates can also be written in a fixed format (odd one out, put in
 * order, number line, balance, fill in the blank), which `vary` leaves alone.
 */
import type { Format, Question } from "./questions";
import { helpers, type Rng } from "./rng";
import { NAMES, valueOf } from "./templates";

export const FORMAT_LABEL: Record<Format, string> = {
  choice: "Multiple choice",
  typein: "Type your answer",
  blank: "Fill in the blank",
  truefalse: "True or false",
  mistake: "Find the mistake",
  estimate: "Estimate",
  model: "Use the bar model",
  graph: "Read the graph",
  numberline: "Number line",
  oddone: "Odd one out",
  order: "Put in order",
  balance: "Balance it",
};

export function formatOf(q: Question): Format {
  return q.format ?? (q.figure ? "graph" : "choice");
}

/** How the child answers: tap a choice, type it, or tap items in order. */
export function inputOf(q: Question): "choose" | "type" | "order" {
  const f = formatOf(q);
  return f === "typein" || f === "blank" ? "type" : f === "order" ? "order" : "choose";
}

const REMAINDER = /^(\d+) ?R ?(\d+)$/i;
const tidy = (s: string) => s.trim().replace(/[$,]/g, "").replace(/\s+/g, " ").replace("−", "-").toLowerCase();

/** Answers a child can type: numbers, money, fractions, mixed numbers, percents, remainders. */
export function typeable(answer: string): boolean {
  return Number.isFinite(valueOf(answer)) || REMAINDER.test(answer);
}

/** Is `given` right? Typed answers are matched by value, so "$12", "12" and "12.00" all count. */
export function isRight(q: Question, given: string): boolean {
  if (inputOf(q) !== "type") return given === q.answer;
  const a = tidy(q.answer), g = tidy(given);
  if (a === g) return true;
  const ra = a.match(REMAINDER), rg = g.match(REMAINDER);
  if (ra || rg) return !!ra && !!rg && ra[1] === rg[1] && ra[2] === rg[2];
  const va = valueOf(a), vg = valueOf(g);
  return Number.isFinite(va) && Number.isFinite(vg) && Math.abs(va - vg) < 1e-9;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const plain = (n: number) => n.toLocaleString("en-US");

/** Choices for "which is the best estimate?", or null when the answer is too small or already round. */
function estimate(q: Question): { answer: string; choices: string[] } | null {
  const money = q.answer.startsWith("$"), v = valueOf(q.answer);
  if (!/^\$?[\d,]+(\.\d+)?$/.test(q.answer) || !(v >= 30)) return null;
  const digits = Math.floor(Math.log10(v));
  let place = 10 ** digits;
  if (Math.floor(v / place) === 1) place /= 10;
  const est = Math.round(v / place) * place;
  if (est === v || Math.abs(v - est) * 2 === place) return null;
  const write = (n: number) => (money ? "$" : "") + plain(n);
  const out = [est, est * 10, est + place, est - place, est / 10].filter((x, i, a) => x > 0 && Number.isInteger(x) && a.indexOf(x) === i);
  return out.length >= 4 ? { answer: write(est), choices: out.slice(0, 4).map(write) } : null;
}

type Way = "choice" | "typein" | "truefalse" | "mistake" | "estimate" | "model" | "order";

const COMPARE = /^Which (fraction|decimal|number) is the (greatest|least)\?$/;

/** A "Which is greatest?" question whose four choices can be put in order instead. */
function orderable(q: Question): boolean {
  const vals = q.choices.map(valueOf);
  return COMPARE.test(q.text) && vals.every(Number.isFinite) && new Set(vals).size === vals.length;
}

/** The ways a question can be asked, with how often each is picked. */
export function ways(q: Question): [Way, number][] {
  const base = formatOf(q);
  if (base !== "choice" && base !== "graph") return [["choice", 1]];
  // When the choices are the question ("Which is greatest?"), it is asked with them, or as putting them in order.
  if (!/\d/.test(q.text) && !q.figure) return orderable(q) ? [["choice", 1], ["order", 1]] : [["choice", 1]];
  const out: [Way, number][] = [["choice", 2.5]];
  if (typeable(q.answer) && !q.choices.some((c) => c.length > 14)) out.push(["typein", 2]);
  if (q.choices.length > 1) out.push(["truefalse", 2]);
  if ((q.mistakes?.length ?? 0) >= 3) out.push(["mistake", 2]);
  if (!q.figure && estimate(q)) out.push(["estimate", 1]);
  if (q.model && !q.figure) out.push(["model", 1]);
  return out;
}

/** Ask the question one of the ways it allows, picked at random (weighted). */
export function vary(q: Question, r: Rng): Question {
  const h = helpers(r);
  const options = ways(q);
  let x = r() * options.reduce((s, [, w]) => s + w, 0);
  const way = options.find(([, w]) => (x -= w) < 0)?.[0] ?? "choice";
  return askAs(q, way, h);
}

export function askAs(q: Question, way: Way, h: ReturnType<typeof helpers>): Question {
  const name = h.pick(NAMES);
  const wrong = q.choices.filter((c) => c !== q.answer);
  switch (way) {
    case "choice":
      return q;
    case "typein":
      return { ...q, format: "typein" };
    case "model":
      return { ...q, format: "model", ask: "Use the bar model to help you." };
    case "truefalse": {
      const right = h.ri(0, 1) === 1, shown = right ? q.answer : h.pick(q.mistakes?.length ? q.mistakes.map((m) => m.answer) : wrong);
      return {
        ...q, format: "truefalse", ask: `${name} says the answer is ${shown}. True or false?`,
        answer: right ? "True" : "False", choices: ["True", "False"],
        explain: right ? `${shown} is right.` : `The answer is ${q.answer}, not ${shown}.`,
      };
    }
    case "mistake": {
      const ms = h.shuffle(q.mistakes!), [m] = ms;
      const choices = h.shuffle(ms.slice(0, 4).map((x) => cap(x.why)));
      return {
        ...q, format: "mistake", ask: `${name} got ${m.answer}. What mistake did ${name} make?`,
        answer: cap(m.why), choices, explain: `The right answer is ${q.answer}.`,
      };
    }
    case "order": {
      const items = [...q.choices].sort((a, b) => valueOf(a) - valueOf(b));
      const what = q.text.match(COMPARE)![1];
      return { ...q, format: "order", text: `Put these ${what === "fraction" ? "fractions" : what === "decimal" ? "decimals" : "numbers"} in order from least to greatest.`, items: h.shuffle(items), answer: items.join(", "), choices: [] };
    }
    case "estimate": {
      const e = estimate(q)!;
      return { ...q, format: "estimate", ask: "Don't work it out exactly. Which is the best estimate?", answer: e.answer, choices: h.shuffle(e.choices), explain: `The exact answer is ${q.answer}.` };
    }
  }
}
