"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BarModel } from "@/components/BarModel";
import { FigureView } from "@/components/Figure";
import { LogoMark } from "@/components/Logo";
import { formatOf, inputOf } from "@/lib/formats";
import type { Question } from "@/lib/questions";

interface Paper {
  paper: { id: string; name: string; grade: number; code: string };
  seed: number;
  questions: Question[];
}

const LETTERS = "ABCDEFGH";

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="panel"><p className="muted">Loading…</p></div>}>
      <PrintPaper />
    </Suspense>
  );
}

/**
 * A printable practice paper with its answer key on a separate page. "Download PDF"
 * opens the browser's print dialog, where "Save as PDF" saves it as a file. The seed
 * is kept in the address, so a reload shows the same paper and "New paper" draws
 * another one.
 */
function PrintPaper() {
  const params = useSearchParams();
  const router = useRouter();
  const kind = params.get("kind") ?? "checkpoint";
  const grade = params.get("grade") ?? "3";
  const seed = params.get("seed");
  const [data, setData] = useState<Paper | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);

  useEffect(() => {
    let live = true;
    const q = new URLSearchParams({ grade });
    if (seed) q.set("seed", seed);
    fetch(`/api/papers/${encodeURIComponent(kind)}?${q}`, { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json();
        if (!live) return;
        if (!r.ok) return setError({ status: r.status, message: body.error ?? "Could not make this paper." });
        setError(null);
        setData(body);
        // Keep the seed in the address, so reloading or sharing the link gives this same paper.
        if (!seed) router.replace(`/tests/print?kind=${encodeURIComponent(kind)}&grade=${grade}&seed=${body.seed}`);
      })
      .catch(() => live && setError({ status: 0, message: "Could not reach the server." }));
    return () => {
      live = false;
    };
  }, [kind, grade, seed, router]);

  const fresh = () => {
    setData(null);
    router.push(`/tests/print?kind=${encodeURIComponent(kind)}&grade=${grade}`);
  };

  if (error) {
    return (
      <div className="panel">
        <p className="notice bad">{error.message}</p>
        <Link className={`btn self-start${error.status === 402 ? " gold" : ""}`} href={error.status === 402 ? "/pro" : "/tests"}>{error.status === 402 ? "Upgrade to Pro plan" : "Back to tests"}</Link>
      </div>
    );
  }
  if (!data || (seed && String(data.seed) !== seed)) return <div className="panel"><p className="muted">Making your paper…</p></div>;

  const { paper, questions } = data;
  return (
    <div className="stack">
      <div className="row no-print">
        <div className="spacer">
          <p className="eyebrow">Printable paper</p>
          <h2>{paper.name}</h2>
          <p className="muted small">Grade {paper.grade} · {questions.length} questions · answer key on the last page. Every new paper has different questions.</p>
        </div>
        <Link className="btn ghost" href="/tests">Back</Link>
        <button className="btn ghost" onClick={fresh}>New paper</button>
        <button className="btn" onClick={() => window.print()}>Download PDF</button>
      </div>
      <p className="muted small no-print">In the print window, choose “Save as PDF” to download it, or pick a printer.</p>

      <article className="paper">
        <header className="paper-head">
          <div className="paper-brand"><LogoMark className="paper-mark" />MathBridge</div>
          <h1>{paper.name}</h1>
          <p className="paper-meta">Grade {paper.grade} · {questions.length} questions · Paper {paper.code}</p>
          <div className="paper-fields">
            <span>Name <i /></span>
            <span>Date <i /></span>
            <span>Score <i /> / {questions.length}</span>
          </div>
        </header>
        <ol className="paper-qs">
          {questions.map((q, n) => <PaperQuestion key={n} q={q} />)}
        </ol>

        <section className="paper-key">
          <header className="paper-head">
            <h1>Answer key</h1>
            <p className="paper-meta">{paper.name} · Grade {paper.grade} · Paper {paper.code}</p>
          </header>
          <ol className="key-list">
            {questions.map((q, n) => (
              <li key={n}>
                <b>{keyAnswer(q)}</b>
                {q.explain && <span className="muted"> {q.explain}</span>}
                {q.steps && <span className="key-steps">{q.steps.join(" ")}</span>}
                <span className="key-std">CCSS {q.std}</span>
              </li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}

/** The answer as written in the key: the letter and the choice, or what to write. */
function keyAnswer(q: Question): string {
  if (inputOf(q) !== "choose") return q.answer;
  const i = q.choices.indexOf(q.answer);
  return i >= 0 ? `${LETTERS[i]}. ${q.answer}` : q.answer;
}

/** One question laid out for paper: circle a letter, write the answer, or number the items in order. */
function PaperQuestion({ q }: { q: Question }) {
  const format = formatOf(q), input = inputOf(q);
  const wide = q.choices.some((c) => c.length > 14);
  return (
    <li className="pq">
      <p className="qtext">{q.text}</p>
      {q.ask && <p className="qask">{q.ask}</p>}
      {q.figure && <FigureView figure={q.figure} />}
      {format === "model" && q.model && <BarModel spec={q.model} />}
      {input === "choose" && (
        <ol className={`pq-choices${wide ? " wide" : ""}`}>
          {q.choices.map((c, i) => <li key={c}><span className="pq-letter">{LETTERS[i]}</span>{c}</li>)}
        </ol>
      )}
      {input === "type" && <p className="pq-line">Answer: <i /></p>}
      {input === "order" && (
        <>
          <p className="pq-items">{(q.items ?? []).join("     ")}</p>
          <p className="pq-line">Least to greatest: <i /></p>
        </>
      )}
      {/* Room to draw a bar model or work it out on word problems. */}
      {q.model && format !== "model" && <div className="pq-work" aria-hidden="true" />}
    </li>
  );
}
