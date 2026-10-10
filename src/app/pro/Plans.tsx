"use client";

import Link from "next/link";
import { CrownIcon } from "@/components/Icons";
import { ChildCount, CheckoutButtons, EXTRA_CHILD_PRICE, PRO_PERKS, PRO_PRICE, useCheckout } from "@/components/Paywall";

export function PlanCards({ freeTests }: { freeTests: number }) {
  const c = useCheckout();
  const pro = !!c.plan?.pro;
  return (
    <section className="plans" aria-label="Plans">
      <div className="plan">
        <div className="plan-head">
          <p className="eyebrow">Starter</p>
          <span className="tag free">Free forever</span>
        </div>
        <h2>Free</h2>
        <p className="muted small">Every lesson and skill, for curious learners.</p>
        <p className="price">$0<small> / month</small></p>
        <p className="muted small">No card needed</p>
        <ul className="ticks">
          <li>Bar model lessons for Grades 1–8</li>
          <li>Number skills, fractions, Play and times tables</li>
          <li>Easy word problems and solve for x</li>
          <li>{freeTests} practice tests, including the placement check</li>
        </ul>
        <span className="btn ghost plan-cta" aria-disabled="true">{pro ? "Included" : "Your current plan"}</span>
      </div>

      <div className="plan best">
        <span className="plan-ribbon"><CrownIcon />Most popular for families</span>
        <div className="plan-head">
          <p className="eyebrow">Complete mastery</p>
          <span className="tag best">Grades 1–8</span>
        </div>
        <h2>MathBridge Pro</h2>
        <p className="muted small">Everything in Free, plus the practice that builds exam confidence.</p>
        <p className="price">{PRO_PRICE}<small> / month</small></p>
        <p className="small sky">For your first child. Each extra child is {EXTRA_CHILD_PRICE} a month, up to 5 children. 7 days free.</p>
        <ul className="ticks">
          <li><b>Everything in Free</b></li>
          <li>A profile for each child, with their own progress, streak and scores</li>
          {PRO_PERKS.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <div className="plan-cta stack" style={{ gap: 8 }}>
          {pro ? (
            <>
              <span className="notice">Your Pro plan is active.</span>
              <Link className="btn ghost" href="/parents">Manage plan</Link>
            </>
          ) : (
            <>
              <ChildCount count={c.children} setCount={c.setChildren} />
              <CheckoutButtons {...c} label="Start 7-day free trial" className="btn" />
              <p className="muted small center">No charge until the trial ends · Cancel any time</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function TrialBand() {
  const c = useCheckout();
  if (c.plan?.pro) return null;
  return (
    <section className="trialband">
      <div>
        <p className="badge">Start your child’s journey today</p>
        <h2>See the difference a visual model makes in 7 days.</h2>
        <p>Try every Pro test and problem set free for a week. A grown-up completes checkout on Stripe.</p>
      </div>
      <div className="trialband-cta">
        <CheckoutButtons {...c} label="Start 7-day free trial" />
      </div>
    </section>
  );
}
