"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { confetti } from "@/components/Confetti";
import { useProgress, useRemember } from "@/components/Progress";
import { QuestionCard } from "@/components/QuestionCard";
import { Results, scorePoints, type Answered } from "@/components/Results";
import { placementResult, recordAnswer, startPlacement, type PlacementState } from "@/lib/placement";
import { gradeName, makeQuestion, type Grade, type Question } from "@/lib/questions";
import { vary } from "@/lib/formats";
import { pickFresh } from "@/lib/templates";
import { calculatorAllowed, DIFFICULTIES, getTest, isDifficulty, sessionOf, testGrade, usesBlueprint, type TestInfo } from "@/lib/tests";

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
      ) : test.id === "placement" ? <Placement test={test} grade={grade} /> : <Suspense><FixedTest key={grade} test={test} grade={grade} /></Suspense>}
    </div>
  );
}

/** Record the best score and add stars. A state-test paper (`points`) is scored in points. */
function useFinish(test: TestInfo, points = false) {
  const { addStars, recordBest } = useProgress();
  return (log: Answered[]) => {
    const right = log.filter((l) => l.ok).length;
    const pts = scorePoints(log);
    const pct = Math.round((points ? pts.got / pts.max : right / log.length) * 100);
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
  // Never the same question twice in one placement check.
  const [fresh] = useState(() => {
    const seen = new Set<string>();
    return (g: Grade, i: number) => vary(pickFresh(seen, () => makeQuestion(g, Math.random, i)), Math.random);
  });
  // Only rendered in the browser (after progress loads), so random questions can't cause a hydration mismatch.
  const [q, setQ] = useState<Question>(() => fresh(state.grade, 0));
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
        setQ(fresh(next.grade, next.asked));
      }
    }, 250);
  };

  if (place != null) return <Results log={log} placement={place} />;
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
  const asked = useSearchParams().get("level");
  const level = isDifficulty(asked) ? asked : "standard";
  const blueprint = usesBlueprint(test, grade);
  const finish = useFinish(test, blueprint);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [log, setLog] = useState<Answered[]>([]);
  const [i, setI] = useState(0);
  const [rested, setRested] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/tests/${test.id}?grade=${grade}&level=${level}`, { cache: "no-store" })
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
  }, [test.id, grade, level]);

  if (error) {
    return (
      <div className="panel">
        <p className="notice bad">{error.message}</p>
        <Link className={`btn self-start${error.status === 402 ? " gold" : ""}`} href={error.status === 402 ? "/pro" : "/tests"}>{error.status === 402 ? "Upgrade to Pro plan" : "Back to tests"}</Link>
      </div>
    );
  }
  if (!questions) return <div className="panel"><p className="muted">Loading…</p></div>;
  if (i >= questions.length) return <Results log={log} blueprint={blueprint ? grade : undefined} />;

  const n = questions.length, session = sessionOf(i, n);
  const tool = (s: 1 | 2) => (calculatorAllowed(grade, s) ? "calculator allowed" : "no calculator");
  // A break between the two sessions, as on the real test.
  if (blueprint && i === n / 2 && !rested) {
    return (
      <div className="panel">
        <p className="eyebrow">Session 1 done</p>
        <h3>Take a short break</h3>
        <p className="muted">Session 2 has {n / 2} more questions and ends with another show-your-work question{calculatorAllowed(grade, 2) ? ". You may use a calculator in this session." : ", again with no calculator."}</p>
        <button className="btn self-start" onClick={() => setRested(true)}>Start Session 2</button>
      </div>
    );
  }

  const answer = (ok: boolean, given: string) => {
    const nextLog = [...log, { q: questions[i], ok, given }];
    setLog(nextLog);
    setTimeout(() => {
      setI(i + 1);
      if (i + 1 >= questions.length) finish(nextLog);
    }, 250);
  };

  return (
    <>
      <p className="muted small">
        {testGrade(test, grade) > grade && `Look ahead at ${gradeName(testGrade(test, grade))} · `}{DIFFICULTIES.find((d) => d.id === level)!.label} · {blueprint ? `Session ${session} of 2 · ${tool(session)} · question ${i + 1} of ${n}` : `question ${i + 1} of ${n} · starts easier and gets harder`}
      </p>
      <Bar value={i / questions.length} />
      <div className="panel">
        <QuestionCard key={i} q={questions[i]} instant={false} onAnswer={answer} />
      </div>
    </>
  );
}
