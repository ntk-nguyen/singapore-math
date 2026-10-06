"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { confetti } from "@/components/Confetti";
import { Paywall } from "@/components/Paywall";
import { useProgress } from "@/components/Progress";
import { usePlan } from "@/components/usePlan";
import { TESTS } from "@/lib/tests";

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6 10V7a6 6 0 1112 0v3h1a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V11a1 1 0 011-1h1zm2 0h8V7a4 4 0 10-8 0v3z" />
    </svg>
  );
}

function CheckoutNotice() {
  const params = useSearchParams();
  if (params.get("unlocked")) return <p className="notice">Family plan unlocked. Enjoy the extra tests!</p>;
  if (params.get("checkout")) return <p className="notice bad">Checkout did not finish, so nothing was charged.</p>;
  return null;
}

export default function TestsPage() {
  const { best, placement } = useProgress();
  const [plan, refresh] = usePlan();
  const [paywall, setPaywall] = useState(false);
  const family = !!plan?.family;

  return (
    <div className="stack">
      <div className="intro">
        <p className="eyebrow">Two free · six with Family plan</p>
        <h2>Practice tests</h2>
        {placement && (
          <p className="muted">
            Last placement: <b>Grade {placement}</b>.
          </p>
        )}
      </div>
      <Suspense>
        <CheckoutNotice />
      </Suspense>
      <div className="tests">
        {TESTS.map((t) => {
          const open = t.free || family;
          return (
            <div key={t.id} className={`test${open ? "" : " locked"}`}>
              <span className={`tag ${t.free ? "free" : "paid"}`}>{t.free ? "Free" : "Family plan"}</span>
              <h3>{t.name}</h3>
              <p>{t.desc}</p>
              {best[t.id] != null && <span className="muted small">Best: {best[t.id]}%</span>}
              {open ? (
                <Link className="btn self-start" href={`/tests/${t.id}`}>Start</Link>
              ) : (
                <button className="btn ghost self-start" onClick={() => setPaywall(true)} disabled={!plan}>
                  <span className="lock"><LockIcon />Unlock</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      {paywall && (
        <Paywall
          plan={plan}
          onClose={() => setPaywall(false)}
          onUnlocked={() => {
            setPaywall(false);
            refresh();
            confetti();
          }}
        />
      )}
    </div>
  );
}
