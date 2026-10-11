import type { Method } from "./arithmetic";
import type { Figure } from "./figures";
import type { BarModelSpec } from "./models";
import { QUICK } from "./quickfire";
import { deck, helpers, type Rng } from "./rng";
import { noRepeats, render, shiftTier, type Tier } from "./templates";

export { NAMES } from "./templates";

/** 0 is Kindergarten. */
export type Grade = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const GRADES: Grade[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/** "Kindergarten" or "Grade 3". */
export const gradeName = (g: Grade): string => (g === 0 ? "Kindergarten" : `Grade ${g}`);
/** "K" or "3", as on a grade chip and at the start of a Common Core code (K.CC.A.1, 3.OA.A.3). */
export const gradeCode = (g: Grade) => (g === 0 ? "K" : String(g));

/**
 * How a question is asked. Plain multiple choice when omitted. The answer is typed for
 * "typein" and "blank", tapped in sequence for "order", several choices are picked for
 * "multi", one choice per part for "twopart", and one choice for everything else.
 */
export type Format =
  | "choice" | "typein" | "blank" | "truefalse" | "mistake" | "estimate" | "model"
  | "graph" | "numberline" | "oddone" | "order" | "balance" | "multi" | "twopart";

/** One part of a two-part question: its own question and choices. */
export interface Part {
  text: string;
  choices: string[];
  answer: string;
}

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
  /** For "multi": every right choice, in the order the choices are shown. `answer` lists them joined by " and ". */
  answers?: string[];
  /** For "twopart": Part A and Part B. `text` sets the scene and `answer` gives both parts' answers. */
  parts?: Part[];
  /** Wrong answers and the mistake each comes from (for "find the mistake"). */
  mistakes?: { answer: string; why: string }[];
  /** Shown after answering, e.g. the real answer behind a true/false. */
  explain?: string;
}

/** Common Core code of each quick-fire template at a grade, in template order. */
export function generatorStds(grade: Grade): string[] {
  return QUICK[grade].map((t) => t.std);
}

/** The difficulty tier (0 easy, 1 medium, 2 hard) of each quick-fire template at a grade, in template order. */
export function generatorTiers(grade: Grade): Tier[] {
  return QUICK[grade].map((t) => t.tier);
}

export function generatorCount(grade: Grade): number {
  return QUICK[grade].length;
}

/**
 * Make one question for a grade. With `index`, templates are cycled in order so a
 * test covers every standard for the grade; without it, one is picked at random.
 * `shift` draws the template a tier easier (-1) or harder (+1) than usual.
 */
export function makeQuestion(grade: Grade, r: Rng, index?: number, shift = 0): Question {
  const list = QUICK[grade];
  const tpl = index == null ? helpers(r).pick(list) : list[index % list.length];
  return render(tpl, r, shiftTier(tpl.tier, shift)).question;
}

export function isGrade(n: unknown): n is Grade {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 8;
}

/**
 * Questions for a Play session at a grade. The question types are dealt like a shuffled
 * deck, so every type comes up once before any comes up again, and no question repeats.
 */
export function playDeck(grade: Grade, r: Rng): () => Question {
  const nextTemplate = deck(QUICK[grade], r);
  return noRepeats(() => render(nextTemplate(), r).question);
}
