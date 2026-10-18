/**
 * Figures that a question needs to be read with (a graph, a table, a short program).
 * Unlike a bar model, which is the worked solution, a figure is always shown.
 * Plain data, so questions can be generated on the server.
 */
export type Figure =
  /** Bar graph. `min` is where the value axis starts: anything but 0 makes a misleading graph. */
  | { t: "bar"; title: string; labels: string[]; values: number[]; step: number; min?: number; unit?: string }
  /** Picture graph: each symbol stands for `key` of `noun`. */
  | { t: "pict"; title: string; labels: string[]; counts: number[]; key: number; noun: string }
  /** Dot plot (Massachusetts calls a line plot a dot plot): `counts[i]` dots above the value `start + i`. */
  | { t: "dots"; title: string; start: number; counts: number[]; unit: string }
  | { t: "table"; head: string[]; rows: (string | number)[][] }
  /** Number line: evenly spaced ticks (blank labels allowed) with an arrow at tick `arrow`. */
  | { t: "line"; ticks: string[]; arrow: number }
  /** A short program in plain words, one line each. Indent with two spaces. */
  | { t: "code"; lines: string[] }
  /**
   * Pictures to count (Kindergarten): one row per group, each picture a big emoji. The last
   * `gone` pictures in a row are crossed out (taken away). `label` names the row.
   */
  | { t: "pics"; rows: { icons: string[]; label?: string; gone?: number }[] }
  /** Ten frames (one, or two for 11 to 20) with `filled` counters, filled left to right, top row first. */
  | { t: "frame"; filled: number; frames: 1 | 2 }
  /** One flat shape, drawn big. */
  | { t: "shape"; shape: Shape; color: ShapeColor; turn: number };

export type Shape = "circle" | "square" | "triangle" | "rectangle" | "hexagon" | "pentagon";
export type ShapeColor = "red" | "blue" | "green" | "yellow" | "purple" | "orange";
