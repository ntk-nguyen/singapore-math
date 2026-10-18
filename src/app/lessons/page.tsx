"use client";

import { BarModel } from "@/components/BarModel";
import { LessonCard } from "@/components/Lessons";
import { useProgress } from "@/components/Progress";
import { LESSONS } from "@/lib/lessons";

export default function LessonsPage() {
  const { grade } = useProgress();
  // The child's grade first, then the rest in order.
  const ordered = [...LESSONS].sort((a, b) => (a.grade === grade ? -1 : b.grade === grade ? 1 : a.grade - b.grade));
  return (
    <div className="stack">
      <div className="hero">
        <div>
          <p className="eyebrow">Bar model lessons · Concrete → Pictorial → Abstract</p>
          <h1>Draw the problem, then solve it.</h1>
          <p className="lead">
            Singapore Math turns word problems into bars and bonds you can see. One worked lesson per grade, starting with yours. Press Next step to see each bar appear.
          </p>
        </div>
        <BarModel spec={{ t: "units", n: 5, shade: 3, unit: null, total: 40 }} />
      </div>
      <div className="grid2">
        {ordered.map((l) => (
          <LessonCard key={l.id} lesson={l} current={l.grade === grade} />
        ))}
      </div>
    </div>
  );
}
