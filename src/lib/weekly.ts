/**
 * The weekly summary on the Parents page: what each child finished in the last seven days,
 * where they scored well, and where they need more practice. Built only from the progress
 * already kept per child (daily XP, things finished, and each practice set's score).
 */
import { dayKey, type Days } from "./activity";
import { gradeCatalog } from "./catalog";
import type { Grade } from "./questions";

/** An average at or above this is a strength; below WEAK it needs practice. */
export const STRONG = 80;
export const WEAK = 70;
/** How many strengths and weak spots to show per child. */
const SHOW = 3;
/** Scores that are not a percent (a sprint counts facts) or not a skill (placement adapts), so they aren't rated. */
const UNRATED = new Set(["placement", "tt-sprint"]);

export interface PracticeName {
  title: string;
  /** Where to practise it again. */
  href: string;
}

export type Names = Map<string, PracticeName>;

/**
 * Every best-score key the app writes, with a name a parent would recognize. Test names are
 * passed in, so the browser doesn't load the question bank just to name a test.
 */
export function practiceNames(tests: { id: string; name: string }[]): Names {
  const names: Names = new Map();
  for (const t of tests) names.set(t.id, { title: t.name, href: `/tests/${t.id}` });
  names.set("tt-sprint", { title: "Times-table sprint", href: "/times-tables" });
  for (let g = 0; g <= 8; g++) {
    names.set(`play-g${g}`, { title: g === 0 ? "Quick play, Kindergarten" : `Quick play, Grade ${g}`, href: "/play" });
    for (const d of gradeCatalog(g as Grade)) for (const i of d.items) if (i.bestKey) names.set(i.bestKey, { title: i.title, href: i.href });
  }
  return names;
}


export interface Rated extends PracticeName {
  id: string;
  /** Average score this week, rounded. */
  avg: number;
  /** Times finished this week. */
  times: number;
  /** The week's first and latest score, to show improvement. */
  first: number;
  last: number;
}

export interface Weekly {
  /** First and last day of the week, as YYYY-MM-DD. */
  from: string;
  to: string;
  xp: number;
  /** XP in the seven days before, for the trend. */
  prevXp: number;
  activeDays: number;
  /** Lessons, practice sets, rounds and tests finished. */
  finished: number;
  /** Every rated practice set done this week, most practised first. */
  practised: Rated[];
  strengths: Rated[];
  weakSpots: Rated[];
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** One child's last seven days, ending today. */
export function weeklySummary(days: Days, now: Date, names: Names): Weekly {
  let xp = 0, prevXp = 0, activeDays = 0, finished = 0;
  const lists = new Map<string, number[]>();
  for (let i = 13; i >= 0; i--) {
    const day = days[dayKey(addDays(now, -i))];
    if (!day) continue;
    if (i >= 7) {
      prevXp += day.xp;
      continue;
    }
    xp += day.xp;
    finished += day.done;
    if (day.xp > 0 || day.done > 0) activeDays++;
    for (const [id, list] of Object.entries(day.scores ?? {})) {
      if (!UNRATED.has(id)) lists.set(id, [...(lists.get(id) ?? []), ...list]);
    }
  }
  const practised: Rated[] = [...lists].map(([id, list]) => ({
    id, ...(names.get(id) ?? { title: id, href: "/" }), times: list.length, first: list[0], last: list[list.length - 1],
    avg: Math.round(list.reduce((s, n) => s + n, 0) / list.length),
  })).sort((a, b) => b.times - a.times || b.avg - a.avg);
  return {
    from: dayKey(addDays(now, -6)), to: dayKey(now), xp, prevXp, activeDays, finished, practised,
    strengths: practised.filter((r) => r.avg >= STRONG).sort((a, b) => b.avg - a.avg || b.times - a.times).slice(0, SHOW),
    weakSpots: practised.filter((r) => r.avg < WEAK).sort((a, b) => a.avg - b.avg || b.times - a.times).slice(0, SHOW),
  };
}

/** "Oct 12 – Oct 18" for a week's first and last day. */
export function weekLabel(w: Weekly): string {
  const f = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${f(w.from)} – ${f(w.to)}`;
}
