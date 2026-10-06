"use client";

import Link from "next/link";
import type { Grade, Question } from "@/lib/questions";
import { BarModel } from "./BarModel";
import { MethodView } from "./Method";

export interface Answered {
  q: Question;
  ok: boolean;
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

export function Results({ log, placement }: { log: Answered[]; placement?: Grade }) {
  const right = log.filter((l) => l.ok).length;
  const pct = Math.round((right / log.length) * 100);
  return (
    <div className="panel">
      <p className="eyebrow">Results</p>
      {placement ? (
        <>
          <p className="result-big">Grade {placement}</p>
          <p className="muted">
            Recommended starting level. Score {right}/{log.length}. The grade selector has been set for you.
          </p>
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
                  <td>{v.grade}</td>
                  <td>{v.right}/{v.n}</td>
                  <td><span className={`pill ${secure ? "g" : "r"}`}>{secure ? "Secure" : "Practise"}</span></td>
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
            {!ok && q.method && <MethodView method={q.method} />}
            {!ok && !q.method && q.model && <BarModel spec={q.model} />}
          </div>
        ))}
      </details>
      <div className="row">
        <Link className="btn" href="/tests">Back to tests</Link>
        <Link className="btn ghost" href="/play">Practise in Play</Link>
      </div>
    </div>
  );
}
