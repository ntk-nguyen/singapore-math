"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FigureView } from "@/components/Figure";
import { PracticeRound } from "@/components/PracticeRound";
import { useRemember } from "@/components/Progress";
import { Solution } from "@/components/QuestionCard";
import type { Question } from "@/lib/questions";
import { AREAS, getThinkTopic, isFreeTopic } from "@/lib/thinking";

interface Served {
  examples: Question[];
  questions: Question[];
}

export default function ThinkingTopicPage() {
  const { id } = useParams<{ id: string }>();
  const topic = getThinkTopic(id);
  useRemember(topic ? { href: `/thinking/${topic.id}`, title: topic.title } : null);
  if (!topic) {
    return (
      <div className="panel">
        <h2>Topic not found</h2>
        <Link className="btn self-start" href="/thinking">Back to data & thinking</Link>
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="row">
        <div className="spacer">
          <p className="eyebrow">Grade {topic.grade} · {AREAS.find((a) => a.id === topic.area)!.title} · {isFreeTopic(topic) ? "Free" : "Pro plan"}</p>
          <h2>{topic.title}</h2>
        </div>
        <Link className="btn ghost" href="/thinking">All topics</Link>
      </div>
      <Topic id={topic.id} blurb={topic.blurb} />
    </div>
  );
}

/** Questions come from the server, which checks the plan for locked topics. */
function Topic({ id, blurb }: { id: string; blurb: string }) {
  const [data, setData] = useState<Served | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/thinking/${id}`, { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json();
        if (!live) return;
        if (r.ok) setData(body);
        else setError({ status: r.status, message: body.error ?? "Could not load this topic." });
      })
      .catch(() => live && setError({ status: 0, message: "Could not reach the server." }));
    return () => {
      live = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="panel">
        <p className="notice bad">{error.message}</p>
        <Link className={`btn self-start${error.status === 402 ? " gold" : ""}`} href={error.status === 402 ? "/pro" : "/thinking"}>{error.status === 402 ? "Upgrade to Pro plan" : "Back"}</Link>
      </div>
    );
  }
  if (!data) return <div className="panel"><p className="muted">Loading…</p></div>;
  return (
    <>
      <Example examples={data.examples} blurb={blurb} />
      <Practice id={id} questions={data.questions} />
    </>
  );
}

function Example({ examples, blurb }: { examples: Question[]; blurb: string }) {
  const [i, setI] = useState(0);
  const q = examples[i];
  return (
    <section className="panel">
      <p className="eyebrow">Learn</p>
      <p className="muted">{blurb}</p>
      <h3>{q.text}</h3>
      {q.figure && <FigureView figure={q.figure} />}
      <Solution q={q} />
      <p><b>Answer: {q.answer}</b></p>
      <button className="btn ghost self-start" onClick={() => setI((i + 1) % examples.length)}>
        New example
      </button>
    </section>
  );
}

/** Hands the served questions to the practice round one at a time, starting over when they run out. */
function Practice({ id, questions }: { id: string; questions: Question[] }) {
  const [next] = useState(() => {
    let k = 0;
    return () => questions[k++ % questions.length];
  });
  return <PracticeRound bestKey={`dt-${id}`} make={next} />;
}
