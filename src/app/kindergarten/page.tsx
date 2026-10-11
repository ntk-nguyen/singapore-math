"use client";

import Link from "next/link";
import { useProgress } from "@/components/Progress";
import { LESSONS } from "@/lib/lessons";
import { kTopicStds, K_TOPICS, type KTopic } from "@/lib/quickfire-k";

const GROUPS: { domain: KTopic["domain"]; title: string; blurb: string }[] = [
  { domain: "numbers", title: "Counting & numbers", blurb: "Count pictures, compare, add and take away within 10." },
  { domain: "bar-models", title: "Number bonds & stories", blurb: "Split a number into two parts, then use it in a little story." },
  { domain: "thinking", title: "Shapes & measuring", blurb: "Name shapes, find the longest and shortest, and sort." },
];

export default function KindergartenPage() {
  const { best } = useProgress();
  const lesson = LESSONS.find((l) => l.grade === 0)!;
  return (
    <div className="stack">
      <div className="intro">
        <p className="eyebrow">Kindergarten · Free</p>
        <h2>Kindergarten math</h2>
        <p className="muted">
          Count, compare, make 10, add and take away, and name shapes, with big pictures to count and buttons that are easy to tap. Press “Read it to me” to hear each question.
          Start with the <Link href={`/lessons#${lesson.id}`}>number bond lesson</Link>, or <Link href="/play">play ten quick questions</Link>.
        </p>
      </div>
      {GROUPS.map((g) => (
        <section key={g.domain} className="stack" style={{ gap: 10 }}>
          <div>
            <h3>{g.title}</h3>
            <p className="muted small">{g.blurb}</p>
          </div>
          <div className="tests">
            {K_TOPICS.filter((t) => t.domain === g.domain).map((t) => (
              <div key={t.id} className="test">
                <span className="tag free">Free</span>
                <h3>{t.title}</h3>
                <p>{t.blurb}</p>
                {best[`k-${t.id}`] != null && <span className="muted small">Best: {best[`k-${t.id}`]}%</span>}
                <div className="row">
                  <Link className="btn" href={`/kindergarten/${t.id}`}>Practice</Link>
                  {kTopicStds(t).map((std) => <span key={std} className="std" title="Common Core standard">{std}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
