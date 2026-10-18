"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { familyAfterSignIn, mergeFamily, parseFamily, sameFamily, type Family } from "@/lib/family";
import { useProgress } from "./Progress";
import { usePlan } from "./usePlan";

/** Wait this long after the last change before saving, so a quick round of answers is one save. */
const SAVE_DELAY_MS = 1500;

/**
 * While a parent is signed in, keeps this device's children and progress in step with their
 * account: on sign-in and whenever the app comes back into view it pulls the account's copy,
 * and after each change it saves this device's copy. Both sides merge, so nothing earned on
 * either device is lost. Renders nothing; signed out, it does nothing.
 */
export function FamilySync() {
  const [plan] = usePlan();
  const { ready, family, applyFamily } = useProgress();
  const signedIn = !!plan?.parent;
  const [pulled, setPulled] = useState(false);
  const latest = useRef(family);
  useEffect(() => {
    latest.current = family;
  }, [family]);

  /** Bring an account copy into this device, if it changes anything. */
  const adopt = useCallback(
    (next: Family) => {
      if (!sameFamily(next, latest.current)) applyFamily(next);
    },
    [applyFamily],
  );

  const save = useCallback(async (f: Family): Promise<Family | null> => {
    const res = await fetch("/api/family", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    if (!res.ok) return null;
    const data = (await res.json()) as { family?: unknown };
    return parseFamily(data.family);
  }, []);

  useEffect(() => {
    if (!ready || !signedIn) return;
    let live = true;
    const pull = async () => {
      try {
        const res = await fetch("/api/family", { cache: "no-store" });
        if (!res.ok || !live) return;
        const data = (await res.json()) as { family?: unknown };
        const next = familyAfterSignIn(latest.current, data.family ? parseFamily(data.family) : null);
        adopt(next);
        const saved = await save(next);
        if (live && saved) adopt(mergeFamily(saved, latest.current));
        if (live) setPulled(true);
      } catch {
        /* offline: keep practicing on this device and try again next time */
      }
    };
    void pull();
    const onShow = () => document.visibilityState === "visible" && void pull();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [ready, signedIn, adopt, save]);

  useEffect(() => {
    if (!pulled || !signedIn) return;
    const t = setTimeout(() => {
      save(family)
        .then((saved) => saved && adopt(mergeFamily(saved, latest.current)))
        .catch(() => {});
    }, SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [family, pulled, signedIn, save, adopt]);

  return null;
}
