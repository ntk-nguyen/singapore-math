"use client";

import { useState } from "react";
import type { Lesson } from "@/lib/lessons";
import { gradeName } from "@/lib/questions";
import { BarModel } from "./BarModel";
import { confetti } from "./Confetti";
import { useProgress } from "./Progress";

function BondSlider({ lesson }: { lesson: Lesson }) {
  const w = lesson.whole ?? 10;
  const [a, setA] = useState(Math.min(3, w - 1));
  const { setRecent } = useProgress();
  const b = w - a;
  return (
    <>
      <BarModel spec={{ t: "bond", w, p: [a, b] }} />
      <input type="range" min={0} max={w} value={a} aria-label="First part" onChange={(e) => {
          setA(Number(e.target.value));
          setRecent({ href: `/lessons#${lesson.id}`, title: lesson.title });
        }} />
      <p className="mono">
        {a} + {b} = {w} · {w} − {a} = {b}
      </p>
    </>
  );
}

function Steps({ lesson }: { lesson: Lesson }) {
  const [i, setI] = useState(0);
  const { completeLesson, setRecent } = useProgress();
  const last = lesson.steps.length - 1;
  const step = lesson.steps[i];

  const next = () => {
    const n = i === last ? 0 : i + 1;
    setI(n);
    setRecent({ href: `/lessons#${lesson.id}`, title: lesson.title });
    if (n === last && completeLesson(lesson.id)) confetti();
  };

  return (
    <>
      <BarModel spec={step.model} />
      <p style={{ fontWeight: 700 }}>{step.caption}</p>
      <button className="btn self-start" onClick={next}>
        {i === last ? "Start over" : "Next step"}
      </button>
    </>
  );
}

export function LessonCard({ lesson, current }: { lesson: Lesson; current: boolean }) {
  return (
    <section id={lesson.id} className={`panel anchor${current ? " current" : ""}`} aria-labelledby={`${lesson.id}-title`}>
      <div className="row">
        <p className="eyebrow spacer">
          {gradeName(lesson.grade)}
          {current ? " · Your grade" : ""}
        </p>
        <span className="std" title="Common Core standard">{lesson.std}</span>
      </div>
      <h3 id={`${lesson.id}-title`}>{lesson.title}</h3>
      <p className={lesson.kind === "steps" ? "qtext" : "muted"} style={lesson.kind === "steps" ? { fontSize: "1rem" } : undefined}>
        {lesson.problem}
      </p>
      {lesson.kind === "bond-slider" ? <BondSlider lesson={lesson} /> : <Steps lesson={lesson} />}
    </section>
  );
}
