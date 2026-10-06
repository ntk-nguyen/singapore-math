/**
 * The home page's curriculum pathway: each topic area in a grade becomes a unit on a
 * vertical path, with progress worked out from the scores and lessons saved on this device.
 */
import type { CatalogItem, Domain, DomainId } from "./catalog";

/** A practice score at or above this counts the topic as mastered. */
export const MASTERY = 80;

export type ItemState = "done" | "started" | "todo" | "locked";
export type UnitState = "mastered" | "progress" | "current" | "locked";

export interface PathItem extends CatalogItem {
  state: ItemState;
  /** Best score, when one is saved. */
  score?: number;
}

export interface Unit {
  id: DomainId;
  title: string;
  blurb: string;
  seeAll: Domain["seeAll"];
  items: PathItem[];
  state: UnitState;
  /** Share of the unlocked topics mastered, 0 to 100. */
  pct: number;
  done: number;
  open: number;
  /** The first unlocked topic not yet mastered: the one to do next. */
  next?: PathItem;
}

export interface Saved {
  best: Record<string, number>;
  lessons: string[];
  pro: boolean;
}

function itemState(item: CatalogItem, s: Saved): PathItem {
  const score = item.bestKey ? s.best[item.bestKey] : undefined;
  if (!item.free && !s.pro) return { ...item, state: "locked", score };
  if (item.lessonId && s.lessons.includes(item.lessonId)) return { ...item, state: "done", score };
  if (score != null) return { ...item, state: score >= MASTERY ? "done" : "started", score };
  return { ...item, state: "todo" };
}

export function pathway(domains: Domain[], s: Saved): Unit[] {
  let current = false;
  return domains.map((d) => {
    const items = d.items.map((i) => itemState(i, s));
    const open = items.filter((i) => i.state !== "locked").length;
    const done = items.filter((i) => i.state === "done").length;
    const pct = open ? Math.round((done / open) * 100) : 0;
    let state: UnitState;
    if (!open) state = "locked";
    else if (done === open) state = "mastered";
    else if (!current) {
      state = "current";
      current = true;
    } else state = "progress";
    const next = items.find((i) => i.state === "started" || i.state === "todo");
    return { id: d.id, title: d.title, blurb: d.blurb, seeAll: d.seeAll, items, state, pct, done, open, next };
  });
}

/**
 * A 0–100 skill score per unit for the diagnostics chart: the average of the saved scores,
 * with a finished lesson counting as 100 and untried topics left out.
 */
export function skill(unit: Unit): number | null {
  const scores = unit.items.filter((i) => i.state !== "locked").flatMap((i) => (i.state === "done" && i.score == null ? [100] : i.score != null ? [i.score] : []));
  if (!scores.length) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
