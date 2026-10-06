"use client";

import { useEffect, useRef, useState } from "react";
import { confetti } from "@/components/Confetti";
import { useProgress, useRemember } from "@/components/Progress";
import { factKey, MASTERED, MAX, nextMastery, pickFact, strategy, TABLES } from "@/lib/timesTables";

const TRICKS: { t: number; name: string; tip: string }[] = [
  { t: 2, name: "Doubles", tip: "× 2 is doubling: 2 × 8 is 8 + 8 = 16." },
  { t: 4, name: "Double double", tip: "Double, then double again: 4 × 7 → 14 → 28." },
  { t: 8, name: "Double three times", tip: "8 × 6: 6 → 12 → 24 → 48." },
  { t: 5, name: "Half of ten", tip: "5 × 8 is half of 10 × 8 = 80, so 40." },
  { t: 10, name: "Add a zero", tip: "Every one becomes a ten: 10 × 7 = 70." },
  { t: 9, name: "Ten minus one", tip: "9 × 7 = 70 − 7 = 63. The digits always add to 9." },
  { t: 3, name: "Double plus one more", tip: "3 × 7 = 14 + 7 = 21." },
  { t: 6, name: "Five plus one more", tip: "6 × 7 = 35 + 7 = 42." },
  { t: 7, name: "Five plus two", tip: "7 × 8 = 40 + 16 = 56." },
  { t: 11, name: "Repeat the digit", tip: "11 × 4 = 44. Past 9: 11 × 12 = 120 + 12." },
  { t: 12, name: "Ten plus two", tip: "12 × 6 = 60 + 12 = 72." },
];

export default function TimesTablesPage() {
  const { facts, ready } = useProgress();
  useRemember({ href: "/times-tables", title: "Times tables" });
  const [sel, setSel] = useState<[number, number]>([7, 8]);
  const [tables, setTables] = useState<number[]>([7]);
  const [playing, setPlaying] = useState(false);
  const mastered = Object.values(facts).filter((m) => m >= MASTERED).length;
  const s = strategy(sel[0], sel[1]);

  const start = (t: number[]) => {
    setTables(t);
    setPlaying(true);
    document.getElementById("sprint")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="stack">
      <div className="intro">
        <p className="eyebrow">Grades 2 to 5 · Free</p>
        <h2>Times tables without rote</h2>
        <p className="muted">
          Learn the anchor facts (× 1, × 2, × 5, × 10) and build every other fact from them. Because 7 × 8 is the same as 8 × 7, there are only 78 facts to know, and the tricks below cover most of them.
        </p>
      </div>

      <section id="sprint" className="panel">
        <div className="row">
          <div className="spacer">
            <p className="eyebrow">Game</p>
            <h3>60-second sprint</h3>
          </div>
          <span className="muted small">{mastered} of 78 facts mastered</span>
        </div>
        {playing && ready ? (
          <Sprint tables={tables} onDone={() => setPlaying(false)} />
        ) : (
          <>
            <p className="muted">Pick the tables to practise. Facts you miss come back more often until they stick.</p>
            <div className="row" role="group" aria-label="Tables">
              {TABLES.map((t) => {
                const on = tables.includes(t);
                return (
                  <button key={t} className={`chip${on ? " on" : ""}`} aria-pressed={on}
                    onClick={() => setTables(on ? tables.filter((x) => x !== t) : [...tables, t].sort((a, b) => a - b))}>
                    × {t}
                  </button>
                );
              })}
              <button className="chip" onClick={() => setTables(TABLES)}>All</button>
            </div>
            <button className="btn self-start" disabled={!tables.length} onClick={() => start(tables)}>Start sprint</button>
          </>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Fact map</p>
        <h3>Tap any fact to see how to work it out</h3>
        <div className="ttgrid" role="grid" aria-label="Times table grid">
          <span className="tth">×</span>
          {Array.from({ length: MAX }, (_, i) => <span key={i} className="tth">{i + 1}</span>)}
          {Array.from({ length: MAX }, (_, r) => (
            <Row key={r} r={r + 1} sel={sel} facts={facts} onPick={setSel} />
          ))}
        </div>
        <div className="row small muted">
          <span className="ttkey m0" /> new <span className="ttkey m1" /> learning <span className="ttkey m3" /> mastered
        </div>
        <div className="notice">
          <b>{sel[0]} × {sel[1]} = {sel[0] * sel[1]}</b> · {s.name}. {s.how}
        </div>
      </section>

      <section className="stack" style={{ gap: 10 }}>
        <h3>The tricks</h3>
        <div className="tests">
          {TRICKS.map((x) => (
            <div key={x.t} className="test">
              <span className="std">× {x.t}</span>
              <h3>{x.name}</h3>
              <p>{x.tip}</p>
              <button className="btn ghost self-start" onClick={() => start([x.t])}>Practise × {x.t}</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Row({ r, sel, facts, onPick }: { r: number; sel: [number, number]; facts: Record<string, number>; onPick: (f: [number, number]) => void }) {
  return (
    <>
      <span className="tth">{r}</span>
      {Array.from({ length: MAX }, (_, i) => {
        const c = i + 1;
        const m = facts[factKey(r, c)] ?? 0;
        const isSel = sel[0] === r && sel[1] === c;
        const inLine = sel[0] === r || sel[1] === c;
        return (
          <button key={c} className={`ttc m${Math.min(m, 3) === 2 ? 1 : Math.min(m, 3)}${isSel ? " sel" : inLine ? " line" : ""}`}
            aria-label={`${r} times ${c}`} onClick={() => onPick([r, c])}>
            {r * c}
          </button>
        );
      })}
    </>
  );
}

const SECONDS = 60;
/** Wall-clock time, read only from event handlers and effects. */
const now = () => Date.now();
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "Go"];

function Sprint({ tables, onDone }: { tables: number[]; onDone: () => void }) {
  const { facts, setFact, addStars, recordBest, best } = useProgress();
  const [fact, setFactQ] = useState<[number, number]>(() => pickFact(tables, facts, Math.random));
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const [hint, setHint] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const askedAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    askedAt.current = Date.now();
    const end = Date.now() + SECONDS * 1000;
    const id = setInterval(() => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        clearInterval(id);
        setOver(true);
      }
    }, 250);
    inputRef.current?.focus();
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!over) return;
    recordBest("tt-sprint", score);
    if (score >= 20) confetti();
  }, [over, score, recordBest]);

  const submit = () => {
    if (!input || over) return;
    const [a, b] = fact;
    const ok = Number(input) === a * b;
    const key = factKey(a, b);
    setFact(key, nextMastery(facts[key] ?? 0, ok, now() - askedAt.current));
    if (ok) {
      setScore(score + 1);
      setStreak(streak + 1);
      if ((streak + 1) % 5 === 0) addStars(1);
      if ((streak + 1) % 10 === 0) confetti();
      setHint(null);
    } else {
      setStreak(0);
      setHint(`${a} × ${b} = ${a * b}. ${strategy(a, b).how}`);
    }
    setInput("");
    setFactQ(pickFact(tables, facts, Math.random, key));
    askedAt.current = now();
    inputRef.current?.focus();
  };

  const press = (k: string) => {
    if (k === "Go") submit();
    else if (k === "⌫") setInput(input.slice(0, -1));
    else if (input.length < 3) setInput(input + k);
  };

  if (over) {
    return (
      <>
        <p className="result-big">{score}</p>
        <p className="muted">
          correct in 60 seconds{best["tt-sprint"] != null ? ` · best ${Math.max(best["tt-sprint"], score)}` : ""}. Every 5 in a row earns a star.
        </p>
        <button className="btn self-start" onClick={onDone}>Done</button>
      </>
    );
  }

  return (
    <div className="sprint">
      <div className="row">
        <span className="streak spacer">{streak > 1 ? `${streak} in a row` : ""}</span>
        <span className="pill g">{score} right</span>
        <span className={`pill ${left <= 10 ? "r" : "g"}`} aria-live="off">{left}s</span>
      </div>
      <div className="progress"><i style={{ width: `${(left / SECONDS) * 100}%` }} /></div>
      <form className="sprintq" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <span>{fact[0]} × {fact[1]} =</span>
        <input ref={inputRef} inputMode="numeric" pattern="[0-9]*" aria-label="Answer" value={input}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 3))} />
      </form>
      <div className="keypad">
        {KEYS.map((k) => (
          <button key={k} type="button" className={k === "Go" ? "btn" : "choice"} onClick={() => press(k)}>{k}</button>
        ))}
      </div>
      <p className="feedback bad" aria-live="polite">{hint ?? ""}</p>
      <button className="btn ghost self-start" onClick={onDone}>Stop</button>
    </div>
  );
}
