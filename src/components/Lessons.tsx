"use client";

import { useState } from "react";
import type { Lesson } from "@/lib/lessons";
import { BarModel } from "./BarModel";
import { confetti } from "./Confetti";
import { useProgress } from "./Progress";

function BondSlider() {
  const [a, setA] = useState(3);
  const b = 10 - a;
  return (
    <>
      <BarModel spec={{ t: "bond", w: 10, p: [a, b] }} />
      <input type="range" min={0} max={10} value={a} aria-label="First part" onChange={(e) => setA(Number(e.target.value))} />
      <p className="mono">
        {a} + {b} = 10 · 10 − {a} = {b}
      </p>
    </>
  );
}

function Steps({ lesson }: { lesson: Lesson }) {
  const [i, setI] = useState(0);
  const { completeLesson } = useProgress();
  const last = lesson.steps.length - 1;
  const step = lesson.steps[i];

  const next = () => {
    const n = i === last ? 0 : i + 1;
    setI(n);
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
    <section className={`panel${current ? " current" : ""}`} aria-labelledby={`${lesson.id}-title`}>
      <p className="eyebrow">
        Grade {lesson.grade} · CCSS {lesson.std}
        {current ? " · Your grade" : ""}
      </p>
      <h3 id={`${lesson.id}-title`}>{lesson.title}</h3>
      <p className={lesson.kind === "steps" ? "qtext" : "muted"} style={lesson.kind === "steps" ? { fontSize: "1rem" } : undefined}>
        {lesson.problem}
      </p>
      {lesson.kind === "bond-slider" ? <BondSlider /> : <Steps lesson={lesson} />}
    </section>
  );
}
