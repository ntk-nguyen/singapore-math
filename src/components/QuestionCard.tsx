"use client";

import { useState } from "react";
import type { Question } from "@/lib/questions";
import { BarModel } from "./BarModel";
import { FigureView } from "./Figure";
import { MethodView } from "./Method";

const PRAISE = ["Brilliant!", "You got it!", "Super!", "Spot on!"];

/**
 * One multiple-choice question. In practice mode (`instant`) it marks the answer and
 * shows the bar model after a miss; in test mode it just records the choice.
 */
export function QuestionCard({
  q,
  instant = true,
  onAnswer,
  children,
}: {
  q: Question;
  instant?: boolean;
  onAnswer: (ok: boolean) => void;
  children?: React.ReactNode;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [showModel, setShowModel] = useState(false);
  const [praise] = useState(() => PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  const ok = chosen === q.answer;

  const choose = (c: string) => {
    if (chosen) return;
    setChosen(c);
    if (instant && c !== q.answer) setShowModel(true);
    onAnswer(c === q.answer);
  };

  const cls = (c: string) => {
    if (!instant || !chosen) return "choice";
    if (c === q.answer) return "choice right";
    if (c === chosen) return "choice wrong";
    return "choice";
  };

  return (
    <div className="qcard">
      <span className="std">
        Grade {q.grade} · CCSS {q.std}
      </span>
      <p className="qtext">{q.text}</p>
      {q.figure && <FigureView figure={q.figure} />}
      {(q.model || q.method || q.steps) && (showModel ? (
        <Solution q={q} />
      ) : (
        <button className="btn ghost self-start" onClick={() => setShowModel(true)}>
          {q.method || q.steps ? "Show me how" : "Show me the bar model"}
        </button>
      ))}
      {/* Sentence answers ("No, it should be about 300") get one wide column. */}
      <div className={`choices${q.choices.some((c) => c.length > 14) ? " wide" : ""}`}>
        {q.choices.map((c) => (
          <button key={c} className={cls(c)} disabled={!!chosen} onClick={() => choose(c)}>
            {c}
          </button>
        ))}
      </div>
      <p className={`feedback ${instant && chosen ? (ok ? "good" : "bad") : ""}`} aria-live="polite">
        {instant && chosen ? (ok ? praise : `Not quite. The answer is ${q.answer}.`) : ""}
      </p>
      {chosen && children}
    </div>
  );
}

/** The worked solution: a step-through method, or a bar model with written steps. */
export function Solution({ q }: { q: Question }) {
  if (q.method) return <MethodView method={q.method} />;
  return (
    <>
      {q.model && <BarModel spec={q.model} />}
      {q.steps && (
        <ol className="steps">
          {q.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}
    </>
  );
}
