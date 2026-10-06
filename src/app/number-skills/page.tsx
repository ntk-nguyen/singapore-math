"use client";

import Link from "next/link";
import { useState } from "react";
import { useProgress } from "@/components/Progress";
import { SYMBOL, TOPICS, type Op } from "@/lib/arithmetic";
import type { Grade } from "@/lib/questions";

const OPS: { op: Op[]; label: string }[] = [
  { op: ["make10", "add"], label: "Addition" },
  { op: ["sub"], label: "Subtraction" },
  { op: ["mul"], label: "Multiplication" },
  { op: ["div"], label: "Division" },
];
const SKILL_GRADES: Grade[] = [1, 2, 3, 4, 5, 6];

export default function NumberSkillsPage() {
  const { grade, best } = useProgress();
  const [picked, setPicked] = useState<Grade | null>(null);
  const shown = picked ?? (Math.min(grade, 6) as Grade);
  const topics = TOPICS.filter((t) => t.grade === shown);

  return (
    <div className="stack">
      <div className="intro">
        <p className="eyebrow">Concrete → Pictorial → Abstract</p>
        <h2>Number skills: +, −, ×, ÷ by grade</h2>
        <p className="muted">
          Place-value discs show what carrying and borrowing really mean, the area model turns into long multiplication, and long division is sharing one place at a time. Every lesson steps through a fresh example, then you practice 10 questions.
        </p>
      </div>
      <div className="row" role="group" aria-label="Grade">
        {SKILL_GRADES.map((g) => (
          <button key={g} className={`chip${g === shown ? " on" : ""}`} aria-pressed={g === shown} onClick={() => setPicked(g)}>
            Grade {g}
          </button>
        ))}
      </div>
      {grade > 6 && picked == null && (
        <p className="notice">Multi-digit arithmetic is complete by Grade 6 in Common Core. Here is the Grade 6 set for review.</p>
      )}
      {OPS.map(({ op, label }) => {
        const list = topics.filter((t) => op.includes(t.op));
        if (!list.length) return null;
        return (
          <section key={label} className="stack" style={{ gap: 10 }}>
            <h3>
              <span className="opsym" aria-hidden="true">{SYMBOL[op[op.length - 1]]}</span> {label}
            </h3>
            <div className="tests">
              {list.map((t) => (
                <div key={t.id} className="test">
                  <h3>{t.title}</h3>
                  <p>{t.blurb}</p>
                  {best[`ns-${t.id}`] != null && <span className="muted small">Best: {best[`ns-${t.id}`]}%</span>}
                  <div className="row">
                    <Link className="btn" href={`/number-skills/${t.id}`}>Learn & practice</Link>
                    <span className="std" title="Common Core standard">{t.std}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
