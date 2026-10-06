import type { Method } from "./arithmetic";
import type { Figure } from "./figures";
import type { BarModelSpec } from "./models";
import { QUICK } from "./quickfire";
import { deck, helpers, type Rng } from "./rng";
import { noRepeats, render } from "./templates";

export { NAMES } from "./templates";

export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const GRADES: Grade[] = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * How a question is asked. Plain multiple choice when omitted. The answer is typed for
 * "typein" and "blank", tapped in sequence for "order", and chosen for everything else.
 */
export type Format =
  | "choice" | "typein" | "blank" | "truefalse" | "mistake" | "estimate" | "model"
  | "graph" | "numberline" | "oddone" | "order" | "balance";

export interface Question {
  grade: Grade;
  text: string;
  std: string;
  answer: string;
  choices: string[];
  model?: BarModelSpec;
  /** Worked method (place-value discs, area model, long division) shown on "Show me how". */
  method?: Method;
  /** Worked solution, shown with the bar model on "Show me how". */
  steps?: string[];
  /** A graph, table or program the question is about, always shown. */
  figure?: Figure;
  format?: Format;
  /** A second line under the question, like "Mia says the answer is 42. True or false?" */
  ask?: string;
  /** For "order": the items to put in order. The answer lists them in order, joined by ", ". */
  items?: string[];
  /** Wrong answers and the mistake each comes from (for "find the mistake"). */
  mistakes?: { answer: string; why: string }[];
  /** Shown after answering, e.g. the real answer behind a true/false. */
  explain?: string;
}

/** Common Core code of each quick-fire template at a grade, in template order. */
export function generatorStds(grade: Grade): string[] {
  return QUICK[grade].map((t) => t.std);
}

export function generatorCount(grade: Grade): number {
  return QUICK[grade].length;
}

/**
 * Make one question for a grade. With `index`, templates are cycled in order so a
 * test covers every standard for the grade; without it, one is picked at random.
 */
export function makeQuestion(grade: Grade, r: Rng, index?: number): Question {
  const list = QUICK[grade];
  const tpl = index == null ? helpers(r).pick(list) : list[index % list.length];
  return render(tpl, r).question;
}

export function isGrade(n: unknown): n is Grade {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 8;
}

/**
 * Questions for a Play session at a grade. The question types are dealt like a shuffled
 * deck, so every type comes up once before any comes up again, and no question repeats.
 */
export function playDeck(grade: Grade, r: Rng): () => Question {
  const nextTemplate = deck(QUICK[grade], r);
  return noRepeats(() => render(nextTemplate(), r).question);
}
