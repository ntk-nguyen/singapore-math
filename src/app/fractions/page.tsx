"use client";

import Link from "next/link";
import { useState } from "react";
import { useProgress } from "@/components/Progress";
import { FRACTION_TOPICS, type Strand } from "@/lib/fractions";
import type { Grade } from "@/lib/questions";

const STRANDS: { strand: Strand; label: string }[] = [
  { strand: "fractions", label: "Fractions" },
  { strand: "decimals", label: "Decimals" },
];
const FRAC_GRADES: Grade[] = [3, 4, 5, 6];

export default function FractionsPage() {
  const { grade, best } = useProgress();
  const [picked, setPicked] = useState<Grade | null>(null);
  const shown = picked ?? (Math.min(Math.max(grade, 3), 6) as Grade);
  const topics = FRACTION_TOPICS.filter((t) => t.grade === shown);

  return (
    <div className="stack">
      <div className="intro">
        <p className="eyebrow">Concrete → Pictorial → Abstract</p>
        <h2>Fractions & decimals</h2>
        <p className="muted">
          Every fraction is a bar cut into equal parts. Cut the parts again and you get equivalent fractions; cut two bars the same way and you can add them. Decimals are tenths and hundredths of the same bar. Each topic shows a worked example, then you practice 10 questions.
        </p>
      </div>
      <div className="row" role="group" aria-label="Grade">
        {FRAC_GRADES.map((g) => (
          <button key={g} className={`chip${g === shown ? " on" : ""}`} aria-pressed={g === shown} onClick={() => setPicked(g)}>
            Grade {g}
          </button>
        ))}
      </div>
      {picked == null && (grade < 3 || grade > 6) && (
        <p className="notice">
          Fractions and decimals are taught in Grades 3 to 6. Here is the Grade {shown} set{grade > 6 ? " for review" : " to look ahead"}.
        </p>
      )}
      {STRANDS.map(({ strand, label }) => {
        const list = topics.filter((t) => t.strand === strand);
        if (!list.length) return null;
        return (
          <section key={strand} className="stack" style={{ gap: 10 }}>
            <h3>{label}</h3>
            <div className="tests">
              {list.map((t) => (
                <div key={t.id} className="test">
                  <h3>{t.title}</h3>
                  <p>{t.blurb}</p>
                  {best[`fd-${t.id}`] != null && <span className="muted small">Best: {best[`fd-${t.id}`]}%</span>}
                  <div className="row">
                    <Link className="btn" href={`/fractions/${t.id}`}>Learn & practice</Link>
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
