"use client";

import Link from "next/link";
import { useState } from "react";
import { clampChildren, dollars, EXTRA_CHILD_CENTS, FIRST_CHILD_CENTS, MAX_CHILDREN, proMonthlyCents } from "@/lib/profiles";
import { confetti } from "./Confetti";
import { CrownIcon } from "./Icons";
import { useProgress } from "./Progress";
import { usePlan } from "./usePlan";

/** What the Pro plan unlocks today. Keep this list to things the app really serves. */
export const PRO_PERKS = [
  "Six more full practice tests, from a word problem marathon to PSLE-style challenges",
  "Intermediate and advanced word problems and solve-for-x sets, with worked bar model solutions",
  "Unlimited printable practice papers for every test and topic, each a new paper with its answer key",
  "Every new test and topic as it is added",
];
export const PRO_PRICE = dollars(FIRST_CHILD_CENTS);
export const EXTRA_CHILD_PRICE = dollars(EXTRA_CHILD_CENTS);

/** Start Stripe Checkout (test mode), or the development-only demo unlock. */
export function useCheckout(onUnlocked?: () => void) {
  const [plan, refresh] = usePlan();
  const { profiles } = useProgress();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Children on the plan: every profile on this device unless the parent picks another number.
  const [picked, setChildren] = useState<number | null>(null);
  const children = picked ?? clampChildren(profiles.length);

  const checkout = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ children }),
      });
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
    if (res.ok) {
      refresh();
      confetti();
      onUnlocked?.();
    } else setError("Demo unlock is not available.");
  };

  return { plan, busy, error, checkout, demo, children, setChildren };
}

/** How many children to put on the plan, with the monthly total. */
export function ChildCount({ count, setCount }: { count: number; setCount: (n: number) => void }) {
  return (
    <div className="seats">
      <span className="small">Children</span>
      <button type="button" onClick={() => setCount(count - 1)} disabled={count <= 1} aria-label="One fewer child">−</button>
      <output aria-live="polite">{count}</output>
      <button type="button" onClick={() => setCount(count + 1)} disabled={count >= MAX_CHILDREN} aria-label="One more child">+</button>
      <span className="small muted">{dollars(proMonthlyCents(count))} a month</span>
    </div>
  );
}

/** Trial button plus the demo unlock and any error, shared by the paywall and the Pro page. */
export function CheckoutButtons({ plan, busy, error, checkout, demo, label = "Start 7-day free trial", className = "btn gold" }: Pick<ReturnType<typeof useCheckout>, "plan" | "busy" | "error" | "checkout" | "demo"> & { label?: string; className?: string }) {
  return (
    <>
      {error && <p className="notice bad">{error}</p>}
      <button className={className} onClick={() => checkout()} disabled={busy || !plan || plan.checkout === false}>
        {label}
      </button>
      {plan?.demoUnlock && (
        <button className="btn ghost" onClick={demo} disabled={busy}>
          Unlock (demo)
        </button>
      )}
      {plan?.checkout === false && <p className="muted small">Checkout is not configured on this server yet.</p>}
    </>
  );
}

/** The in-app upgrade prompt shown when a child taps something locked. */
export function Paywall({ onClose, onUnlocked }: { onClose: () => void; onUnlocked: () => void }) {
  const c = useCheckout(onUnlocked);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="paywall-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel paywall">
        <div className="paywall-top">
          <span className="probadge"><CrownIcon />MathBridge Pro</span>
          <button className="xbtn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <span className="paywall-ic" aria-hidden="true"><CrownIcon /></span>
        <h2 id="paywall-title">Upgrade to Pro plan</h2>
        <p className="muted">Keep your momentum going. Pro unlocks the harder practice and every practice test.</p>
        <ul className="ticks">
          {PRO_PERKS.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <div className="offer">
          <div>
            <b>Pro plan</b>
            <span>7 days free, then {PRO_PRICE} a month, plus {EXTRA_CHILD_PRICE} for each extra child</span>
          </div>
        </div>
        <CheckoutButtons {...c} label="Claim 7-day free trial" className="btn" />
        <button className="linkbtn" onClick={onClose}>Not now</button>
        <p className="muted small center">
          A grown-up should complete checkout. Payments run in Stripe test mode, so no real card is charged. <Link href="/pro">Compare plans</Link>
        </p>
      </div>
    </div>
  );
}

/** The dark sidebar card that invites families to upgrade, as in the Stitch dashboard. */
export function ProCard() {
  const [plan] = usePlan();
  if (plan?.pro) {
    return (
      <div className="sidecard procard">
        <span className="probadge"><CrownIcon />MathBridge Pro</span>
        <h3>Pro plan is active</h3>
        <p>Every practice test and every problem-solving level is unlocked. Thanks for supporting MathBridge.</p>
        <Link className="btn gold" href="/tests">Go to practice tests</Link>
      </div>
    );
  }
  return (
    <div className="sidecard procard">
      <span className="probadge"><CrownIcon />MathBridge Pro</span>
      <h3>Upgrade to Pro plan</h3>
      <p>Unlock the harder word problems and six more full practice tests, each with worked bar model solutions.</p>
      <ul className="proticks">
        <li>Six more practice tests</li>
        <li>Intermediate and advanced problem solving</li>
        <li>New tests and topics as they land</li>
      </ul>
      <Link className="btn gold" href="/pro">Start 7-day free trial</Link>
      <span className="procard-note">Cancel any time · No charge until the trial ends</span>
    </div>
  );
}
