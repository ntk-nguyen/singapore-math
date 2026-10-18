"use client";

import Link from "next/link";
import { pointsEarned, pointsFor } from "@/lib/formats";
import { type Grade, gradeCode, gradeName, type Question } from "@/lib/questions";
import { BLUEPRINT, categoryOf } from "@/lib/tests";
import { Solution } from "./QuestionCard";

export interface Answered {
  q: Question;
  ok: boolean;
  /** The answer given; parts of a multi-part question are joined by `PICK_SEP`. */
  given?: string;
}

/** Points earned and possible on one answer, scored as MCAS does: a point for each right part. */
function points({ q, ok, given }: Answered) {
  const max = pointsFor(q);
  return { got: given == null ? (ok ? max : 0) : pointsEarned(q, given), max };
}

/** Points earned and possible on a whole paper. */
export function scorePoints(log: Answered[]) {
  return log.map(points).reduce((a, b) => ({ got: a.got + b.got, max: a.max + b.max }), { got: 0, max: 0 });
}

/** Points by MCAS reporting category, in the blueprint's order. */
export function scoreByCategory(log: Answered[], grade: Grade) {
  return (BLUEPRINT[grade] ?? []).map((c) => {
    const mine = log.filter((l) => categoryOf(grade, l.q.std) === c.name);
    return { name: c.name, weight: c.weight, ...scorePoints(mine) };
  }).filter((c) => c.max > 0);
}

export function scoreByStandard(log: Answered[]) {
  const by: Record<string, { grade: Grade; right: number; n: number }> = {};
  for (const { q, ok } of log) {
    const s = (by[q.std] ??= { grade: q.grade, right: 0, n: 0 });
    s.n++;
    if (ok) s.right++;
  }
  return Object.entries(by).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
}

/**
 * The score, a table by standard and the answers to review. A state-test paper
 * (`blueprint`, its grade) is scored in points, with a table by reporting category.
 */
export function Results({ log, placement, blueprint }: { log: Answered[]; placement?: Grade; blueprint?: Grade }) {
  const right = log.filter((l) => l.ok).length;
  const pts = scorePoints(log);
  const pct = Math.round((blueprint != null ? pts.got / pts.max : right / log.length) * 100);
  return (
    <div className="panel">
      <p className="eyebrow">Results</p>
      {placement != null ? (
        <>
          <p className="result-big">{gradeName(placement)}</p>
          <p className="muted">
            Recommended starting level. Score {right}/{log.length}. The grade selector has been set for you.
          </p>
        </>
      ) : blueprint != null ? (
        <>
          <p className="result-big">{pct}%</p>
          <p className="muted">
            {pts.got} of {pts.max} points. Each part of a two-part or show-your-work question earns its own point, as on MCAS.
          </p>
          <h3 style={{ marginTop: 8 }}>By reporting category</h3>
          <div className="tablewrap">
            <table>
              <thead>
                <tr><th>Category</th><th>Points</th><th>Status</th></tr>
              </thead>
              <tbody>
                {scoreByCategory(log, blueprint).map((c) => {
                  const secure = c.got / c.max >= 0.6;
                  return (
                    <tr key={c.name}>
                      <td>{c.name}</td>
                      <td>{c.got}/{c.max}</td>
                      <td><span className={`pill ${secure ? "g" : "r"}`}>{secure ? "Secure" : "Practice"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <p className="result-big">{pct}%</p>
          <p className="muted">
            {right} of {log.length} correct.
          </p>
        </>
      )}
      <h3 style={{ marginTop: 8 }}>By standard</h3>
      <div className="tablewrap">
        <table>
          <thead>
            <tr><th>Standard</th><th>Grade</th><th>Score</th><th>Status</th></tr>
          </thead>
          <tbody>
            {scoreByStandard(log).map(([std, v]) => {
              const secure = v.right / v.n >= 0.6;
              return (
                <tr key={std}>
                  <td className="mono">{std}</td>
                  <td>{gradeCode(v.grade)}</td>
                  <td>{v.right}/{v.n}</td>
                  <td><span className={`pill ${secure ? "g" : "r"}`}>{secure ? "Secure" : "Practice"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <details>
        <summary>Review answers</summary>
        {log.map(({ q, ok }, i) => (
          <div key={i} className="review">
            <p>
              <b>{i + 1}.</b> {q.text} <span className={`pill ${ok ? "g" : "r"}`}>{ok ? "Correct" : `Answer: ${q.answer}`}</span>
            </p>
            {!ok && <Solution q={q} />}
          </div>
        ))}
      </details>
      <div className="row">
        <Link className="btn" href="/tests">Back to tests</Link>
        <Link className="btn ghost" href="/play">Practice in Play</Link>
      </div>
    </div>
  );
}
