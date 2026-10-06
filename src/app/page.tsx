"use client";

import Link from "next/link";
import { useProgress } from "@/components/Progress";
import { usePlan } from "@/components/usePlan";
import { gradeCatalog, type CatalogItem, type DomainId } from "@/lib/catalog";
import { LESSONS } from "@/lib/lessons";
import { GRADES } from "@/lib/questions";
import { TESTS } from "@/lib/tests";
import { MASTERED } from "@/lib/timesTables";
import {
  AlgebraIcon, ArrowIcon, BarsIcon, BoltIcon, CheckIcon, ChevronIcon, CrownIcon, FractionIcon, GridIcon, LockIcon,
  NumbersIcon, PathIcon, PlayIcon, TargetIcon,
} from "@/components/Icons";

const DOMAIN_COLOR: Record<DomainId, string> = {
  "bar-models": "var(--bar-a)",
  numbers: "var(--bar-b)",
  fractions: "var(--bar-c)",
  algebra: "var(--good-fill)",
};
const DOMAIN_ICON: Record<DomainId, () => React.ReactNode> = {
  "bar-models": BarsIcon,
  numbers: NumbersIcon,
  fractions: FractionIcon,
  algebra: AlgebraIcon,
};

function Tile({ item, family }: { item: CatalogItem; family: boolean }) {
  const { best, lessons } = useProgress();
  const locked = !item.free && !family;
  const score = item.bestKey ? best[item.bestKey] : undefined;
  const done = item.lessonId ? lessons.includes(item.lessonId) : false;
  return (
    <Link className={`tile${locked ? " locked" : ""}`} href={item.href}>
      <span className={`ti${locked ? " lock" : done ? " done" : ""}`} aria-hidden="true">
        {locked ? <LockIcon /> : done ? <CheckIcon /> : <PlayIcon />}
      </span>
      <span className="tile-text">
        <span className="tile-title">{item.title}</span>
        <span className="tile-blurb">{item.blurb}</span>
      </span>
      <span className="tile-tags">
        {locked && <span className="tag paid">Family plan</span>}
        {score != null && <span className="tag best">Best {score}%</span>}
        {done && <span className="tag done">Done</span>}
        <span className="chev" aria-hidden="true"><ChevronIcon /></span>
      </span>
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
      <section className="banner" aria-labelledby="pick-grade">
        <div>
          <p className="badge">Singapore Math · Grades 1 to 8</p>
          <h1 id="pick-grade">What grade are you in?</h1>
          <div className="gradepick" role="group" aria-label="Grade">
            {GRADES.map((g) => (
              <button key={g} className={`gchip${g === grade ? " on" : ""}`} aria-pressed={g === grade} onClick={() => setGrade(g)}>
                <small>Grade</small>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Saved progress is read after the first render, so wait for it before choosing a card. */}
        {ready && (recent ? (
          <div className="cta">
            <p className="cta-label">Pick up where you left off</p>
            <Link className="btn light" href={recent.href}>Continue <ArrowIcon /></Link>
            <p className="cta-title">{recent.title}</p>
          </div>
        ) : (
          <div className="cta">
            <p className="cta-label">Start here</p>
            <Link className="btn light" href={`/lessons#${lesson.id}`}>Start the lesson <ArrowIcon /></Link>
            <p className="cta-title">{lesson.title}</p>
            <p className="cta-note">A short bar model lesson for Grade {grade}. Press Next step to see each bar appear.</p>
          </div>
        ))}

        {ready && (placement ? (
          <div className="quest">
            <span className="qi" aria-hidden="true"><TargetIcon /></span>
            <div className="qt">
              <b>Placement check · Your level: Grade {placement}</b>
              <span>Take the check again any time to see how far you have come.</span>
            </div>
            <Link className="btn gold" href="/tests/placement">Retake</Link>
          </div>
        ) : (
          <div className="quest">
            <span className="qi" aria-hidden="true"><TargetIcon /></span>
            <div className="qt">
              <b>Not sure of the grade? Take the free placement check</b>
              <span>12 questions that move up and down to find the right starting grade.</span>
            </div>
            <Link className="btn gold" href="/tests/placement">Start the check</Link>
          </div>
        ))}
      </section>

      <div className="home">
        <div className="stack" style={{ gap: 20 }}>
          <div className="pathhead">
            <span className="ic" aria-hidden="true"><PathIcon /></span>
            <div className="spacer">
              <h2>Learn in Grade {grade}</h2>
              <p className="muted small">Concrete · Pictorial · Abstract</p>
            </div>
          </div>
          {domains.map((d) => {
            const DomIcon = DOMAIN_ICON[d.id];
            return (
              <section key={d.id} className="domain" aria-labelledby={`dom-${d.id}`} style={{ ["--dom" as string]: DOMAIN_COLOR[d.id] }}>
                <div className="domain-head">
                  <span className="ic" aria-hidden="true"><DomIcon /></span>
                  <div className="spacer">
                    <h3 id={`dom-${d.id}`}>{d.title}</h3>
                    <p className="muted small">{d.blurb}</p>
                  </div>
                  <Link className="seeall" href={d.seeAll.href}>{d.seeAll.label}</Link>
                </div>
                <div className="tiles">
                  {d.items.map((item) => (
                    <Tile key={item.href + item.title} item={item} family={family} />
                  ))}
                </div>
              </section>
            );
          })}

          {grade > 6 && (
            <p className="notice">
              Number skills and fractions finish in Grade 6. Review them any time in <Link href="/number-skills">Number skills</Link> and{" "}
              <Link href="/fractions">Fractions & decimals</Link>.
            </p>
          )}
        </div>

        <aside className="side" aria-labelledby="play-test">
          <h2 id="play-test" className="side-title">Play and test yourself</h2>
          <div className="sidecard">
            <div className="ch">
              <span className="ic amber" aria-hidden="true"><BoltIcon /></span>
              <div className="spacer">
                <h3>Play</h3>
                <span className="tag free">Free</span>
              </div>
            </div>
            <p>Ten quick Grade {grade} questions. Earn a star for every right answer, and two in a streak.</p>
            {ready && <span className="stat">You have {stars} {stars === 1 ? "star" : "stars"}.</span>}
            <Link className="btn self-start" href="/play">Play</Link>
          </div>
          <div className="sidecard">
            <div className="ch">
              <span className="ic" aria-hidden="true"><GridIcon /></span>
              <div className="spacer">
                <h3>Times tables</h3>
                <span className="tag free">Free</span>
              </div>
            </div>
            <p>Tricks for every table from 2 to 12, then a sprint against the clock.</p>
            {ready && <span className="stat">{mastered} of 78 facts mastered.</span>}
            <Link className="btn ghost self-start" href="/times-tables">Practise</Link>
          </div>
          <div className="sidecard pro">
            <span className="tag paid"><span className="lock"><CrownIcon />{freeTests} free</span></span>
            <h3>Practice tests</h3>
            <p>
              Placement check and Grade checkpoint are free.{" "}
              {family ? `All ${paidTests} Family plan tests are unlocked.` : `${paidTests} more with the Family plan.`}
            </p>
            <Link className="btn gold" href="/tests">See tests</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

