"use client";

import { useEffect, useState } from "react";
import { confetti } from "@/components/Confetti";
import { useProgress } from "@/components/Progress";
import { QuestionCard } from "@/components/QuestionCard";
import { playDeck, type Grade, type Question } from "@/lib/questions";
import { vary } from "@/lib/formats";

const ROUND = 10;

export default function PlayPage() {
  const { grade } = useProgress();
  return <Round key={grade} grade={grade} />;
}

function Round({ grade }: { grade: Grade }) {
  const { addStars } = useProgress();
  // Every question type once before any comes back, never the same question twice while this grade is open, in a mix of formats.
  const [fresh] = useState(() => { const next = playDeck(grade, Math.random); return () => vary(next(), Math.random); });
  const [q, setQ] = useState<Question | null>(null);
  const [done, setDone] = useState(0);
  const [right, setRight] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [qn, setQn] = useState(0);

  useEffect(() => {
    // Questions are random, so create them in the browser only (avoids a hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQ(fresh());
  }, [fresh, round]);

  const answer = (ok: boolean) => {
    setDone((d) => d + 1);
    if (ok) {
      const s = streak + 1;
      setRight((r) => r + 1);
      setStreak(s);
      addStars(s >= 3 ? 2 : 1);
      if (s % 5 === 0) confetti();
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    if (done >= ROUND) {
      if (right >= 8) confetti();
      setQ(null);
      return;
    }
    setQn((n) => n + 1);
    setQ(fresh());
  };

  const restart = () => {
    setDone(0);
    setRight(0);
    setStreak(0);
    setQn(0);
    setRound((r) => r + 1);
  };

  const finished = done >= ROUND && q === null;

  return (
    <div className="stack">
      <div className="row">
        <div className="spacer">
          <p className="eyebrow">Grade {grade} · quick fire</p>
          <h2>Ten-question challenge</h2>
        </div>
        <span className="streak">{streak > 1 ? `${streak} in a row` : ""}</span>
      </div>
      <div className="progress">
        <i style={{ width: `${done * 10}%` }} />
      </div>
      <div className="panel">
        {finished ? (
          <>
            <p className="eyebrow">Round complete</p>
            <p className="result-big">{right}/10</p>
            <p className="muted">
              {right >= 8
                ? "Excellent work. Try the next grade up!"
                : right >= 5
                  ? "Good effort. Use “Show me the bar model” on the tricky ones."
                  : "Keep practising. The bar model hints help a lot."}
            </p>
            <button className="btn self-start" onClick={restart}>Play again</button>
          </>
        ) : q ? (
          <QuestionCard key={`${round}-${qn}`} q={q} onAnswer={answer}>
            <button className="btn self-start" onClick={next}>
              {done >= ROUND ? "See results" : "Next question"}
            </button>
          </QuestionCard>
        ) : (
          <p className="muted">Loading…</p>
        )}
      </div>
    </div>
  );
}
