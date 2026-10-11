"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PracticeRound } from "@/components/PracticeRound";
import { useProgress, useRemember } from "@/components/Progress";
import { getKTopic, kTopicQuestion } from "@/lib/quickfire-k";

export default function KTopicPage() {
  const { id } = useParams<{ id: string }>();
  const topic = getKTopic(id);
  const { ready } = useProgress();
  useRemember(topic ? { href: `/kindergarten/${topic.id}`, title: topic.title } : null);
  if (!topic) {
    return (
      <div className="panel">
        <h2>Topic not found</h2>
        <Link className="btn self-start" href="/kindergarten">Back to Kindergarten</Link>
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="row">
        <div className="spacer">
          <p className="eyebrow">Kindergarten · Free</p>
          <h2>{topic.title}</h2>
          <p className="muted">{topic.blurb}</p>
        </div>
        <Link className="btn ghost" href="/kindergarten">All topics</Link>
      </div>
      {/* Questions are random, so they are only made in the browser. */}
      {ready ? (
        <PracticeRound bestKey={`k-${topic.id}`} make={() => kTopicQuestion(topic, Math.random)} />
      ) : (
        <div className="panel"><p className="muted">Loading…</p></div>
      )}
    </div>
  );
}
