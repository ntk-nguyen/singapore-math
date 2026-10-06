"use client";

import Link from "next/link";
import { useProgress } from "@/components/Progress";
import { usePlan } from "@/components/usePlan";
import { gradeCatalog, type CatalogItem, type DomainId } from "@/lib/catalog";
import { LESSONS } from "@/lib/lessons";
import { GRADES } from "@/lib/questions";
import { TESTS } from "@/lib/tests";
import { MASTERED } from "@/lib/timesTables";

const DOMAIN_COLOR: Record<DomainId, string> = {
  "bar-models": "var(--bar-a)",
  numbers: "var(--bar-b)",
  fractions: "var(--bar-c)",
  algebra: "var(--accent)",
};

function Tile({ item, family }: { item: CatalogItem; family: boolean }) {
  const { best, lessons } = useProgress();
  const locked = !item.free && !family;
  const score = item.bestKey ? best[item.bestKey] : undefined;
  const done = item.lessonId ? lessons.includes(item.lessonId) : false;
  return (
    <Link className={`tile${locked ? " locked" : ""}`} href={item.href}>
      <span className="tile-title">{item.title}</span>
      <span className="tile-blurb">{item.blurb}</span>
      {(locked || score != null || done) && (
        <span className="row" style={{ gap: 6 }}>
          {locked && <span className="tag paid">Family plan</span>}
          {score != null && <span className="tag best">Best {score}%</span>}
          {done && <span className="tag best">Done</span>}
        </span>
      )}
    </Link>
  );
}

export default function LearnPage() {
  const { grade, setGrade, recent, placement, stars, facts, ready } = useProgress();
  const [plan] = usePlan();
  const family = !!plan?.family;
  const domains = gradeCatalog(grade);
  const lesson = LESSONS.find((l) => l.grade === grade)!;
  const mastered = Object.values(facts).filter((m) => m >= MASTERED).length;
  const freeTests = TESTS.filter((t) => t.free).length;
  const paidTests = TESTS.length - freeTests;

  return (
    <div className="stack">
      <section className="stack" style={{ gap: 12 }} aria-labelledby="pick-grade">
        <div>
          <p className="eyebrow">Singapore Math · Grades 1 to 8</p>
          <h1 id="pick-grade">What grade are you in?</h1>
        </div>
        <div className="gradepick" role="group" aria-label="Grade">
          {GRADES.map((g) => (
            <button key={g} className={`gchip${g === grade ? " on" : ""}`} aria-pressed={g === grade} onClick={() => setGrade(g)}>
              <small>Grade</small>
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* Saved progress is read after the first render, so wait for it before choosing a card. */}
      {ready && (
        <div className="grid2">
          {recent ? (
            <section className="panel continue">
              <p className="eyebrow">Pick up where you left off</p>
              <h2>{recent.title}</h2>
              <Link className="btn self-start" href={recent.href}>Continue</Link>
            </section>
          ) : (
            <section className="panel continue">
              <p className="eyebrow">Start here</p>
              <h2>{lesson.title}</h2>
              <p className="muted">A short bar model lesson for Grade {grade}. Press Next step to see each bar appear.</p>
              <Link className="btn self-start" href={`/lessons#${lesson.id}`}>Start the lesson</Link>
            </section>
          )}
          {placement ? (
            <section className="panel">
              <p className="eyebrow">Placement check</p>
              <h2>Your level: Grade {placement}</h2>
              <p className="muted">Take the check again any time to see how far you have come.</p>
              <Link className="btn ghost self-start" href="/tests/placement">Retake</Link>
            </section>
          ) : (
            <section className="panel">
              <p className="eyebrow">Not sure of the grade?</p>
              <h2>Take the free placement check</h2>
              <p className="muted">12 questions that move up and down to find the right starting grade.</p>
              <Link className="btn ghost self-start" href="/tests/placement">Start the check</Link>
            </section>
          )}
        </div>
      )}

      <h2 style={{ marginTop: 8 }}>Learn in Grade {grade}</h2>
      {domains.map((d) => (
        <section key={d.id} className="domain" aria-labelledby={`dom-${d.id}`} style={{ ["--dom" as string]: DOMAIN_COLOR[d.id] }}>
          <div className="domain-head">
            <div className="spacer">
              <h3 id={`dom-${d.id}`}>{d.title}</h3>
              <p className="muted small">{d.blurb}</p>
            </div>
            <Link className="small" href={d.seeAll.href}>{d.seeAll.label}</Link>
          </div>
          <div className="tiles">
            {d.items.map((item) => (
              <Tile key={item.href + item.title} item={item} family={family} />
            ))}
          </div>
        </section>
      ))}

      {grade > 6 && (
        <p className="notice">
          Number skills and fractions finish in Grade 6. Review them any time in <Link href="/number-skills">Number skills</Link> and{" "}
          <Link href="/fractions">Fractions & decimals</Link>.
        </p>
      )}

      <h2 style={{ marginTop: 8 }}>Play and test yourself</h2>
      <div className="tests trio">
        <div className="test">
          <span className="tag free">Free</span>
          <h3>Play</h3>
          <p>Ten quick Grade {grade} questions. Earn a star for every right answer, and two in a streak.</p>
          {ready && <span className="muted small">You have {stars} {stars === 1 ? "star" : "stars"}.</span>}
          <Link className="btn self-start" href="/play">Play</Link>
        </div>
        <div className="test">
          <span className="tag free">Free</span>
          <h3>Times tables</h3>
          <p>Tricks for every table from 2 to 12, then a sprint against the clock.</p>
          {ready && <span className="muted small">{mastered} of 78 facts mastered.</span>}
          <Link className="btn self-start" href="/times-tables">Practise</Link>
        </div>
        <div className="test">
          <span className="tag free">{freeTests} free</span>
          <h3>Practice tests</h3>
          <p>
            Placement check and Grade checkpoint are free.{" "}
            {family ? `All ${paidTests} Family plan tests are unlocked.` : `${paidTests} more with the Family plan.`}
          </p>
          <Link className="btn self-start" href="/tests">See tests</Link>
        </div>
      </div>
    </div>
  );
}
