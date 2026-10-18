"use client";

import Link from "next/link";
import { useState } from "react";
import { FIRST, tryIt, type TryIt as Problem } from "@/lib/tryit";
import { Seg } from "./BarModel";
import { confetti } from "./Confetti";
import { ArrowIcon, SparkIcon } from "./Icons";
import { useProgress } from "./Progress";

/** Units the bars are scaled against, so 1 unit is the same length in both rows. */
const SLOTS = 6;

type Step = "build" | "count" | "solve" | "done";
const STEP_N: Record<Step, number> = { build: 1, count: 2, solve: 3, done: 3 };

/** The home page shows the problem to brand-new visitors only, once saved progress is read. */
export function FirstVisitTryIt() {
  const { ready, recent, placement, stars } = useProgress();
  return ready && !recent && placement == null && stars === 0 ? <TryIt /> : null;
}

/**
 * One live bar-model problem for first-time visitors: build the bars, count the units, find one unit.
 * Nothing is saved, so it works signed out and never touches the child's progress.
 */
export function TryIt() {
  const [p, setP] = useState<Problem>(FIRST);
  const [step, setStep] = useState<Step>("build");
  const [big, setBig] = useState(1);
  const [wrong, setWrong] = useState<number[]>([]);
  const [hint, setHint] = useState("");
  const [small, bigName] = p.names;

  const go = (s: Step) => { setStep(s); setWrong([]); setHint(""); };
  const again = () => { setP(tryIt(Math.random)); setBig(1); go("build"); };

  const check = () => {
    if (big === p.k) return go("count");
    setHint(big < p.k
      ? `Not yet. ${bigName} has ${p.k} times as many, so ${bigName}'s bar needs ${p.k} units the same size as ${small}'s.`
      : `Too many. ${p.k} times as many means ${p.k} units, not ${big}.`);
  };

  const choose = (c: number) => {
    if (step === "count") {
      if (c === p.k + 1) return go("solve");
      setHint(c === p.k ? `That is only ${bigName}'s bar. Count ${small}'s unit too.` : `${p.total} is the number of ${p.noun}. Count the boxes in both bars.`);
    } else {
      if (c === p.unit) { confetti(); return go("done"); }
      setHint(c === p.k * p.unit ? `That is ${bigName}'s share (${p.k} units). ${small} is just 1 unit.` : `${p.k + 1} units share ${p.total}, so divide: ${p.total} ÷ ${p.k + 1}.`);
    }
    setWrong([...wrong, c]);
  };

  const showUnit = step === "solve" || step === "done";
  const label = showUnit ? p.unit : "";
  const choices = step === "count" ? p.unitChoices : step === "solve" ? p.answerChoices : null;

  return (
    <section className="panel tryit" aria-labelledby="tryit-title">
      <div className="row">
        <p className="eyebrow spacer"><SparkIcon /> Try one now · no sign-up</p>
        <span className="tryit-step">Step {STEP_N[step]} of 3</span>
      </div>
      <h2 id="tryit-title">Solve it the Singapore way</h2>
      <p className="qtext">
        {small} and {bigName} share {p.total} {p.noun}. {bigName} has {p.k} times as many {p.noun} as {small}. How many {p.noun} does {small} have?
      </p>

      <div className="tryit-model">
        <div className="model" role="img" aria-label={`Bar model: ${small} 1 unit, ${bigName} ${big} units${step !== "build" ? `, ${p.total} ${p.noun} in all` : ""}`}>
          <div className="mrow">
            <div className="mlabel">{small}</div>
            <div className="bars" style={{ width: `${100 / SLOTS}%` }}>
              <Seg kind={step === "done" ? "c" : "a"} grow={1}>{label}</Seg>
            </div>
          </div>
          <div className="mrow">
            <div className="mlabel">{bigName}</div>
            <div className="bars" style={{ width: `${(100 * big) / SLOTS}%` }}>
              {Array.from({ length: big }, (_, i) => <Seg key={i} kind="b" grow={1}>{label}</Seg>)}
            </div>
          </div>
        </div>
        {step !== "build" && <div className="tryit-total" aria-hidden="true"><span>{p.total}</span></div>}
      </div>

      {step === "build" && (
        <>
          <p className="tryit-ask">{small}&apos;s bar is 1 unit. Make {bigName}&apos;s bar {p.k} times as long.</p>
          <div className="tryit-build">
            <button className="btn ghost" onClick={() => { setBig(Math.max(1, big - 1)); setHint(""); }} disabled={big <= 1} aria-label={`Take a unit off ${bigName}'s bar`}>− Unit</button>
            <button className="btn ghost" onClick={() => { setBig(Math.min(SLOTS - 1, big + 1)); setHint(""); }} disabled={big >= SLOTS - 1} aria-label={`Add a unit to ${bigName}'s bar`}>+ Unit</button>
            <button className="btn" onClick={check}>Check</button>
          </div>
        </>
      )}

      {choices && (
        <>
          <p className="tryit-ask">
            {step === "count"
              ? `Both bars together are ${p.total} ${p.noun}. How many equal units are there in all?`
              : `${p.k + 1} units = ${p.total}. ${small} is 1 unit. How many ${p.noun} does ${small} have?`}
          </p>
          <div className="choices">
            {choices.map((c) => (
              <button key={c} className={`choice${wrong.includes(c) ? " wrong" : ""}`} disabled={wrong.includes(c)} onClick={() => choose(c)}>{c}</button>
            ))}
          </div>
        </>
      )}

      {step === "done" ? (
        <>
          <p className="feedback good" aria-live="polite">
            Yes! 1 unit = {p.total} ÷ {p.k + 1} = {p.unit}, so {small} has {p.unit} {p.noun} and {bigName} has {p.k} × {p.unit} = {p.k * p.unit}.
          </p>
          <p className="muted small">That is the bar model: draw what you know, find 1 unit, then answer. Every MathBridge lesson builds on it.</p>
          <div className="tryit-build">
            <button className="btn ghost" onClick={again}>Try another</button>
            <Link className="btn" href="/lessons">See lessons <ArrowIcon /></Link>
          </div>
        </>
      ) : (
        <p className="feedback bad" aria-live="polite">{hint}</p>
      )}
    </section>
  );
}
