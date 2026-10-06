import type { BarModelSpec } from "./models";
import type { Grade } from "./questions";

export interface LessonStep {
  model: BarModelSpec;
  caption: string;
}

export interface Lesson {
  id: string;
  grade: Grade;
  title: string;
  std: string;
  problem: string;
  /** Grade 1's number bond lesson is an interactive slider instead of steps. */
  kind: "steps" | "bond-slider";
  steps: LessonStep[];
}

/** One worked bar-model lesson per grade, Concrete → Pictorial → Abstract. */
export const LESSONS: Lesson[] = [
  {
    id: "g1-bonds", grade: 1, kind: "bond-slider", std: "1.OA.C.6",
    title: "Number bonds: split a whole",
    problem: "Slide to split 10 into two parts. Every split is a fact family: part + part = whole.",
    steps: [],
  },
  {
    id: "g2-compare", grade: 2, kind: "steps", std: "2.OA.A.1",
    title: "Comparison bars: how many more?",
    problem: "Mei has 34 stickers. Sam has 15 more than Mei. How many stickers does Sam have?",
    steps: [
      { model: { t: "pw", parts: [34], labels: ["Mei"], unk: null }, caption: "Step 1. Draw a bar for Mei's 34 stickers." },
      { model: { t: "cmp", a: 34, b: 49, names: ["Mei", "Sam"] }, caption: "Step 2. Sam's bar is the same as Mei's, plus 15 more." },
      { model: { t: "pw", parts: [34, 15], labels: ["", "more"], unk: null }, caption: "Step 3. Sam = 34 + 15 = 49 stickers." },
    ],
  },
  {
    id: "g3-groups", grade: 3, kind: "steps", std: "3.OA.A.3",
    title: "Equal groups as units",
    problem: "There are 4 boxes with 6 pencils in each box. How many pencils altogether?",
    steps: [
      { model: { t: "units", n: 4, shade: 0, unit: null, total: null, note: "Each box is one unit." }, caption: "Step 1. Draw 4 equal units, one for each box." },
      { model: { t: "units", n: 4, shade: 4, unit: 6, total: null, note: "1 unit = 6 pencils." }, caption: "Step 2. Write 6 in every unit." },
      { model: { t: "units", n: 4, shade: 4, unit: 6, total: 24, note: "4 units = 4 × 6 = 24." }, caption: "Step 3. 4 units = 4 × 6 = 24 pencils." },
    ],
  },
  {
    id: "g4-fractions", grade: 4, kind: "steps", std: "4.NF.B.3",
    title: "Adding fractions with the same denominator",
    problem: "What is 2/8 + 3/8?",
    steps: [
      { model: { t: "units", n: 8, shade: 0, unit: null, total: null, note: "The whole is cut into 8 equal parts (eighths)." }, caption: "Step 1. Cut one bar into 8 equal units." },
      { model: { t: "units", n: 8, shade: 2, unit: null, total: null, note: "2 of 8 units shaded." }, caption: "Step 2. Shade 2 units for 2/8." },
      { model: { t: "units", n: 8, shade: 5, unit: null, total: null, note: "2 + 3 = 5 of 8 units shaded." }, caption: "Step 3. Shade 3 more. That is 5 units, so 2/8 + 3/8 = 5/8." },
    ],
  },
  {
    id: "g5-unit-method", grade: 5, kind: "steps", std: "5.NF.B.6",
    title: "The unit method: 3/5 of 40",
    problem: "3/5 of the 40 students in a class are girls. How many girls?",
    steps: [
      { model: { t: "pw", parts: [40], labels: ["students"], unk: null }, caption: "Step 1. Draw one bar for all 40 students." },
      { model: { t: "units", n: 5, shade: 0, unit: null, total: 40 }, caption: "Step 2. The fraction is in fifths, so cut the bar into 5 equal units." },
      { model: { t: "units", n: 5, shade: 0, unit: 8, total: 40 }, caption: "Step 3. 5 units = 40, so 1 unit = 40 ÷ 5 = 8." },
      { model: { t: "units", n: 5, shade: 3, unit: 8, total: 40 }, caption: "Step 4. Girls are 3 units: 3 × 8 = 24 girls." },
    ],
  },
  {
    id: "g6-ratio", grade: 6, kind: "steps", std: "6.RP.A.3",
    title: "Ratio with bar models",
    problem: "The ratio of red to blue marbles is 2 : 3. There are 40 marbles. How many are blue?",
    steps: [
      { model: { t: "ratio", r: 2, b: 3, total: 40 }, caption: "Step 1. Draw 2 red units and 3 blue units, all the same size." },
      { model: { t: "units", n: 5, shade: 0, unit: 8, total: 40, note: "5 units = 40, so 1 unit = 8." }, caption: "Step 2. 2 + 3 = 5 units = 40, so 1 unit = 8." },
      { model: { t: "units", n: 5, shade: 3, unit: 8, total: 40, note: "Blue is 3 units." }, caption: "Step 3. Blue = 3 units = 3 × 8 = 24 marbles." },
    ],
  },
  {
    id: "g7-percent", grade: 7, kind: "steps", std: "7.RP.A.3",
    title: "Percent discount as units",
    problem: "A jacket costs $80. It is 25% off. What is the sale price?",
    steps: [
      { model: { t: "units", n: 4, shade: 0, unit: null, total: 80, note: "25% is 1 out of 4 equal parts." }, caption: "Step 1. 25% = 1/4, so cut the $80 bar into 4 units." },
      { model: { t: "units", n: 4, shade: 0, unit: 20, total: 80 }, caption: "Step 2. 1 unit = $80 ÷ 4 = $20. That is the discount." },
      { model: { t: "units", n: 4, shade: 3, unit: 20, total: 80, note: "You pay for the 3 shaded units." }, caption: "Step 3. Sale price = 3 units = 3 × $20 = $60." },
    ],
  },
  {
    id: "g8-equations", grade: 8, kind: "steps", std: "8.EE.C.7",
    title: "From bar models to equations",
    problem: "Solve 3x + 4 = 19.",
    steps: [
      { model: { t: "eq", n: 3, c: 4, total: 19, x: null }, caption: "Step 1. Draw 3 units of x and a piece worth 4. Together they make 19." },
      { model: { t: "units", n: 3, shade: 0, unit: null, total: 15, note: "19 − 4 = 15 is left for the 3 units." }, caption: "Step 2. Take away the 4: 3 units = 19 − 4 = 15, so 3x = 15." },
      { model: { t: "eq", n: 3, c: 4, total: 19, x: 5 }, caption: "Step 3. 1 unit = 15 ÷ 3 = 5, so x = 5. Check: 3 × 5 + 4 = 19." },
    ],
  },
];
