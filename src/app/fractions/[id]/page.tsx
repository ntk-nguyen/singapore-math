"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PracticeRound } from "@/components/PracticeRound";
import { useProgress } from "@/components/Progress";
import { Solution } from "@/components/QuestionCard";
import { fractionQuestion, getFracTopic, type FracTopic } from "@/lib/fractions";

export default function FractionTopicPage() {
  const { id } = useParams<{ id: string }>();
  const topic = getFracTopic(id);
  const { ready } = useProgress();
  if (!topic) {
    return (
      <div className="panel">
        <h2>Lesson not found</h2>
        <Link className="btn self-start" href="/fractions">Back to fractions & decimals</Link>
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
        <Link className="btn ghost" href="/fractions">All topics</Link>
      </div>
      {/* Examples are random, so they are only created in the browser. */}
      {ready ? (
        <>
          <Example topic={topic} />
          <PracticeRound bestKey={`fd-${topic.id}`} make={() => fractionQuestion(topic, Math.random)} />
        </>
      ) : (
        <div className="panel"><p className="muted">Loading…</p></div>
      )}
    </div>
  );
}

function Example({ topic }: { topic: FracTopic }) {
  const [q, setQ] = useState(() => fractionQuestion(topic, Math.random));
  return (
    <section className="panel">
      <p className="eyebrow">Learn</p>
      <p className="muted">{topic.blurb}</p>
      <h3>{q.text}</h3>
      <Solution q={q} />
      <p><b>Answer: {q.answer}</b></p>
      <button className="btn ghost self-start" onClick={() => setQ(fractionQuestion(topic, Math.random))}>
        New example
      </button>
    </section>
  );
}
