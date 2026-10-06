"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { MethodView } from "@/components/Method";
import { useProgress, useRemember } from "@/components/Progress";
import { PracticeRound } from "@/components/PracticeRound";
import { getTopic, methodQuestion, SYMBOL, type Topic } from "@/lib/arithmetic";

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const topic = getTopic(id);
  const { ready } = useProgress();
  useRemember(topic ? { href: `/number-skills/${topic.id}`, title: topic.title } : null);
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
          <p className="eyebrow">Grade {topic.grade} · Number skills</p>
          <h2>{topic.title}</h2>
        </div>
        <Link className="btn ghost" href="/number-skills">All skills</Link>
      </div>
      {/* Examples are random, so they are only created in the browser. */}
      {ready ? (
        <>
          <Lesson topic={topic} />
          <PracticeRound bestKey={`ns-${topic.id}`} make={() => methodQuestion(topic, Math.random)} />
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
