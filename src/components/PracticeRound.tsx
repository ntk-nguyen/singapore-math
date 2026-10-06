"use client";

import { useState } from "react";
import type { Question } from "@/lib/questions";
import { vary } from "@/lib/formats";
import { noRepeats } from "@/lib/templates";
import { confetti } from "./Confetti";
import { useProgress } from "./Progress";
import { QuestionCard } from "./QuestionCard";

const ROUND = 10;

/** Ten questions in a row with stars, a streak and a saved best score. */
export function PracticeRound({ make, bestKey }: { make: () => Question; bestKey: string }) {
  const { addStars, recordBest } = useProgress();
  // Never the same question twice, including after "Practise again", and asked in a mix of formats.
  const [fresh] = useState(() => noRepeats(() => vary(make(), Math.random)));
  const [q, setQ] = useState(fresh);
  const [done, setDone] = useState(0);
  const [right, setRight] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [qn, setQn] = useState(0);

  const answer = (ok: boolean) => {
    setDone(done + 1);
    if (ok) {
      setRight(right + 1);
      setStreak(streak + 1);
      addStars(streak + 1 >= 3 ? 2 : 1);
    } else setStreak(0);
  };

  const next = () => {
    if (done >= ROUND) {
      const pct = Math.round((right / ROUND) * 100);
      recordBest(bestKey, pct);
      if (pct >= 80) confetti();
      setFinished(true);
      return;
    }
    setQn(qn + 1);
    setQ(fresh());
  };

  const restart = () => {
    setDone(0);
    setRight(0);
    setStreak(0);
    setFinished(false);
    setQn(qn + 1);
    setQ(fresh());
  };

  return (
    <section className="panel">
      <div className="row">
        <div className="spacer">
          <p className="eyebrow">Practise</p>
          <h3>Ten in a row</h3>
        </div>
        <span className="streak">{streak > 1 ? `${streak} in a row` : ""}</span>
      </div>
      <div className="progress"><i style={{ width: `${(done / ROUND) * 100}%` }} /></div>
      {finished ? (
        <>
          <p className="result-big">{right}/{ROUND}</p>
          <p className="muted">
            {right >= 8 ? "Excellent! Try the next skill." : "Use “Show me how” on the tricky ones, then try again."}
          </p>
          <button className="btn self-start" onClick={restart}>Practise again</button>
        </>
      ) : (
        <QuestionCard key={qn} q={q} onAnswer={answer}>
          <button className="btn self-start" onClick={next}>{done >= ROUND ? "See results" : "Next question"}</button>
        </QuestionCard>
      )}
    </section>
  );
}
