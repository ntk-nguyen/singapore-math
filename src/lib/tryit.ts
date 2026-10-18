import { helpers, type Rng } from "./rng";

/** The "times as many" sharing problem on the home page: two people share a total, one has k times the other. */
export interface TryIt {
  names: [string, string];
  noun: string;
  /** The bigger share is k units; the smaller is 1 unit. */
  k: number;
  unit: number;
  total: number;
  /** Step 2 choices: how many units in all. */
  unitChoices: number[];
  /** Step 3 choices: the smaller share. */
  answerChoices: number[];
}

const PAIRS: [string, string][] = [["Ali", "Mei"], ["Sam", "Priya"], ["Leo", "Ana"], ["Kai", "Zoe"]];
const NOUNS = ["marbles", "stickers", "stamps", "cards"];

/** The first problem every visitor sees, so the page reads the same on the server and the client. */
export const FIRST: TryIt = make(["Ali", "Mei"], "marbles", 3, 10, ([right, ...wrong]) => [wrong[0], right, wrong[1]]);

export function tryIt(r: Rng): TryIt {
  const { ri, pick, shuffle } = helpers(r);
  return make(pick(PAIRS), pick(NOUNS), ri(2, 4), ri(4, 12), shuffle);
}

function make(names: [string, string], noun: string, k: number, unit: number, shuffle: (a: number[]) => number[]): TryIt {
  const total = (k + 1) * unit;
  // Wrong answers are the real slips: forgetting the smaller bar's unit, giving the bigger share, subtracting instead of dividing.
  return {
    names, noun, k, unit, total,
    unitChoices: shuffle(distinct(k + 1, [k, total])),
    answerChoices: shuffle(distinct(unit, [k * unit, total - (k + 1)])),
  };
}

function distinct(right: number, wrong: number[]): number[] {
  const out = [right];
  for (const w of wrong) out.push(out.includes(w) || w <= 0 ? Math.max(...out) + 1 : w);
  return out;
}
