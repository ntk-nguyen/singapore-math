"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowIcon, ChartIcon, CrownIcon, PlayIcon, SparkIcon, TargetIcon } from "@/components/Icons";

export type Audience = "learner" | "grownup";

const KEY = "mb-audience";

/** Who is using the home page: a learner or a parent/teacher. Saved per device; null until chosen. */
export function useAudience(): [Audience | null, (a: Audience | null) => void, boolean] {
  const [who, setWho] = useState<Audience | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after mount
      if (v === "learner" || v === "grownup") setWho(v);
    } catch {}
    setLoaded(true);
  }, []);
  const choose = useCallback((a: Audience | null) => {
    setWho(a);
    try {
      if (a) localStorage.setItem(KEY, a);
      else localStorage.removeItem(KEY);
    } catch {}
  }, []);
  return [who, choose, loaded];
}

/** First screen for a new visitor: one question, two big answers. */
export function AudienceSplit({ onPick }: { onPick: (a: Audience) => void }) {
  return (
    <section className="banner split" aria-labelledby="split-title">
      <div className="split-intro">
        <p className="badge"><SparkIcon />Singapore Math · Kindergarten to Grade 8</p>
        <h1 id="split-title">Math that clicks, one picture at a time.</h1>
        <p className="hero-lead">Bar models turn word problems into pictures you can see. Who’s here today?</p>
      </div>
      <div className="split-pick" role="group" aria-label="Who's here today?">
        <button type="button" className="split-card learner" onClick={() => onPick("learner")}>
          <span className="split-ic" aria-hidden="true"><PlayIcon /></span>
          <span className="split-text">
            <b>I’m a learner</b>
            <span>Pick your grade and start practicing</span>
          </span>
          <ArrowIcon />
        </button>
        <button type="button" className="split-card grownup" onClick={() => onPick("grownup")}>
          <span className="split-ic" aria-hidden="true"><ChartIcon /></span>
          <span className="split-text">
            <b>I’m a parent or teacher</b>
            <span>See progress, plans and how it works</span>
          </span>
          <ArrowIcon />
        </button>
      </div>
    </section>
  );
}

/** Home hero for parents and teachers: one main action, the Parents page, plus progress and Pro. */
export function GrownUpHero({ onLearner }: { onLearner: () => void }) {
  return (
    <section className="banner" aria-labelledby="grownup-title">
      <div>
        <p className="badge"><SparkIcon />For parents and teachers</p>
        <h1 id="grownup-title">See how your child is doing.</h1>
        <p className="hero-lead">
          Every question follows Singapore Math and carries a Common Core code, so progress reads in US grade-level terms.
        </p>
      </div>
      <div className="cta">
        <Link className="btn light" href="/parents">Open the Parents page <ArrowIcon /></Link>
        <button type="button" className="linkbtn on-dark" onClick={onLearner}>Hand it to your child</button>
      </div>
      <ul className="gu-links">
        <li>
          <Link href="/parents#children">
            <span className="qi" aria-hidden="true"><ChartIcon /></span>
            <span><b>Progress for each child</b><small>Scores, streaks and topics by grade</small></span>
          </Link>
        </li>
        <li>
          <Link href="/pro">
            <span className="qi" aria-hidden="true"><CrownIcon /></span>
            <span><b>Pro plan</b><small>Every test and topic, 7-day free trial</small></span>
          </Link>
        </li>
        <li>
          <Link href="/tests/placement">
            <span className="qi" aria-hidden="true"><TargetIcon /></span>
            <span><b>Free placement check</b><small>12 questions to find the right grade</small></span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
