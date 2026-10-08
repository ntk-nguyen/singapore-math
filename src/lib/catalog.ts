/**
 * What a child can do in each grade, grouped the way parents think about math
 * (bar models, numbers, fractions, algebra, data & thinking) for the Learn home page. Nothing new
 * is taught here: every item links to a lesson or practice set that already exists.
 */
import { TOPICS, type Op } from "./arithmetic";
import { FRACTION_TOPICS } from "./fractions";
import { LESSONS } from "./lessons";
import { KINDS, LEVELS, type Kind, type Level } from "./problems";
import type { Grade } from "./questions";
import { AREAS, isFreeTopic, THINKING_TOPICS } from "./thinking";

export interface CatalogItem {
  href: string;
  title: string;
  blurb: string;
  /** Key into progress.best for a "Best: n%" badge. */
  bestKey?: string;
  /** Lesson id, for a "Done" badge once it has been stepped through. */
  lessonId?: string;
  /** False when the Pro plan is needed. */
  free: boolean;
  /** The pathway unit this item sits in, when its area splits into smaller units (e.g. Multiplication). */
  unit?: UnitTag;
}

export interface UnitTag {
  id: string;
  title: string;
}

const OP_UNIT: Record<Op, UnitTag> = {
  make10: { id: "add-sub", title: "Addition & subtraction" },
  add: { id: "add-sub", title: "Addition & subtraction" },
  sub: { id: "add-sub", title: "Addition & subtraction" },
  mul: { id: "mul", title: "Multiplication" },
  div: { id: "div", title: "Division" },
};

export type DomainId = "bar-models" | "numbers" | "fractions" | "algebra" | "thinking";

export interface Domain {
  id: DomainId;
  title: string;
  blurb: string;
  /** The page listing every grade's topics in this area. */
  seeAll: { href: string; label: string };
  items: CatalogItem[];
}

/** Which word-problem level fits each grade (see the level blurbs in problems.ts). */
const WORD_LEVEL: Partial<Record<Grade, Level>> = { 1: "easy", 2: "easy", 3: "easy", 4: "intermediate", 5: "intermediate", 6: "advanced" };
const EQUATION_LEVEL: Partial<Record<Grade, Level>> = { 6: "easy", 7: "intermediate", 8: "advanced" };

function practiceSet(kind: Kind, level: Level): CatalogItem {
  const info = LEVELS.find((l) => l.id === level)!;
  return {
    href: info.free ? `/problem-solving/${kind}/${level}` : "/problem-solving",
    title: `${KINDS[kind].title}: ${info.label.toLowerCase()}`,
    blurb: KINDS[kind].blurb[level].replace(/\s*\(Grades? [^)]*\)/, ""),
    bestKey: `ps-${kind}-${level}`,
    free: info.free,
  };
}

export function gradeCatalog(grade: Grade): Domain[] {
  const lesson = LESSONS.find((l) => l.grade === grade);
  const word = WORD_LEVEL[grade];
  const eq = EQUATION_LEVEL[grade];

  const domains: Domain[] = [
    {
      id: "bar-models",
      title: "Bar models & word problems",
      blurb: "Draw the problem, then solve it.",
      seeAll: { href: "/problem-solving", label: "All word problems" },
      items: [
        ...(lesson ? [{ href: `/lessons#${lesson.id}`, title: lesson.title, blurb: "Step-by-step bar model lesson.", lessonId: lesson.id, free: true }] : []),
        ...(word ? [practiceSet("word", word)] : []),
      ],
    },
    {
      id: "numbers",
      title: "Numbers & operations",
      blurb: "Add, subtract, multiply and divide with place value.",
      seeAll: { href: "/number-skills", label: "All number skills" },
      items: TOPICS.filter((t) => t.grade === grade).map((t) => ({
        href: `/number-skills/${t.id}`, title: t.title, blurb: t.blurb, bestKey: `ns-${t.id}`, free: true, unit: OP_UNIT[t.op],
      })),
    },
    {
      id: "fractions",
      title: "Fractions & decimals",
      blurb: "Bars cut into equal parts.",
      seeAll: { href: "/fractions", label: "All fractions & decimals" },
      items: FRACTION_TOPICS.filter((t) => t.grade === grade).map((t) => ({
        href: `/fractions/${t.id}`, title: t.title, blurb: t.blurb, bestKey: `fd-${t.id}`, free: true,
        unit: t.strand === "decimals" ? { id: "decimals", title: "Decimals" } : { id: "fractions", title: "Fractions" },
      })),
    },
    {
      id: "algebra",
      title: "Algebra",
      blurb: "The same bars, now with x.",
      seeAll: { href: "/problem-solving", label: "All equations" },
      items: eq ? [practiceSet("equations", eq)] : [],
    },
    {
      id: "thinking",
      title: "Data & thinking",
      blurb: "Graphs, chance, logic and checking answers.",
      seeAll: { href: "/thinking", label: "All data & thinking" },
      items: THINKING_TOPICS.filter((t) => t.grade === grade).map((t) => ({
        // Locked topics go to the page that offers the Pro plan.
        href: isFreeTopic(t) ? `/thinking/${t.id}` : "/thinking", title: t.title, blurb: t.blurb, bestKey: `dt-${t.id}`, free: isFreeTopic(t),
        unit: { id: `dt-${t.area}`, title: AREAS.find((a) => a.id === t.area)!.title },
      })),
    },
  ];
  return domains.filter((d) => d.items.length > 0);
}
