/**
 * Daily activity behind the streak, the daily quest and the week chart on the home page.
 * Kept per local calendar day on this device, like the rest of progress.
 */

/** Each star a child earns is worth this much XP on screen. */
export const XP_PER_STAR = 10;
/** Practice sets, lessons, rounds or tests to finish each day for the daily quest. */
export const QUEST_GOAL = 3;
/** Days of history to keep: enough for a week chart and a long streak check. */
const KEEP_DAYS = 60;

export interface Day {
  /** XP earned that day. */
  xp: number;
  /** Lessons, practice sets, rounds and tests finished that day. */
  done: number;
}

export type Days = Record<string, Day>;

/** A local calendar date as YYYY-MM-DD. */
export function dayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Add to today's totals and drop days older than the history window. */
export function logDay(days: Days, now: Date, add: Partial<Day>): Days {
  const key = dayKey(now);
  const cur = days[key] ?? { xp: 0, done: 0 };
  const next: Days = { [key]: { xp: cur.xp + (add.xp ?? 0), done: cur.done + (add.done ?? 0) } };
  const oldest = dayKey(addDays(now, -KEEP_DAYS));
  for (const [k, v] of Object.entries(days)) if (k !== key && k >= oldest) next[k] = v;
  return next;
}

const active = (d: Day | undefined) => !!d && (d.xp > 0 || d.done > 0);

/** Days in a row with some practice, counting today, or up to yesterday when today has none yet. */
export function streak(days: Days, now: Date): number {
  let d = active(days[dayKey(now)]) ? now : addDays(now, -1);
  let n = 0;
  while (active(days[dayKey(d)])) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** The last seven days, oldest first, ending today. */
export function lastWeek(days: Days, now: Date): { key: string; label: string; xp: number; today: boolean }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(now, i - 6);
    const key = dayKey(d);
    return { key, label: d.toLocaleDateString("en-US", { weekday: "narrow" }), xp: days[key]?.xp ?? 0, today: i === 6 };
  });
}

/** Read saved days defensively: anything malformed is dropped. */
export function parseDays(raw: unknown): Days {
  if (!raw || typeof raw !== "object") return {};
  const out: Days = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !v || typeof v !== "object") continue;
    const { xp, done } = v as Partial<Day>;
    out[k] = { xp: typeof xp === "number" ? xp : 0, done: typeof done === "number" ? done : 0 };
  }
  return out;
}
