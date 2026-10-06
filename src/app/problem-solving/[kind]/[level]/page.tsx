"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { confetti } from "@/components/Confetti";
import { useProgress, useRemember } from "@/components/Progress";
import { QuestionCard } from "@/components/QuestionCard";
import { isKind, isLevel, KINDS, LEVELS } from "@/lib/problems";
import type { Question } from "@/lib/questions";

export default function PracticePage() {
  const { kind, level } = useParams<{ kind: string; level: string }>();
  const found = isKind(kind) && isLevel(level);
  useRemember(found ? { href: `/problem-solving/${kind}/${level}`, title: `${KINDS[kind].title}: ${LEVELS.find((l) => l.id === level)!.label.toLowerCase()}` } : null);
  if (!found) {
    return (
      <div className="panel">
        <h2>Practice set not found</h2>
        <Link className="btn self-start" href="/problem-solving">Back</Link>
      </div>
    );
  }
  const info = LEVELS.find((l) => l.id === level)!;
  return (
    <div className="stack">
      <div className="row">
        <div className="spacer">
          <p className="eyebrow">{info.free ? "Free" : "Pro plan"} · {info.label}</p>
          <h2>{KINDS[kind].title}</h2>
        </div>
        <Link className="btn ghost" href="/problem-solving">All sets</Link>
      </div>
      <Runner kind={kind} level={level} />
    </div>
  );
}

function Runner({ kind, level }: { kind: string; level: string }) {
  const { addStars, recordBest } = useProgress();
  const [qs, setQs] = useState<Question[] | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [right, setRight] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let live = true;
    fetch(`/api/practice/${kind}?level=${level}`, { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!live) return;
        if (r.ok) setQs(data.questions);
        else setError({ status: r.status, message: data.error ?? "Could not load this set." });
      })
      .catch(() => live && setError({ status: 0, message: "Could not reach the server." }));
    return () => {
      live = false;
    };
  }, [kind, level, round]);

  if (error) {
    return (
      <div className="panel">
        <p className="notice bad">{error.message}</p>
        <Link className={`btn self-start${error.status === 402 ? " gold" : ""}`} href={error.status === 402 ? "/pro" : "/problem-solving"}>{error.status === 402 ? "Upgrade to Pro plan" : "Back"}</Link>
      </div>
    );
  }
  if (!qs) return <div className="panel"><p className="muted">Loading…</p></div>;

  const finished = i >= qs.length;
  const again = () => {
    setQs(null);
    setI(0);
    setRight(0);
    setStreak(0);
    setAnswered(false);
    setRound(round + 1);
  };

  return (
    <section className="panel">
      <div className="row">
        <span className="streak spacer">{streak > 1 ? `${streak} in a row` : ""}</span>
        <span className="muted small">{Math.min(i + 1, qs.length)} of {qs.length}</span>
      </div>
      <div className="progress"><i style={{ width: `${((i + (answered ? 1 : 0)) / qs.length) * 100}%` }} /></div>
      {finished ? (
        <>
          <p className="result-big">{right}/{qs.length}</p>
          <p className="muted">{right >= 8 ? "Excellent problem solving!" : "Use “Show me how” to see the bar model and steps, then try a new set."}</p>
          <button className="btn self-start" onClick={again}>New set</button>
        </>
      ) : (
        <QuestionCard
          key={`${round}-${i}`}
          q={qs[i]}
          onAnswer={(ok) => {
            setAnswered(true);
            if (ok) {
              setRight(right + 1);
              setStreak(streak + 1);
              addStars(streak + 1 >= 3 ? 2 : 1);
            } else setStreak(0);
          }}
        >
          <button
            className="btn self-start"
            onClick={() => {
              setAnswered(false);
              if (i + 1 >= qs.length) {
                const pct = Math.round((right / qs.length) * 100);
                recordBest(`ps-${kind}-${level}`, pct);
                if (pct >= 80) confetti();
              }
              setI(i + 1);
            }}
          >
            {i + 1 >= qs.length ? "See results" : "Next question"}
          </button>
        </QuestionCard>
      )}
    </section>
  );
}
