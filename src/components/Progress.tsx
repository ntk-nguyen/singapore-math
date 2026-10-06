"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isGrade, type Grade } from "@/lib/questions";

/**
 * Child progress, kept on this device only (no accounts yet, and no child data
 * leaves the browser). Parent accounts come with the database follow-up.
 */
interface Progress {
  grade: Grade;
  stars: number;
  best: Record<string, number>;
  placement: Grade | null;
  lessons: string[];
}

const DEFAULTS: Progress = { grade: 3, stars: 0, best: {}, placement: null, lessons: [] };
const KEY = "bma-progress";

interface Ctx extends Progress {
  /** False until saved progress has been read from this device. */
  ready: boolean;
  setGrade: (g: Grade) => void;
  addStars: (n: number) => void;
  recordBest: (testId: string, pct: number) => void;
  setPlacement: (g: Grade) => void;
  completeLesson: (id: string) => boolean;
}

const ProgressContext = createContext<Ctx | null>(null);

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<Progress>;
    return {
      grade: isGrade(p.grade) ? p.grade : DEFAULTS.grade,
      stars: typeof p.stars === "number" ? p.stars : 0,
      best: p.best && typeof p.best === "object" ? p.best : {},
      placement: isGrade(p.placement) ? p.placement : null,
      lessons: Array.isArray(p.lessons) ? p.lessons : [],
    };
  } catch {
    return DEFAULTS;
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Progress>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Read browser storage after hydration so server and client render the same markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(load());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: progress lasts for this visit only */
    }
  }, [state, loaded]);

  const setGrade = useCallback((grade: Grade) => setState((s) => ({ ...s, grade })), []);
  const addStars = useCallback((n: number) => setState((s) => ({ ...s, stars: s.stars + n })), []);
  const recordBest = useCallback(
    (id: string, pct: number) => setState((s) => ({ ...s, best: { ...s.best, [id]: Math.max(s.best[id] ?? 0, pct) } })),
    [],
  );
  const setPlacement = useCallback((g: Grade) => setState((s) => ({ ...s, placement: g, grade: g })), []);
  const completeLesson = useCallback(
    (id: string) => {
      if (state.lessons.includes(id)) return false;
      setState((s) => ({ ...s, stars: s.stars + 1, lessons: [...s.lessons, id] }));
      return true;
    },
    [state.lessons],
  );

  const value = useMemo(
    () => ({ ...state, ready: loaded, setGrade, addStars, recordBest, setPlacement, completeLesson }),
    [state, loaded, setGrade, addStars, recordBest, setPlacement, completeLesson],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
