"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface PlanInfo {
  pro: boolean;
  /** Children the Pro plan covers (0 without one). */
  seats: number;
  billing: boolean;
  checkout: boolean;
  demoUnlock: boolean;
}

const PlanContext = createContext<[PlanInfo | null, () => void]>([null, () => {}]);

/** Loads the parent's plan once for the whole app, so the header and pages agree after an upgrade. */
export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/plan", { cache: "no-store" })
      .then((r) => r.json())
      .then((p: PlanInfo) => live && setPlan(p))
      .catch(() => live && setPlan({ pro: false, seats: 0, billing: false, checkout: false, demoUnlock: false }));
    return () => {
      live = false;
    };
  }, [n]);
  const refresh = useCallback(() => setN((x) => x + 1), []);
  return <PlanContext.Provider value={[plan, refresh]}>{children}</PlanContext.Provider>;
}

/** The parent's plan, as checked by the server. */
export function usePlan(): [PlanInfo | null, () => void] {
  return useContext(PlanContext);
}
