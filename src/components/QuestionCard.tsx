"use client";

import { useState } from "react";
import { FORMAT_LABEL, formatOf, inputOf, isRight } from "@/lib/formats";
import type { Question } from "@/lib/questions";
import { BarModel } from "./BarModel";
import { FigureView } from "./Figure";
import { MethodView } from "./Method";

const PRAISE = ["Brilliant!", "You got it!", "Super!", "Spot on!"];

/**
 * One question, in any format: tap a choice, type the answer, or tap items in order.
 * In practice mode (`instant`) it marks the answer and shows the worked solution after
 * a miss; in test mode it just records the answer.
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
  const format = formatOf(q), input = inputOf(q);
  const ok = chosen != null && isRight(q, chosen);

  const choose = (c: string) => {
    if (chosen || !c.trim()) return;
    setChosen(c);
    const right = isRight(q, c);
    if (instant && !right) setShowModel(true);
    onAnswer(right);
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
        {format !== "choice" && <span className="fmt">{FORMAT_LABEL[format]}</span>}
      </span>
      <p className="qtext">{q.text}</p>
      {q.ask && <p className="qask">{q.ask}</p>}
      {q.figure && <FigureView figure={q.figure} />}
      {format === "model" && q.model && <BarModel spec={q.model} />}
      {(q.model || q.method || q.steps) && (showModel ? (
        <Solution q={q} />
      ) : (
        <button className="btn ghost self-start" onClick={() => setShowModel(true)}>
          {q.method || q.steps ? "Show me how" : "Show me the bar model"}
        </button>
      ))}
      {input === "type" && <TypeIn done={!!chosen} onSubmit={choose} />}
      {input === "order" && <OrderPicker items={q.items ?? []} done={!!chosen} onSubmit={choose} />}
      {input === "choose" && (
        /* Sentence answers ("No, it should be about 300") get one wide column. */
        <div className={`choices${q.choices.some((c) => c.length > 14) ? " wide" : ""}`}>
          {q.choices.map((c) => (
            <button key={c} className={cls(c)} disabled={!!chosen} onClick={() => choose(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
      <p className={`feedback ${instant && chosen ? (ok ? "good" : "bad") : ""}`} aria-live="polite">
        {instant && chosen ? (ok ? `${praise}${q.explain && format === "estimate" ? ` ${q.explain}` : ""}` : `Not quite. The answer is ${q.answer}.${q.explain ? ` ${q.explain}` : ""}`) : ""}
      </p>
      {chosen && children}
    </div>
  );
}

function TypeIn({ done, onSubmit }: { done: boolean; onSubmit: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form className="typein" onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}>
      <input
        className="typein-box"
        value={v}
        onChange={(e) => setV(e.target.value)}
        disabled={done}
        inputMode="text"
        autoComplete="off"
        aria-label="Your answer"
        placeholder="Your answer"
      />
      <button className="btn" type="submit" disabled={done || !v.trim()}>Check</button>
    </form>
  );
}

/** Tap the items in order; the answer is sent once every item has been placed. */
function OrderPicker({ items, done, onSubmit }: { items: string[]; done: boolean; onSubmit: (v: string) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const pick = (x: string) => {
    const next = [...picked, x];
    setPicked(next);
    if (next.length === items.length) onSubmit(next.join(", "));
  };
  return (
    <div className="order">
      <div className="order-line" aria-label="Your order">
        {items.map((_, i) => <span key={i} className={`order-slot${picked[i] ? " filled" : ""}`}>{picked[i] ?? (i === 0 ? "least" : "")}</span>)}
      </div>
      <div className="choices">
        {items.map((x) => (
          <button key={x} className="choice" disabled={done || picked.includes(x)} onClick={() => pick(x)}>{x}</button>
        ))}
      </div>
      {!done && picked.length > 0 && <button className="btn ghost self-start" onClick={() => setPicked(picked.slice(0, -1))}>Undo</button>}
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
