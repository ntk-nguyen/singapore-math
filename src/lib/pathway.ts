/**
 * The home page's curriculum pathway: the grade's own topics, grouped into units on a vertical
 * path (Addition & subtraction, Multiplication, Fractions, Decimals, Data & chance and so on, as
 * the grade has them), with progress worked out from the scores and lessons saved on this device.
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
  id: string;
  /** The topic area the unit belongs to, for its icon and the skills chart. */
  domain: DomainId;
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

/** Split each area into the units its items name, keeping the catalog's order. */
function groups(domains: Domain[]): { domain: Domain; id: string; title: string; items: CatalogItem[] }[] {
  const out: { domain: Domain; id: string; title: string; items: CatalogItem[] }[] = [];
  for (const d of domains) {
    const byId = new Map<string, (typeof out)[number]>();
    for (const item of d.items) {
      const id = item.unit?.id ?? d.id;
      let g = byId.get(id);
      if (!g) {
        g = { domain: d, id, title: item.unit?.title ?? d.title, items: [] };
        byId.set(id, g);
        out.push(g);
      }
      g.items.push(item);
    }
  }
  return out;
}

export function pathway(domains: Domain[], s: Saved): Unit[] {
  let current = false;
  return groups(domains).map(({ domain: d, id, title, items: raw }) => {
    const items = raw.map((i) => itemState(i, s));
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
    // The blurb names this grade's own topics, so each grade's path reads differently at a glance.
    const names = items.map((i) => i.title);
    const blurb = names.length > 3 ? `${names.slice(0, 3).join(" · ")} and ${names.length - 3} more` : names.join(" · ");
    return { id, domain: d.id, title, blurb, seeAll: d.seeAll, items, state, pct, done, open, next };
  });
}

/**
 * A 0–100 skill score for one topic area across its units, for the diagnostics chart: the
 * average of the saved scores, with a finished lesson counting as 100 and untried topics left out.
 */
export function skill(units: Unit[], domain: DomainId): number | null {
  const items = units.filter((u) => u.domain === domain).flatMap((u) => u.items).filter((i) => i.state !== "locked");
  const scores = items.flatMap((i) => (i.state === "done" && i.score == null ? [100] : i.score != null ? [i.score] : []));
  if (!scores.length) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
