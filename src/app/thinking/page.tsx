"use client";

import Link from "next/link";
import { useState } from "react";
import { CrownIcon } from "@/components/Icons";
import { Paywall } from "@/components/Paywall";
import { useProgress } from "@/components/Progress";
import { usePlan } from "@/components/usePlan";
import { GRADES, type Grade } from "@/lib/questions";
import { AREAS, isFreeTopic, MP, THINKING_TOPICS } from "@/lib/thinking";

export default function ThinkingPage() {
  const { grade, best } = useProgress();
  const [plan] = usePlan();
  const [picked, setPicked] = useState<Grade | null>(null);
  const [paywall, setPaywall] = useState(false);
  const shown = picked ?? grade;
  const topics = THINKING_TOPICS.filter((t) => t.grade === shown);

  return (
    <div className="stack">
      <div className="intro">
        <p className="eyebrow">Ready for a world with AI</p>
        <h2>Data & thinking</h2>
        <p className="muted">
          A computer can work out an answer in a blink. Knowing whether to trust it is up to you. Read graphs and spot misleading ones, think about averages and chance, follow rules and simple code, estimate to check an answer, and explain why a method works. Each topic shows a worked example, then you practise 10 questions.
        </p>
      </div>
      <div className="row" role="group" aria-label="Grade">
        {GRADES.map((g) => (
          <button key={g} className={`chip${g === shown ? " on" : ""}`} aria-pressed={g === shown} onClick={() => setPicked(g)}>
            Grade {g}
          </button>
        ))}
      </div>
      {AREAS.map((area) => {
        const list = topics.filter((t) => t.area === area.id);
        if (!list.length) return null;
        return (
          <section key={area.id} className="stack" style={{ gap: 10 }}>
            <div>
              <h3>{area.title}</h3>
              <p className="muted small">{area.blurb}</p>
            </div>
            <div className="tests">
              {list.map((t) => {
                const free = isFreeTopic(t), open = free || !!plan?.pro, key = `dt-${t.id}`;
                return (
                  <div key={t.id} className={`test${open ? "" : " locked"}`}>
                    {free ? <span className="tag free">Free</span> : <span className="tag paid"><span className="lock"><CrownIcon />Pro</span></span>}
                    <h3>{t.title}</h3>
                    <p>{t.blurb}</p>
                    {best[key] != null && <span className="muted small">Best: {best[key]}%</span>}
                    <div className="row">
                      {open ? (
                        <Link className="btn" href={`/thinking/${t.id}`}>Learn & practise</Link>
                      ) : (
                        <button className="btn gold" disabled={!plan} onClick={() => setPaywall(true)}>Upgrade to Pro</button>
                      )}
                      <span className="std" title="Common Core standard">{t.std}</span>
                      <span className="std" title={`Mathematical Practice: ${MP[t.mp]}`}>{t.mp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      {paywall && (
        <Paywall onClose={() => setPaywall(false)} onUnlocked={() => setPaywall(false)} />
      )}
    </div>
  );
}
