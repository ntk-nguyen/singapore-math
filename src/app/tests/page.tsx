"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CrownIcon } from "@/components/Icons";
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
  if (params.get("unlocked")) return <p className="notice">Pro plan unlocked. Enjoy the extra tests!</p>;
  if (params.get("checkout")) return <p className="notice bad">Checkout did not finish, so nothing was charged.</p>;
  return null;
}

export default function TestsPage() {
  const { best, placement } = useProgress();
  const [plan] = usePlan();
  const [paywall, setPaywall] = useState(false);
  const pro = !!plan?.pro;

  return (
    <div className="stack">
      <div className="intro">
        <p className="eyebrow">Two free · six more with the Pro plan</p>
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
          const open = t.free || pro;
          return (
            <div key={t.id} className={`test${open ? "" : " locked"}`}>
              {t.free ? <span className="tag free">Free</span> : <span className="tag paid"><span className="lock"><CrownIcon />Pro</span></span>}
              <h3>{t.name}</h3>
              <p>{t.desc}</p>
              {best[t.id] != null && <span className="muted small">Best: {best[t.id]}%</span>}
              {open ? (
                <Link className="btn self-start" href={`/tests/${t.id}`}>Start</Link>
              ) : (
                <button className="btn gold self-start" onClick={() => setPaywall(true)} disabled={!plan}>
                  <span className="lock"><LockIcon />Upgrade to Pro</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      {paywall && (
        <Paywall onClose={() => setPaywall(false)} onUnlocked={() => setPaywall(false)} />
      )}
    </div>
  );
}
