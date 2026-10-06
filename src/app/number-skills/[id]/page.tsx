"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { confetti } from "@/components/Confetti";
import { MethodView } from "@/components/Method";
import { useProgress } from "@/components/Progress";
import { QuestionCard } from "@/components/QuestionCard";
import { getTopic, methodQuestion, SYMBOL, type Topic } from "@/lib/arithmetic";

const ROUND = 10;

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const topic = getTopic(id);
  const { ready } = useProgress();
  if (!topic) {
    return (
      <div className="panel">
        <h2>Lesson not found</h2>
        <Link className="btn self-start" href="/number-skills">Back to number skills</Link>
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="row">
        <div className="spacer">
          <p className="eyebrow">Grade {topic.grade} · CCSS {topic.std}</p>
          <h2>{topic.title}</h2>
        </div>
        <Link className="btn ghost" href="/number-skills">All skills</Link>
      </div>
      {/* Examples are random, so they are only created in the browser. */}
      {ready ? (
        <>
          <Lesson topic={topic} />
          <Practice topic={topic} />
        </>
      ) : (
        <div className="panel"><p className="muted">Loading…</p></div>
      )}
    </div>
  );
}

function Lesson({ topic }: { topic: Topic }) {
  const [example, setExample] = useState(() => topic.gen(Math.random));
  const [n, setN] = useState(0);
  return (
    <section className="panel">
      <p className="eyebrow">Learn</p>
      <h3>
        {example.a.toLocaleString("en-US")} {SYMBOL[topic.op]} {example.b.toLocaleString("en-US")}
      </h3>
      <MethodView key={n} method={{ op: topic.op, ...example }} />
      <button
        className="btn ghost self-start"
        onClick={() => {
          setExample(topic.gen(Math.random));
          setN(n + 1);
        }}
      >
        New example
      </button>
    </section>
  );
}

function Practice({ topic }: { topic: Topic }) {
  const { addStars, recordBest } = useProgress();
  const [q, setQ] = useState(() => methodQuestion(topic, Math.random));
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
      recordBest(`ns-${topic.id}`, pct);
      if (pct >= 80) confetti();
      setFinished(true);
      return;
    }
    setQn(qn + 1);
    setQ(methodQuestion(topic, Math.random));
  };

  const restart = () => {
    setDone(0);
    setRight(0);
    setStreak(0);
    setFinished(false);
    setQn(qn + 1);
    setQ(methodQuestion(topic, Math.random));
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
