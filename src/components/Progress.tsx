"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dayKey, logDay, streak as streakOf, XP_PER_STAR, type Day } from "@/lib/activity";
import {
  DEFAULT_PROGRESS as DEFAULTS, parseProfiles, parseProgress, STARTER_NAME,
  type Family, type Profile, type Progress, type Recent,
} from "@/lib/family";
import { AVATARS, cleanName, MAX_CHILDREN, type Avatar } from "@/lib/profiles";
import { type Grade } from "@/lib/questions";

export type { Profile, Progress, Recent };

/**
 * Child progress, one profile per child, kept on this device. When a parent signs in,
 * FamilySync also keeps a copy in their account so it follows them to other devices.
 */
interface Store extends Family {
  /** The child practicing now, on this device only. */
  active: string;
}

const KEY = "mb-profiles";
/** Single-child progress saved before profiles existed; moved into the first profile. */
const OLD_KEY = "bma-progress";
/** Set once someone has picked who is practicing in this browser tab. */
const PICKED_KEY = "mb-picked";

const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const firstProfile = (progress: Progress): Profile => ({ id: newId(), name: STARTER_NAME, avatar: AVATARS[0], progress });
const DEFAULT_STORE: Store = { active: "default", profiles: [{ id: "default", name: STARTER_NAME, avatar: AVATARS[0], progress: DEFAULTS }], removed: [] };

interface Ctx extends Progress {
  /** False until saved progress has been read from this device. */
  ready: boolean;
  /** Stars shown as XP. */
  xp: number;
  /** Days in a row with some practice. */
  streak: number;
  today: Day;
  setGrade: (g: Grade) => void;
  addStars: (n: number) => void;
  recordBest: (testId: string, pct: number) => void;
  setPlacement: (g: Grade) => void;
  completeLesson: (id: string) => boolean;
  setFact: (key: string, mastery: number) => void;
  setRecent: (r: Recent) => void;
  /** Every child on this device, and the one practicing now. */
  profiles: Profile[];
  active: Profile;
  /** True when more than one child uses this device and nobody has picked who is practicing yet. */
  needsPick: boolean;
  switchProfile: (id: string) => void;
  /** Adds a child (up to MAX_CHILDREN) and returns its id, or null when full or the name is empty. */
  addProfile: (name: string, avatar: Avatar, grade: Grade) => string | null;
  updateProfile: (id: string, change: { name?: string; avatar?: Avatar }) => void;
  /** Deletes a child and their progress. The last profile can't be removed. */
  removeProfile: (id: string) => void;
  /** Every child and the deleted ids, for syncing with a signed-in parent's account. */
  family: Family;
  /** Replace this device's children with a synced copy (keeps who is practicing when they're still there). */
  applyFamily: (f: Family) => void;
}

const ProgressContext = createContext<Ctx | null>(null);

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function load(): Store {
  const saved = readJson(KEY) as Partial<Store> | null;
  const profiles = parseProfiles(saved?.profiles);
  const removed = Array.isArray(saved?.removed) ? saved.removed.filter((r): r is string => typeof r === "string") : [];
  if (profiles.length) {
    const active = profiles.some((p) => p.id === saved?.active) ? (saved?.active as string) : profiles[0].id;
    return { active, profiles, removed };
  }
  // First visit since profiles arrived: keep the existing streak and XP as the first child.
  const first = firstProfile(parseProgress(readJson(OLD_KEY)));
  return { active: first.id, profiles: [first], removed };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(DEFAULT_STORE);
  const [loaded, setLoaded] = useState(false);
  const [picked, setPicked] = useState(true);

  useEffect(() => {
    // Read browser storage after hydration so server and client render the same markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(load());
    try {
      setPicked(sessionStorage.getItem(PICKED_KEY) === "1");
    } catch {
      setPicked(false);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch {
      /* storage unavailable: progress lasts for this visit only */
    }
  }, [store, loaded]);

  const active = store.profiles.find((p) => p.id === store.active) ?? store.profiles[0];
  const state = active.progress;

  /** Change the progress of the child practicing now. */
  const setProgress = useCallback(
    (fn: (p: Progress) => Progress) =>
      setStore((st) => {
        const cur = st.profiles.find((p) => p.id === st.active);
        const next = cur && fn(cur.progress);
        if (!cur || next === cur.progress) return st;
        return { ...st, profiles: st.profiles.map((p) => (p === cur ? { ...p, progress: next!, updatedAt: Date.now() } : p)) };
      }),
    [],
  );

  const markPicked = useCallback(() => {
    setPicked(true);
    try {
      sessionStorage.setItem(PICKED_KEY, "1");
    } catch {
      /* fine: the picker shows again next visit */
    }
  }, []);

  const switchProfile = useCallback(
    (id: string) => {
      setStore((st) => (st.profiles.some((p) => p.id === id) ? { ...st, active: id } : st));
      markPicked();
    },
    [markPicked],
  );

  const addProfile = useCallback(
    (raw: string, avatar: Avatar, grade: Grade) => {
      const name = cleanName(raw);
      if (!name || store.profiles.length >= MAX_CHILDREN) return null;
      const id = newId();
      setStore((st) => ({ ...st, profiles: [...st.profiles, { id, name, avatar, progress: { ...DEFAULTS, grade }, updatedAt: Date.now() }] }));
      return id;
    },
    [store.profiles.length],
  );

  const updateProfile = useCallback(
    (id: string, change: { name?: string; avatar?: Avatar }) =>
      setStore((st) => ({
        ...st,
        profiles: st.profiles.map((p) =>
          p.id === id
            ? { ...p, name: (change.name !== undefined && cleanName(change.name)) || p.name, avatar: change.avatar ?? p.avatar, updatedAt: Date.now() }
            : p,
        ),
      })),
    [],
  );

  const removeProfile = useCallback(
    (id: string) =>
      setStore((st) => {
        if (st.profiles.length <= 1) return st;
        const profiles = st.profiles.filter((p) => p.id !== id);
        return { active: st.active === id ? profiles[0].id : st.active, profiles, removed: [...st.removed, id] };
      }),
    [],
  );

  const applyFamily = useCallback(
    (f: Family) =>
      setStore((st) => {
        if (!f.profiles.length) return st;
        const active = f.profiles.some((p) => p.id === st.active) ? st.active : f.profiles[0].id;
        return { active, profiles: f.profiles, removed: f.removed };
      }),
    [],
  );
  const family = useMemo<Family>(() => ({ profiles: store.profiles, removed: store.removed }), [store.profiles, store.removed]);

  const setGrade = useCallback((grade: Grade) => setProgress((s) => ({ ...s, grade })), [setProgress]);
  const addStars = useCallback(
    (n: number) => setProgress((s) => ({ ...s, stars: s.stars + n, days: logDay(s.days, new Date(), { xp: n * XP_PER_STAR }) })),
    [setProgress],
  );
  // Every finished practice set, round or test also counts toward today's quest.
  const recordBest = useCallback(
    (id: string, pct: number) =>
      setProgress((s) => ({ ...s, best: { ...s.best, [id]: Math.max(s.best[id] ?? 0, pct) }, days: logDay(s.days, new Date(), { done: 1 }) })),
    [setProgress],
  );
  const setPlacement = useCallback((g: Grade) => setProgress((s) => ({ ...s, placement: g, grade: g })), [setProgress]);
  const completeLesson = useCallback(
    (id: string) => {
      if (state.lessons.includes(id)) return false;
      setProgress((s) => ({
        ...s, stars: s.stars + 1, lessons: [...s.lessons, id], days: logDay(s.days, new Date(), { xp: XP_PER_STAR, done: 1 }),
      }));
      return true;
    },
    [state.lessons, setProgress],
  );

  const setFact = useCallback(
    (key: string, mastery: number) => setProgress((s) => ({ ...s, facts: { ...s.facts, [key]: mastery } })),
    [setProgress],
  );

  const setRecent = useCallback(
    (r: Recent) => setProgress((s) => (s.recent?.href === r.href && s.recent.title === r.title ? s : { ...s, recent: r })),
    [setProgress],
  );

  const value = useMemo(() => {
    const now = new Date();
    return {
      ...state, ready: loaded, xp: state.stars * XP_PER_STAR, streak: streakOf(state.days, now), today: state.days[dayKey(now)] ?? { xp: 0, done: 0 },
      setGrade, addStars, recordBest, setPlacement, completeLesson, setFact, setRecent,
      profiles: store.profiles, active, needsPick: loaded && !picked && store.profiles.length > 1,
      switchProfile, addProfile, updateProfile, removeProfile, family, applyFamily,
    };
  }, [state, loaded, setGrade, addStars, recordBest, setPlacement, completeLesson, setFact, setRecent,
    store.profiles, active, picked, switchProfile, addProfile, updateProfile, removeProfile, family, applyFamily]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}

/** Remember this page as the one to come back to from the home page. */
export function useRemember(recent: Recent | null) {
  const { ready, setRecent } = useProgress();
  const href = recent?.href;
  const title = recent?.title;
  useEffect(() => {
    if (ready && href && title) setRecent({ href, title });
  }, [ready, href, title, setRecent]);
}
