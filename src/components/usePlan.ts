"use client";

import { useEffect, useState } from "react";

export interface PlanInfo {
  family: boolean;
  billing: boolean;
  checkout: boolean;
  demoUnlock: boolean;
}

/** The parent's plan, as checked by the server. */
export function usePlan(): [PlanInfo | null, () => void] {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/plan", { cache: "no-store" })
      .then((r) => r.json())
      .then((p: PlanInfo) => live && setPlan(p))
      .catch(() => live && setPlan({ family: false, billing: false, checkout: false, demoUnlock: false }));
    return () => {
      live = false;
    };
  }, [n]);
  return [plan, () => setN((x) => x + 1)];
}
