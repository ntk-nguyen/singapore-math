"use client";

import { useState } from "react";
import { usePlan } from "@/components/usePlan";

export function Billing() {
  const [plan] = usePlan();
  const [error, setError] = useState<string | null>(null);
  if (!plan) return null;

  const portal = async () => {
    setError(null);
    const res = await fetch("/api/portal", { method: "POST" });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) window.location.assign(data.url);
    else setError(data.error ?? "Could not open billing.");
  };

  return (
    <section className="panel">
      <p className="eyebrow">Your plan</p>
      <h2>{plan.pro ? "Pro plan" : "Free plan"}</h2>
      <p className="muted">
        {plan.pro
          ? `All eight practice tests are unlocked on this device. Your plan covers ${plan.seats} ${plan.seats === 1 ? "child" : "children"}.`
          : "Learn, Play and two practice tests are free. The Pro plan unlocks six more tests."}
      </p>
      {plan.billing && (
        <button className="btn self-start" onClick={portal}>
          Manage or cancel subscription
        </button>
      )}
      {error && <p className="notice bad">{error}</p>}
    </section>
  );
}
