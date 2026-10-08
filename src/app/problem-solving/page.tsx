"use client";

import Link from "next/link";
import { useState } from "react";
import { Paywall } from "@/components/Paywall";
import { CrownIcon } from "@/components/Icons";
import { useProgress } from "@/components/Progress";
import { usePlan } from "@/components/usePlan";
import { KINDS, LEVELS, type Kind } from "@/lib/problems";

export default function ProblemSolvingPage() {
  const { best } = useProgress();
  const [plan] = usePlan();
  const [paywall, setPaywall] = useState(false);

  return (
    <div className="stack">
      <div className="intro">
        <p className="eyebrow">Read · Draw · Write · Answer</p>
        <h2>Problem solving</h2>
        <p className="muted">
          Singapore students draw a bar model before they calculate. Read the problem, draw what you know and mark what you don&apos;t with a “?”, write the number sentence, then answer. The same bars turn into algebra when you solve for x.
        </p>
      </div>
      {(Object.keys(KINDS) as Kind[]).map((kind) => (
        <section key={kind} className="stack" style={{ gap: 10 }}>
          <h3>{KINDS[kind].title}</h3>
          <div className="tests">
            {LEVELS.map((l) => {
              const open = l.free || !!plan?.pro;
              const key = `ps-${kind}-${l.id}`;
              return (
                <div key={l.id} className={`test${open ? "" : " locked"}`}>
                  {l.free ? <span className="tag free">Free</span> : <span className="tag paid"><span className="lock"><CrownIcon />Pro</span></span>}
                  <h3>{l.label}</h3>
                  <p>{KINDS[kind].blurb[l.id]}</p>
                  {best[key] != null && <span className="muted small">Best: {best[key]}%</span>}
                  {open ? (
                    <Link className="btn self-start" href={`/problem-solving/${kind}/${l.id}`}>Practice</Link>
                  ) : (
                    <button className="btn gold self-start" disabled={!plan} onClick={() => setPaywall(true)}>Upgrade to Pro</button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {paywall && (
        <Paywall onClose={() => setPaywall(false)} onUnlocked={() => setPaywall(false)} />
      )}
    </div>
  );
}
