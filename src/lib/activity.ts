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
/** Scores kept per practice set per day, and practice sets per day; far more than a child does. */
const KEEP_SCORES = 20;
const KEEP_SETS = 40;

export interface Day {
  /** XP earned that day. */
  xp: number;
  /** Lessons, practice sets, rounds and tests finished that day. */
  done: number;
  /** Each finished practice set's score that day (usually a percent), keyed like progress.best, for the parents' weekly summary. */
  scores?: Record<string, number[]>;
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

export interface Log {
  xp?: number;
  done?: number;
  /** A finished practice set: its best-score key and the score. */
  score?: [string, number];
}

/** Add to today's totals and drop days older than the history window. */
export function logDay(days: Days, now: Date, add: Log): Days {
  const key = dayKey(now);
  const cur = days[key] ?? { xp: 0, done: 0 };
  const today: Day = { xp: cur.xp + (add.xp ?? 0), done: cur.done + (add.done ?? 0) };
  let scores = cur.scores;
  if (add.score && (scores?.[add.score[0]] || Object.keys(scores ?? {}).length < KEEP_SETS)) {
    const [id, n] = add.score;
    scores = { ...scores, [id]: [...(scores?.[id] ?? []), n].slice(-KEEP_SCORES) };
  }
  if (scores) today.scores = scores;
  const next: Days = { [key]: today };
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

/** The same day from two devices: the higher totals, and for each practice set the longer list of scores. */
export function mergeDay(a: Day, b: Day): Day {
  const out: Day = { xp: Math.max(a.xp, b.xp), done: Math.max(a.done, b.done) };
  if (a.scores || b.scores) {
    const scores = { ...a.scores };
    for (const [id, list] of Object.entries(b.scores ?? {})) {
      const have = scores[id];
      // Equal lengths: pick one the same way whichever device merges, so syncing settles.
      if (!have || list.length > have.length || (list.length === have.length && String(list) > String(have))) scores[id] = list;
    }
    out.scores = scores;
  }
  return out;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function parseScores(raw: unknown): Record<string, number[]> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, number[]> = {};
  for (const [id, list] of Object.entries(raw as Record<string, unknown>).slice(0, KEEP_SETS)) {
    if (!Array.isArray(list)) continue;
    const nums = list.filter(isNum).slice(-KEEP_SCORES);
    if (nums.length) out[id.slice(0, 60)] = nums;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Read saved days defensively: anything malformed is dropped. */
export function parseDays(raw: unknown): Days {
  if (!raw || typeof raw !== "object") return {};
  const out: Days = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !v || typeof v !== "object") continue;
    const { xp, done, scores } = v as Partial<Record<keyof Day, unknown>>;
    const day: Day = { xp: isNum(xp) ? xp : 0, done: isNum(done) ? done : 0 };
    const parsed = parseScores(scores);
    if (parsed) day.scores = parsed;
    out[k] = day;
  }
  return out;
}
