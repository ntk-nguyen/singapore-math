/**
 * Bar model specs. These are plain data so questions can be generated on the server
 * and rendered by <BarModel /> on the client.
 */
export type BarModelSpec =
  /** Number bond: whole on top, two parts below. A null part is the unknown. */
  | { t: "bond"; w: number; p: [number | null, number | null] }
  /** Part-whole: one bar split into labelled parts. `unk` is the unknown part index, or "whole". */
  | { t: "pw"; parts: number[]; labels: string[]; unk: number | "whole" | null; whole?: number }
  /** Comparison: two bars, the second longer by b - a. `unk` marks what is asked (default: the longer bar). */
  | { t: "cmp"; a: number; b: number; names: [string, string]; unk?: "small" | "big" | "diff"; total?: number }
  /** Equal units: n units, the first `shade` shaded. */
  | { t: "units"; n: number; shade: number; unit: number | null; total: number | null; note?: string }
  /** Ratio: r red units against b blue units. */
  | { t: "ratio"; r: number; b: number; total: number; names?: [string, string]; noun?: string }
  /** Equation: n units of x plus a constant c make total. */
  | { t: "eq"; n: number; c: number; total: number; x: number | null };
