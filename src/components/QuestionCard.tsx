"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { FORMAT_LABEL, formatOf, inputOf, isRight, PICK_SEP } from "@/lib/formats";
import { gradeName, type Question } from "@/lib/questions";
import { readsAloud, spokenText } from "@/lib/speech";
import { BarModel } from "./BarModel";
import { FigureView } from "./Figure";
import { MethodView } from "./Method";

const PRAISE = ["Brilliant!", "You got it!", "Super!", "Spot on!"];

/**
 * One question, in any format: tap a choice, type the answer, tap items in order, tap
 * every right choice, or answer Part A and Part B.
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
    <div className={q.grade === 0 ? "qcard k" : "qcard"}>
      <span className="std">
        {gradeName(q.grade)} · CCSS {q.std}
        {format !== "choice" && <span className="fmt">{FORMAT_LABEL[format]}</span>}
      </span>
      <p className="qtext">{q.text}</p>
      {q.ask && <p className="qask">{q.ask}</p>}
      {readsAloud(q) && <ReadAloud text={spokenText(q)} />}
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
      {input === "multi" && <MultiPicker q={q} done={!!chosen} mark={instant} onSubmit={choose} />}
      {input === "parts" && <PartsPicker q={q} done={!!chosen} mark={instant} onSubmit={choose} />}
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

const noSubscribe = () => () => {};

/** "Read it to me": says the question and its choices out loud, for children still learning to read. */
function ReadAloud({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  // Speech is only in the browser (never on the server render), and stops when the question changes.
  const can = useSyncExternalStore(noSubscribe, () => "speechSynthesis" in window, () => false);
  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, [text]);
  if (!can) return null;
  const say = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    if (speaking) return setSpeaking(false);
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  };
  return (
    <button type="button" className="readaloud" aria-pressed={speaking} onClick={say}>
      <span aria-hidden="true">🔊</span>{speaking ? "Stop" : "Read it to me"}
    </button>
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

/** Tap every choice that is right, then check. Marked all-or-nothing. */
function MultiPicker({ q, done, mark, onSubmit }: { q: Question; done: boolean; mark: boolean; onSubmit: (v: string) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (c: string) => setPicked(picked.includes(c) ? picked.filter((x) => x !== c) : [...picked, c]);
  const cls = (c: string) => {
    const on = picked.includes(c) ? " picked" : "";
    if (!mark || !done) return `choice${on}`;
    if (q.answers?.includes(c)) return `choice right${on}`;
    return on ? "choice wrong picked" : "choice";
  };
  return (
    <div className="multi">
      <div className={`choices${q.choices.some((c) => c.length > 14) ? " wide" : ""}`}>
        {q.choices.map((c) => (
          <button key={c} className={cls(c)} aria-pressed={picked.includes(c)} disabled={done} onClick={() => toggle(c)}>
            <span className="tick" aria-hidden="true">{picked.includes(c) ? "✓" : ""}</span>{c}
          </button>
        ))}
      </div>
      <button className="btn self-start" disabled={done || picked.length < 2} onClick={() => onSubmit(picked.join(PICK_SEP))}>Check</button>
    </div>
  );
}

/** Part A and Part B, one choice each, then check. Both parts must be right. */
function PartsPicker({ q, done, mark, onSubmit }: { q: Question; done: boolean; mark: boolean; onSubmit: (v: string) => void }) {
  const parts = q.parts ?? [];
  const [picked, setPicked] = useState<(string | null)[]>(() => parts.map(() => null));
  const cls = (i: number, c: string) => {
    const on = picked[i] === c ? " picked" : "";
    if (!mark || !done) return `choice${on}`;
    if (c === parts[i].answer) return `choice right${on}`;
    return on ? "choice wrong picked" : "choice";
  };
  return (
    <div className="parts">
      {parts.map((p, i) => (
        <div key={i} className="part">
          <p className="part-text"><b>Part {"AB"[i]}.</b> {p.text}</p>
          <div className={`choices${p.choices.some((c) => c.length > 14) ? " wide" : ""}`}>
            {p.choices.map((c) => (
              <button key={c} className={cls(i, c)} aria-pressed={picked[i] === c} disabled={done} onClick={() => setPicked(picked.map((x, k) => (k === i ? c : x)))}>
                {c}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button className="btn self-start" disabled={done || picked.some((x) => x == null)} onClick={() => onSubmit(picked.join(PICK_SEP))}>Check</button>
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
