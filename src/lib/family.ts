/**
 * Child profiles and their progress, as one family snapshot. Pure helpers shared by the
 * browser (profiles kept on the device) and the server (the copy a signed-in parent's
 * account keeps, so the same profiles show up on every device).
 */
import { parseDays, type Days } from "./activity";
import { AVATARS, cleanName, isAvatar, MAX_CHILDREN, type Avatar } from "./profiles";
import { isGrade, type Grade } from "./questions";

export interface Progress {
  grade: Grade;
  stars: number;
  best: Record<string, number>;
  placement: Grade | null;
  lessons: string[];
  /** Times-table fact mastery (0–3), keyed like "7x8". */
  facts: Record<string, number>;
  /** The last lesson or practice set opened, for "Pick up where you left off". */
  recent: Recent | null;
  /** XP earned and things finished per day, for the streak and the daily quest. */
  days: Days;
}

export interface Recent {
  href: string;
  title: string;
}

export interface Profile {
  id: string;
  /** First name or nickname only. */
  name: string;
  avatar: Avatar;
  progress: Progress;
  /** When this profile last changed (ms since epoch), so the newest name, grade and settings win a sync. */
  updatedAt?: number;
}

/** Every child in the family, and the ids of children a parent deleted (so another device can't bring them back). */
export interface Family {
  profiles: Profile[];
  removed: string[];
}

export const DEFAULT_PROGRESS: Progress = { grade: 3, stars: 0, best: {}, placement: null, lessons: [], facts: {}, recent: null, days: {} };
/** Name given to the profile a device starts with before a grown-up adds children. */
export const STARTER_NAME = "Player 1";
/** Deleted ids to remember; far more than a family will ever delete. */
const KEEP_REMOVED = 50;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function numRecord(v: unknown): Record<string, number> {
  if (!isObj(v)) return {};
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(v)) if (isNum(n)) out[k] = n;
  return out;
}

export function parseProgress(raw: unknown): Progress {
  if (!isObj(raw)) return DEFAULT_PROGRESS;
  const p = raw as Partial<Record<keyof Progress, unknown>>;
  const recent = isObj(p.recent) && typeof p.recent.href === "string" && typeof p.recent.title === "string"
    ? { href: p.recent.href, title: p.recent.title }
    : null;
  return {
    grade: isGrade(p.grade) ? p.grade : DEFAULT_PROGRESS.grade,
    stars: isNum(p.stars) ? p.stars : 0,
    best: numRecord(p.best),
    placement: isGrade(p.placement) ? p.placement : null,
    lessons: Array.isArray(p.lessons) ? p.lessons.filter((l): l is string => typeof l === "string") : [],
    facts: numRecord(p.facts),
    recent,
    days: parseDays(p.days),
  };
}

/** Keep only well-formed profiles, at most MAX_CHILDREN, with unique ids. */
export function parseProfiles(raw: unknown): Profile[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Profile[] = [];
  for (const p of raw) {
    if (!isObj(p) || typeof p.id !== "string" || typeof p.name !== "string" || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push({
      id: p.id.slice(0, 40),
      name: cleanName(p.name) || "Player",
      avatar: isAvatar(p.avatar) ? p.avatar : AVATARS[0],
      progress: parseProgress(p.progress),
      ...(isNum(p.updatedAt) ? { updatedAt: p.updatedAt } : {}),
    });
    if (out.length === MAX_CHILDREN) break;
  }
  return out;
}

export function parseFamily(raw: unknown): Family {
  if (!isObj(raw)) return { profiles: [], removed: [] };
  const removed = Array.isArray(raw.removed) ? raw.removed.filter((r): r is string => typeof r === "string").slice(-KEEP_REMOVED) : [];
  return { profiles: parseProfiles(raw.profiles).filter((p) => !removed.includes(p.id)), removed };
}

function mergeProgress(newer: Progress, older: Progress): Progress {
  const best = { ...older.best };
  for (const [k, v] of Object.entries(newer.best)) best[k] = Math.max(best[k] ?? 0, v);
  const days = { ...older.days };
  for (const [k, d] of Object.entries(newer.days)) {
    const o = days[k];
    days[k] = o ? { xp: Math.max(o.xp, d.xp), done: Math.max(o.done, d.done) } : d;
  }
  return {
    // Settings follow whichever device changed this child most recently...
    grade: newer.grade,
    placement: newer.placement ?? older.placement,
    facts: { ...older.facts, ...newer.facts },
    recent: newer.recent ?? older.recent,
    // ...and earned things are never lost.
    stars: Math.max(newer.stars, older.stars),
    best,
    lessons: [...new Set([...older.lessons, ...newer.lessons])],
    days,
  };
}

function mergeProfile(a: Profile, b: Profile): Profile {
  const [newer, older] = (b.updatedAt ?? 0) > (a.updatedAt ?? 0) ? [b, a] : [a, b];
  const updatedAt = Math.max(a.updatedAt ?? 0, b.updatedAt ?? 0);
  return { ...newer, progress: mergeProgress(newer.progress, older.progress), ...(updatedAt ? { updatedAt } : {}) };
}

/**
 * Combine two copies of the family (this device and the account). Children are matched by
 * id; deleted children stay deleted; the most recent name, avatar and grade win; stars, best
 * scores, lessons and daily activity keep the higher or combined value. Merging is
 * order-independent for everything except the order children are listed in (a's first).
 */
export function mergeFamily(a: Family, b: Family): Family {
  const removed = [...new Set([...a.removed, ...b.removed])].slice(-KEEP_REMOVED);
  const gone = new Set(removed);
  const byId = new Map<string, Profile>();
  for (const p of [...a.profiles, ...b.profiles]) {
    if (gone.has(p.id)) continue;
    const have = byId.get(p.id);
    byId.set(p.id, have ? mergeProfile(have, p) : p);
  }
  return { profiles: [...byId.values()].slice(0, MAX_CHILDREN), removed };
}

const blankProgress = (p: Progress) =>
  p.stars === 0 && p.lessons.length === 0 && p.placement === null && !Object.keys(p.best).length && !Object.keys(p.facts).length && !Object.keys(p.days).length;

/**
 * True when a device has nothing worth keeping yet: only the untouched starter profile.
 * A new device signing in should then just take the account's children, not add a
 * blank "Player 1" to the family.
 */
export function isBlankStart(f: Family): boolean {
  return f.profiles.length === 1 && f.profiles[0].name === STARTER_NAME && blankProgress(f.profiles[0].progress);
}

/** The family a device should show after signing in, given its own copy and the account's (null when the account has none yet). */
export function familyAfterSignIn(local: Family, account: Family | null): Family {
  if (!account || !account.profiles.length) return local;
  if (isBlankStart(local)) return mergeFamily(account, { profiles: [], removed: local.removed });
  return mergeFamily(account, local);
}

/** JSON with object keys sorted, so two copies compare equal whatever order their keys were written in. */
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v);
}

export function sameFamily(a: Family, b: Family): boolean {
  return canonical(a) === canonical(b);
}
