/**
 * Read-aloud text for a question, for children who are still learning to read
 * (Kindergarten and Grade 1). The browser's speech synthesis says it out loud.
 */
import type { Question } from "./questions";

/** Sums written the way they are said: "7 − 3 = ?" → "7 minus 3 equals what?" */
export function sayMath(s: string): string {
  return s
    .replace(/\s*\+\s*/g, " plus ")
    .replace(/\s*[−-]\s*(?=\d)/g, " minus ")
    .replace(/\s*=\s*\?/g, " equals what?")
    .replace(/\s*=\s*/g, " equals ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The question, any second line, then the choices: "… Is it 3, 5, 7 or 9?" */
export function spokenText(q: Question): string {
  const choices = q.choices.length > 1 ? `Is it ${q.choices.slice(0, -1).join(", ")} or ${q.choices[q.choices.length - 1]}?` : "";
  return [q.text, q.ask ?? "", choices].filter(Boolean).map(sayMath).join(" ");
}

/** Grades that get a "Read it to me" button. */
export const readsAloud = (q: Question) => q.grade <= 1;
