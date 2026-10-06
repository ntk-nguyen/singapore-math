"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { confetti } from "@/components/Confetti";
import { useProgress, useRemember } from "@/components/Progress";
import { QuestionCard } from "@/components/QuestionCard";
import { Results, type Answered } from "@/components/Results";
import { placementResult, recordAnswer, startPlacement, type PlacementState } from "@/lib/placement";
import { makeQuestion, type Grade, type Question } from "@/lib/questions";
import { getTest, type TestInfo } from "@/lib/tests";

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  const test = getTest(id);
  const { grade, ready } = useProgress();
  useRemember(test ? { href: `/tests/${test.id}`, title: test.name } : null);
  if (!test) {
    return (
      <div className="panel">
        <h2>Test not found</h2>
        <Link className="btn self-start" href="/tests">Back to tests</Link>
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="row">
        <div className="spacer">
          <p className="eyebrow">{test.free ? "Free test" : "Pro plan"}</p>
          <h2>{test.name}</h2>
        </div>
        <Link className="btn ghost" href="/tests">Quit</Link>
      </div>
      {!ready ? (
        <div className="panel"><p className="muted">Loading…</p></div>
      ) : test.id === "placement" ? <Placement test={test} grade={grade} /> : <FixedTest key={grade} test={test} grade={grade} />}
    </div>
  );
}

function useFinish(test: TestInfo) {
  const { addStars, recordBest } = useProgress();
  return (log: Answered[]) => {
    const right = log.filter((l) => l.ok).length;
    const pct = Math.round((right / log.length) * 100);
    recordBest(test.id, pct);
    addStars(right);
    if (pct >= 80) confetti();
  };
}

function Bar({ value }: { value: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${value * 100}%` }} />
    </div>
  );
}

/** Adaptive placement: runs in the browser, moving up or down a grade after each answer. */
function Placement({ test, grade }: { test: TestInfo; grade: Grade }) {
  const { setPlacement } = useProgress();
  const finish = useFinish(test);
  const [state, setState] = useState<PlacementState>(() => startPlacement(grade));
  // Only rendered in the browser (after progress loads), so random questions can't cause a hydration mismatch.
  const [q, setQ] = useState<Question>(() => makeQuestion(state.grade, Math.random, 0));
  const [log, setLog] = useState<Answered[]>([]);
  const [place, setPlace] = useState<Grade | null>(null);

  const answer = (ok: boolean) => {
    const nextLog = [...log, { q, ok }];
    const next = recordAnswer(state, ok);
    setLog(nextLog);
    setState(next);
    setTimeout(() => {
      if (next.asked >= test.length) {
        const p = placementResult(next);
        setPlace(p);
        setPlacement(p);
        finish(nextLog);
      } else {
        setQ(makeQuestion(next.grade, Math.random, next.asked));
      }
    }, 250);
  };

  if (place) return <Results log={log} placement={place} />;
  return (
    <>
      <Bar value={state.asked / test.length} />
      <div className="panel">
        <QuestionCard key={state.asked} q={q} instant={false} onAnswer={answer} />
      </div>
    </>
  );
}

/** A fixed paper, fetched from the server (which checks the Pro plan for paid tests). */
function FixedTest({ test, grade }: { test: TestInfo; grade: Grade }) {
  const finish = useFinish(test);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [log, setLog] = useState<Answered[]>([]);
  const [i, setI] = useState(0);

  useEffect(() => {
    let live = true;
    fetch(`/api/tests/${test.id}?grade=${grade}`, { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!live) return;
        if (r.ok) setQuestions(data.questions);
        else setError({ status: r.status, message: data.error ?? "Could not load this test." });
      })
      .catch(() => live && setError({ status: 0, message: "Could not reach the server." }));
    return () => {
      live = false;
    };
  }, [test.id, grade]);

  if (error) {
    return (
      <div className="panel">
        <p className="notice bad">{error.message}</p>
        <Link className={`btn self-start${error.status === 402 ? " gold" : ""}`} href={error.status === 402 ? "/pro" : "/tests"}>{error.status === 402 ? "Upgrade to Pro plan" : "Back to tests"}</Link>
      </div>
    );
  }
  if (!questions) return <div className="panel"><p className="muted">Loading…</p></div>;
  if (i >= questions.length) return <Results log={log} />;

  const answer = (ok: boolean) => {
    const nextLog = [...log, { q: questions[i], ok }];
    setLog(nextLog);
    setTimeout(() => {
      setI(i + 1);
      if (i + 1 >= questions.length) finish(nextLog);
    }, 250);
  };

  return (
    <>
      <Bar value={i / questions.length} />
      <div className="panel">
        <QuestionCard key={i} q={questions[i]} instant={false} onAnswer={answer} />
      </div>
    </>
  );
}
