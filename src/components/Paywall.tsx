"use client";

import { useState } from "react";
import { CrownIcon } from "./Icons";
import type { PlanInfo } from "./usePlan";

export function Paywall({ plan, onClose, onUnlocked }: { plan: PlanInfo | null; onClose: () => void; onUnlocked: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.assign(data.url);
      else setError(data.error ?? "Could not start checkout.");
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
  };

  const demo = async () => {
    setBusy(true);
    const res = await fetch("/api/demo-unlock", { method: "POST" });
    setBusy(false);
    if (res.ok) onUnlocked();
    else setError("Demo unlock is not available.");
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Family plan" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel">
        <span className="tag paid"><span className="lock"><CrownIcon />Family plan</span></span>
        <p className="price">
          $7.99<small> / month</small>
        </p>
        <ul className="ticks">
          <li>Six more full practice tests, with new ones each term</li>
          <li>Up to 4 child profiles</li>
          <li>Standards report for parents and teachers</li>
          <li>Printable bar-model worksheets</li>
        </ul>
        <p className="muted small">
          7-day free trial, cancel any time. A grown-up should complete checkout. Payments run in Stripe test mode, so no real card is charged.
        </p>
        {error && <p className="notice bad">{error}</p>}
        <div className="row">
          <button className="btn" onClick={checkout} disabled={busy || plan?.checkout === false}>
            Start free trial
          </button>
          {plan?.demoUnlock && (
            <button className="btn ghost" onClick={demo} disabled={busy}>
              Unlock (demo)
            </button>
          )}
          <button className="btn ghost" onClick={onClose}>
            Not now
          </button>
        </div>
        {plan?.checkout === false && <p className="muted small">Checkout is not configured on this server yet.</p>}
      </div>
    </div>
  );
}
