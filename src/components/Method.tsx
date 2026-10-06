"use client";

import { Fragment, useState } from "react";
import {
  addSteps,
  areaModel,
  longDivision,
  make10Steps,
  PLACE_SHORT,
  subSteps,
  type ColumnStep,
  type Method,
} from "@/lib/arithmetic";
import { BarModel } from "./BarModel";

/** Step-through controls shared by every method. */
function Stepper({ count, children }: { count: number; children: (i: number) => React.ReactNode }) {
  const [i, setI] = useState(0);
  return (
    <div className="stack" style={{ gap: 12 }}>
      {children(i)}
      <div className="row">
        <button className="btn ghost" onClick={() => setI(i - 1)} disabled={i === 0}>Back</button>
        <button className="btn" onClick={() => setI(i === count - 1 ? 0 : i + 1)}>
          {i === count - 1 ? "Start over" : "Next step"}
        </button>
        <span className="muted small">Step {i + 1} of {count}</span>
      </div>
    </div>
  );
}

/** Walks through any arithmetic problem with the Singapore method for its operation. */
export function MethodView({ method }: { method: Method }) {
  const { op, a, b } = method;
  if (op === "make10") return <Make10 a={a} b={b} />;
  if (op === "add" || op === "sub") return <Columns op={op} a={a} b={b} />;
  if (op === "mul") return <Area a={a} b={b} />;
  return <Division a={a} b={b} />;
}

/* ---------------- make 10 ---------------- */

function Make10({ a, b }: { a: number; b: number }) {
  const m = make10Steps(a, b);
  return (
    <Stepper count={m.steps.length}>
      {(i) => {
        const s = m.steps[i];
        return (
          <>
            <div className="model">
              <p className="method-eq">
                {m.big} + {m.small}
                {s.ten && <> = <span className="hl">{m.big} + {m.to10}</span> + {m.rest} = 10 + {m.rest}</>}
                {s.done && <> = <b>{m.big + m.small}</b></>}
              </p>
              {s.split && <BarModel spec={{ t: "bond", w: m.small, p: [m.to10, m.rest] }} />}
              <TenFrame filled={m.big} extra={s.ten ? m.to10 : 0} />
            </div>
            <p className="caption">{s.caption}</p>
          </>
        );
      }}
    </Stepper>
  );
}

function TenFrame({ filled, extra }: { filled: number; extra: number }) {
  return (
    <div className="tenframe" aria-label={`Ten frame with ${filled + extra} counters`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={i < filled ? "on" : i < filled + extra ? "on add" : ""} />
      ))}
    </div>
  );
}

/* ---------------- place-value discs + column method ---------------- */

function Discs({ n, placeIdx }: { n: number; placeIdx: number }) {
  return (
    <div className="discs">
      {Array.from({ length: n }, (_, k) => (
        <span key={k} className={`disc p${placeIdx}`}>{PLACE_SHORT[placeIdx]}</span>
      ))}
    </div>
  );
}

function Columns({ op, a, b }: { op: "add" | "sub"; a: number; b: number }) {
  const m = op === "add" ? addSteps(a, b) : subSteps(a, b);
  const cols = Array.from({ length: m.width }, (_, k) => m.width - 1 - k); // highest place first
  const showDiscs = m.width <= 3;
  const sign = op === "add" ? "+" : "−";
  const lead = (d: number[], i: number) => d.slice(i).some((x) => x > 0) || i === 0; // hide leading zeros

  return (
    <Stepper count={m.steps.length}>
      {(i) => {
        const s: ColumnStep = m.steps[i];
        return (
          <>
            {showDiscs && (
              <div className="model">
                <div className="pv" style={{ gridTemplateColumns: `64px repeat(${m.width}, 1fr)` }}>
                  <span />
                  {cols.map((c) => <span key={c} className={`pvhead${s.col === c ? " focus" : ""}`}>{PLACE_NAMES_TITLE[c]}</span>)}
                  <span className="mlabel">{a}</span>
                  {cols.map((c) => <div key={c} className={`pvcell${s.col === c ? " focus" : ""}`}><Discs n={s.top[c]} placeIdx={c} /></div>)}
                  <span className="mlabel">{sign} {b}</span>
                  {cols.map((c) => <div key={c} className={`pvcell${s.col === c ? " focus" : ""}`}><Discs n={m.B[c]} placeIdx={c} /></div>)}
                  <span className="mlabel">=</span>
                  {cols.map((c) => (
                    <div key={c} className={`pvcell result${s.col === c ? " focus" : ""}`}>
                      {op === "add" && s.marks[c] != null && s.result[c] == null && <Discs n={1} placeIdx={c} />}
                      {s.result[c] != null && <Discs n={s.result[c]!} placeIdx={c} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="written" style={{ gridTemplateColumns: `1.5em repeat(${m.width}, 1.6em)` }} aria-label="Column method">
              <span />
              {cols.map((c) => <span key={c} className="wmark">{s.marks[c] ?? ""}</span>)}
              <span />
              {cols.map((c) => (
                <span key={c} className={`wd${s.col === c ? " focus" : ""}${s.crossed[c] ? " crossed" : ""}`}>
                  {lead(m.A, c) ? m.A[c] : ""}
                </span>
              ))}
              <span className="wd">{sign}</span>
              {cols.map((c) => <span key={c} className={`wd${s.col === c ? " focus" : ""}`}>{lead(m.B, c) ? m.B[c] : ""}</span>)}
              <span className="wline" style={{ gridColumn: `1 / span ${m.width + 1}` }} />
              <span />
              {cols.map((c) => <span key={c} className={`wd ans${s.col === c ? " focus" : ""}`}>{s.result[c] ?? ""}</span>)}
            </div>
            <p className="caption">{s.caption}</p>
          </>
        );
      }}
    </Stepper>
  );
}

const PLACE_NAMES_TITLE = ["Ones", "Tens", "Hundreds", "Thousands", "Ten thousands", "Hundred thousands"];

/* ---------------- area model → long multiplication ---------------- */

function Area({ a, b }: { a: number; b: number }) {
  const m = areaModel(a, b);
  const cells = m.cells.flat();
  // Steps: split, one per cell, then the written method, then the total.
  const count = 1 + cells.length + 2;
  const weight = (n: number) => Math.max(1, Math.log10(n + 1));
  return (
    <Stepper count={count}>
      {(i) => {
        const shown = Math.max(0, Math.min(cells.length, i));
        const written = i > cells.length;
        const done = i === count - 1;
        let caption: string;
        if (i === 0) caption = `Split by place value: ${a} = ${m.aParts.join(" + ")}${m.bParts.length > 1 ? ` and ${b} = ${m.bParts.join(" + ")}` : ""}. Each rectangle is one small multiplication.`;
        else if (!written) { const c = cells[i - 1]; caption = `${c.colPart} × ${c.rowPart} = ${c.product}.`; }
        else if (!done) caption = `Each row of rectangles is one line of long multiplication: ${m.partials.map((p) => `${a} × ${p.by} = ${p.value}`).join(", ")}.`;
        else if (m.partials.length > 1) caption = `Add the parts: ${m.partials.map((p) => p.value).join(" + ")} = ${m.answer}. So ${a} × ${b} = ${m.answer}.`;
        else caption = `Add the rectangles: ${cells.map((c) => c.product).join(" + ")} = ${m.answer}. So ${a} × ${b} = ${m.answer}.`;
        let k = 0;
        return (
          <>
            <div className="model">
              <div className="area" style={{ gridTemplateColumns: `56px ${m.aParts.map((p) => `${weight(p)}fr`).join(" ")}` }}>
                <span />
                {m.aParts.map((p) => <span key={p} className="pvhead">{p}</span>)}
                {m.cells.map((row, r) => (
                  <Row key={r} label={m.bParts[r]}>
                    {row.map((c) => {
                      const idx = k++;
                      return (
                        <div key={idx} className={`acell${idx < shown ? " on" : ""}${idx === shown - 1 && !written ? " focus" : ""}`}>
                          {idx < shown ? c.product.toLocaleString("en-US") : "?"}
                        </div>
                      );
                    })}
                  </Row>
                ))}
              </div>
            </div>
            {written && <LongMultiplication a={a} b={b} partials={[...m.partials].reverse().map((p) => p.value)} total={done ? m.answer : null} />}
            <p className="caption">{caption}</p>
          </>
        );
      }}
    </Stepper>
  );
}

function Row({ label, children }: { label: number; children: React.ReactNode }) {
  return (
    <>
      <span className="pvhead side">{label}</span>
      {children}
    </>
  );
}

function LongMultiplication({ a, b, partials, total }: { a: number; b: number; partials: number[]; total: number | null }) {
  const lines: [string, string][] = [["", String(a)], ["×", String(b)], ...partials.map((p) => ["", String(p)] as [string, string])];
  const width = Math.max(...lines.map((l) => l[1].length), String(a * b).length);
  return (
    <pre className="longmul" aria-label="Long multiplication">
      {lines.slice(0, 2).map(([s, v]) => `${s.padEnd(2)}${v.padStart(width)}\n`).join("")}
      {"─".repeat(width + 2)}
      {"\n"}
      {lines.slice(2).map(([s, v]) => `${s.padEnd(2)}${v.padStart(width)}\n`).join("")}
      {partials.length > 1 && total != null && `${"─".repeat(width + 2)}\n  ${String(total).padStart(width)}\n`}
    </pre>
  );
}

/* ---------------- long division ---------------- */

function Division({ a, b }: { a: number; b: number }) {
  const m = longDivision(a, b);
  const n = m.digits.length;
  const count = m.steps.length + 2;
  return (
    <Stepper count={count}>
      {(i) => {
        const shown = Math.min(m.steps.length, Math.max(0, i));
        const done = i === count - 1;
        let caption: string;
        if (i === 0) caption = `${a} ÷ ${b}: share ${a} equally into ${b} groups, starting with the biggest place.`;
        else if (!done) caption = m.steps[i - 1].caption;
        else caption = `${a} ÷ ${b} = ${m.quotient}${m.remainder ? ` remainder ${m.remainder}` : ""}. Check: ${m.quotient} × ${b}${m.remainder ? ` + ${m.remainder}` : ""} = ${a}.`;

        // Build rows of cells: [label, ...n digit columns]
        type Cell = { t: string; cls?: string };
        const blank = (): Cell[] => Array.from({ length: n }, () => ({ t: "" }));
        const place = (row: Cell[], value: number, endPos: number, cls?: string) => {
          const s = String(value);
          for (let k = 0; k < s.length; k++) row[endPos - s.length + 1 + k] = { t: s[k], cls };
        };
        const rows: { label: string; cells: Cell[]; line?: [number, number] }[] = [];
        const q = blank();
        m.steps.slice(0, shown).forEach((s) => (q[s.pos] = { t: String(s.q), cls: "ans" }));
        rows.push({ label: "", cells: q });
        rows.push({ label: `${b})`, cells: m.digits.map((d) => ({ t: String(d) })), line: [0, n - 1] });
        m.steps.slice(0, shown).forEach((s, k) => {
          const prod = blank();
          place(prod, s.product, s.pos, k === shown - 1 && !done ? "focus" : undefined);
          rows.push({ label: "−", cells: prod });
          const rem = blank();
          const next = m.steps[k + 1];
          if (next && k + 1 < shown) place(rem, next.current, next.pos);
          else if (next) place(rem, s.remainder, s.pos);
          else place(rem, s.remainder, s.pos, "rem");
          const len = String(s.current).length;
          rows.push({ label: "", cells: rem, line: [s.pos - len + 1, s.pos] });
        });

        return (
          <>
            <div className="longdiv" style={{ gridTemplateColumns: `${String(b).length + 1.5}ch repeat(${n}, 1.6em)` }} aria-label="Long division">
              {rows.map((r, ri) => (
                <Fragment key={ri}>
                  <span className="wd lab">{r.label}</span>
                  {r.cells.map((c, ci) => (
                    <span key={ci} className={`wd ${c.cls ?? ""}${r.line && ci >= r.line[0] && ci <= r.line[1] ? " topline" : ""}`}>{c.t}</span>
                  ))}
                </Fragment>
              ))}
            </div>
            {done && m.remainder > 0 && <p className="muted small">The remainder {m.remainder} is less than {b}, so the sharing stops.</p>}
            <p className="caption">{caption}</p>
          </>
        );
      }}
    </Stepper>
  );
}

