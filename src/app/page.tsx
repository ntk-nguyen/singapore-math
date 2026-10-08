"use client";

import Link from "next/link";
import { useState } from "react";
import { useProgress } from "@/components/Progress";
import { ProCard } from "@/components/Paywall";
import { usePlan } from "@/components/usePlan";
import { lastWeek, QUEST_GOAL } from "@/lib/activity";
import { gradeCatalog, type Domain, type DomainId } from "@/lib/catalog";
import { LESSONS } from "@/lib/lessons";
import { pathway, skill, type PathItem, type Unit } from "@/lib/pathway";
import { GRADES } from "@/lib/questions";
import { TESTS } from "@/lib/tests";
import { MASTERED } from "@/lib/timesTables";
import {
  AlgebraIcon, ArrowIcon, BarsIcon, BoltIcon, ChartIcon, CheckIcon, CrownIcon, FlameIcon, FractionIcon, GridIcon, LockIcon,
  NumbersIcon, PathIcon, PlayIcon, SparkIcon, StarIcon, TargetIcon,
} from "@/components/Icons";

const DOMAIN_ICON: Record<DomainId, () => React.ReactNode> = {
  "bar-models": BarsIcon,
  numbers: NumbersIcon,
  fractions: FractionIcon,
  algebra: AlgebraIcon,
  thinking: ChartIcon,
};

export default function LearnPage() {
  const { grade, best, lessons, ready } = useProgress();
  const [plan] = usePlan();
  const pro = !!plan?.pro;
  const domains = gradeCatalog(grade);
  const units = pathway(domains, { best, lessons, pro });

  return (
    <div className="stack">
      <Hero units={units} />
      <div className="home">
        <div className="stack" style={{ gap: 20 }}>
          <Pathway key={`${grade}-${ready}`} units={units} />
          {grade > 6 && (
            <p className="notice">
              Number skills and fractions finish in Grade 6. Review them any time in <Link href="/number-skills">Number skills</Link> and{" "}
              <Link href="/fractions">Fractions & decimals</Link>.
            </p>
          )}
        </div>
        <aside className="side" aria-label="Your progress and more practice">
          {ready && <Skills units={units} domains={domains} />}
          {ready && <Week />}
          <MorePractice />
          <ProCard />
        </aside>
      </div>
    </div>
  );
}

function Hero({ units }: { units: Unit[] }) {
  const { grade, setGrade, recent, placement, stars, today, streak, ready } = useProgress();
  const lesson = LESSONS.find((l) => l.grade === grade)!;
  const current = units.find((u) => u.state === "current");
  // Saved progress is read after the first render; until then, and for a brand-new child, ask for the grade.
  const firstVisit = !ready || (!recent && !placement && stars === 0);
  const quest = Math.min(today.done, QUEST_GOAL);
  const left = QUEST_GOAL - quest;

  return (
    <section className="banner" aria-labelledby="hero-title">
      <div>
        <p className="badge"><SparkIcon />Singapore Math · Grade {grade}</p>
        {firstVisit ? (
          <>
            <h1 id="hero-title">What grade are you in?</h1>
            <div className="gradepick" role="group" aria-label="Grade">
              {GRADES.map((g) => (
                <button key={g} className={`gchip${g === grade ? " on" : ""}`} aria-pressed={g === grade} onClick={() => setGrade(g)}>
                  <small>Grade</small>
                  {g}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 id="hero-title">Welcome back!</h1>
            <p className="hero-lead">
              {left > 0
                ? `Ready for today's bar model quest? Finish ${left} more ${left === 1 ? "practice set" : "practice sets"} to complete it${streak > 1 ? ` and keep your ${streak}-day streak going` : ""}.`
                : `Today's quest is complete. Great work${streak > 1 ? ` on day ${streak} of your streak` : ""}! Keep going for more XP.`}
            </p>
          </>
        )}
      </div>

      {ready && (recent ? (
        <div className="cta">
          <Link className="btn light" href={recent.href}>Continue <ArrowIcon /></Link>
          <p className="cta-note">Pick up where you left off: <b>{recent.title}</b></p>
        </div>
      ) : (
        <div className="cta">
          <Link className="btn light" href={`/lessons#${lesson.id}`}>Start the lesson <ArrowIcon /></Link>
          <p className="cta-note">Lesson: <b>{lesson.title}</b>. Press Next step to see each bar appear.</p>
        </div>
      ))}

      {ready && (firstVisit ? (
        <div className="quest">
          <span className="qi" aria-hidden="true"><TargetIcon /></span>
          <div className="qt">
            <b>Not sure of the grade? Take the free placement check</b>
            <span>12 questions that move up and down to find the right starting grade.</span>
          </div>
          <Link className="btn gold" href="/tests/placement">Start the check</Link>
        </div>
      ) : (
        <div className="quest daily">
          <span className="qi" aria-hidden="true"><BoltIcon /></span>
          <div className="qt">
            <b>Daily quest</b>
            <span>{quest} of {QUEST_GOAL} done{current ? ` · ${current.title}` : ""}</span>
          </div>
          <div className="qbar">
            <div className="qbar-top">
              <span>Progress: {Math.round((quest / QUEST_GOAL) * 100)}%</span>
              <b>+{today.xp} XP today</b>
            </div>
            <div className="qsegs" role="progressbar" aria-valuemin={0} aria-valuemax={QUEST_GOAL} aria-valuenow={quest} aria-label="Daily quest">
              {Array.from({ length: QUEST_GOAL }, (_, i) => <i key={i} className={i < quest ? "on" : undefined} />)}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function Pathway({ units }: { units: Unit[] }) {
  const { grade } = useProgress();
  const currentIdx = units.findIndex((u) => u.state === "current");
  const [open, setOpen] = useState<number | null>(currentIdx >= 0 ? currentIdx : null);
  return (
    <section aria-labelledby="path-title" className="stack" style={{ gap: 20 }}>
      <div className="pathhead">
        <span className="ic" aria-hidden="true"><PathIcon /></span>
        <div className="spacer">
          <h2 id="path-title">Curriculum pathway</h2>
          <p className="muted small">Grade {grade} · Concrete · Pictorial · Abstract</p>
        </div>
        {currentIdx >= 0 ? (
          <span className="pill sky"><i className="dot" />Unit {currentIdx + 1} of {units.length} active</span>
        ) : (
          <span className="pill good"><i className="dot" />All open units mastered</span>
        )}
      </div>
      <ol className="path">
        {units.map((u, i) => (
          <UnitRow key={u.id} unit={u} n={i + 1} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
        ))}
      </ol>
    </section>
  );
}

function Node({ unit }: { unit: Unit }) {
  const Ic = DOMAIN_ICON[unit.domain];
  if (unit.state === "mastered") return <><span className="node mastered"><CheckIcon /></span><span className="node-label">100%</span></>;
  if (unit.state === "locked") return <><span className="node locked"><LockIcon /></span><span className="node-label">Locked</span></>;
  if (unit.state === "current") return <><span className="node current"><Ic /></span><span className="node-label strong">Current</span></>;
  return <><span className="node progress">{unit.pct}%</span><span className="node-label">{unit.done}/{unit.open} done</span></>;
}

function UnitStars({ unit }: { unit: Unit }) {
  const filled = Math.round((unit.pct / 100) * 3);
  return (
    <span className="ustars" aria-label={`${filled} of 3 stars`}>
      {[0, 1, 2].map((i) => <span key={i} className={i < filled ? "on" : undefined}><StarIcon /></span>)}
    </span>
  );
}

function UnitRow({ unit, n, open, onToggle }: { unit: Unit; n: number; open: boolean; onToggle: () => void }) {
  const locked = unit.state === "locked";
  const action = unit.state === "mastered"
    ? { href: unit.seeAll.href, label: `Review (${unit.done}/${unit.open})` }
    : locked
      ? { href: "/pro", label: "Unlock with Pro" }
      : { href: unit.next?.href ?? unit.seeAll.href, label: unit.done || unit.items.some((i) => i.state === "started") ? "Resume" : "Start" };
  const tag = unit.state === "mastered" ? <span className="tag done">Mastered</span>
    : unit.state === "current" ? <span className="tag cur">Current milestone</span>
      : locked ? <span className="tag paid"><span className="lock"><CrownIcon />Pro</span></span>
        : <span className="utag-muted">{unit.done ? "In progress" : "Up next"}</span>;

  return (
    <li className={`unit${open ? " open" : ""}`} data-state={unit.state}>
      <div className="unit-node"><Node unit={unit} /></div>
      <div className="unit-card">
        <div className="unit-head">
          <button type="button" className="unit-toggle" aria-expanded={open} onClick={onToggle}>
            <span className="unit-kicker">
              <span className="unit-n">Unit {n}</span>
              {tag}
              {!locked && <UnitStars unit={unit} />}
            </span>
            <span className="unit-title">{unit.title}</span>
            <span className="unit-blurb">{unit.blurb}</span>
          </button>
          {open && unit.state === "current" ? (
            <span className="pill count"><TargetIcon />{unit.done}/{unit.open} done</span>
          ) : (
            <Link className={`seeall${locked ? " gold" : ""}`} href={action.href}>{action.label}</Link>
          )}
        </div>
        {open && (
          <div className="steps">
            {unit.items.map((item) => (
              <Step key={item.href + item.title} item={item} next={item === unit.next} />
            ))}
            <Link className="steps-all" href={unit.seeAll.href}>{unit.seeAll.label} <ArrowIcon /></Link>
          </div>
        )}
      </div>
    </li>
  );
}

function Step({ item, next }: { item: PathItem; next: boolean }) {
  const icon = item.state === "locked" ? <LockIcon /> : item.state === "done" ? <CheckIcon /> : <PlayIcon />;
  return (
    <Link className={`step${next ? " next" : ""}`} data-state={item.state} href={item.state === "locked" ? "/pro" : item.href}>
      <span className="step-ic" aria-hidden="true">{icon}</span>
      <span className="step-text">
        <span className="step-title">
          {next && <span className="nextup">Next up</span>}
          {item.title}
          {item.state === "locked" && <span className="tag paid"><span className="lock"><CrownIcon />Pro</span></span>}
        </span>
        <span className="step-blurb">{item.free ? "Free" : "Pro"} · {item.blurb}</span>
      </span>
      <span className="step-end">
        {next ? (
          <span className="btn small-btn">{item.state === "started" ? "Keep going" : "Start"}</span>
        ) : item.state === "locked" ? (
          <span className="unlock">Unlock</span>
        ) : item.score != null ? (
          <span className={`score${item.state === "done" ? " good" : ""}`}>{item.score}%{item.state === "done" && <CheckIcon />}</span>
        ) : item.state === "done" ? (
          <span className="score good">Done<CheckIcon /></span>
        ) : null}
      </span>
    </Link>
  );
}

/** Radar chart of the grade's topic areas plus a bar per area. */
function Skills({ units, domains }: { units: Unit[]; domains: Domain[] }) {
  const { grade } = useProgress();
  const open = domains.filter((d) => units.some((u) => u.domain === d.id && u.state !== "locked"));
  const rows = open.map((d) => ({ id: d.id, title: d.title, v: skill(units, d.id) }));
  const any = rows.some((r) => r.v != null);
  const R = 80;
  const c = 110;
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / rows.length;
    return `${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`;
  };
  const ring = (f: number) => rows.map((_, i) => pt(i, R * f)).join(" ");
  const shape = rows.map((r, i) => pt(i, (R * (r.v ?? 0)) / 100));

  return (
    <section className="sidecard" aria-labelledby="skills-title">
      <div className="ch">
        <h3 id="skills-title" className="spacer">Skill diagnostics</h3>
        <span className="pill sky">Grade {grade}</span>
      </div>
      {rows.length >= 3 && (
        <svg className="radar" viewBox="0 0 220 220" role="img" aria-label={rows.map((r) => `${r.title}: ${r.v ?? 0}%`).join(", ")}>
          {[1, 0.66, 0.33].map((f) => <polygon key={f} points={ring(f)} className="radar-ring" />)}
          {rows.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, R).split(",")[0]} y2={pt(i, R).split(",")[1]} className="radar-ring" />)}
          {any && <polygon points={shape.join(" ")} className="radar-shape" />}
          {any && shape.map((p, i) => <circle key={i} cx={p.split(",")[0]} cy={p.split(",")[1]} r={3.5} className="radar-dot" />)}
        </svg>
      )}
      {!any && <p className="small muted">Finish a practice set to see your skills here.</p>}
      <ul className="skillbars">
        {rows.map((r) => (
          <li key={r.id}>
            <span className="sb-top"><span>{r.title}</span><b>{r.v == null ? "–" : `${r.v}%`}</b></span>
            <span className="sb-track"><i style={{ width: `${r.v ?? 0}%` }} /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Week() {
  const { days, streak, today } = useProgress();
  const week = lastWeek(days, new Date());
  const top = Math.max(30, ...week.map((d) => d.xp));
  const total = week.reduce((a, d) => a + d.xp, 0);
  const practicedToday = today.xp > 0 || today.done > 0;
  return (
    <section className="sidecard" aria-labelledby="week-title">
      <div className="ch">
        <span className="ic amber" aria-hidden="true"><FlameIcon /></span>
        <h3 id="week-title" className="spacer">Your week</h3>
        <span className="pill amber">{streak}-day streak</span>
      </div>
      <div className="streakbox">
        <b>{practicedToday ? "Today's practice is done" : streak ? "Practice today to keep your streak" : "Practice today to start a streak"}</b>
        <span>{total.toLocaleString("en-US")} XP in the last 7 days</span>
      </div>
      <div className="weekbars" role="img" aria-label={week.map((d) => `${d.label}: ${d.xp} XP`).join(", ")}>
        {week.map((d) => (
          <span key={d.key} className={d.today ? "today" : undefined}>
            <i style={{ height: `${Math.max(4, (d.xp / top) * 100)}%` }} className={d.xp ? "on" : undefined} />
            <small>{d.label}</small>
          </span>
        ))}
      </div>
    </section>
  );
}

function MorePractice() {
  const { grade, facts, placement, ready } = useProgress();
  const [plan] = usePlan();
  const mastered = Object.values(facts).filter((m) => m >= MASTERED).length;
  const freeTests = TESTS.filter((t) => t.free).length;
  const paidTests = TESTS.length - freeTests;
  const rows = [
    { href: "/play", icon: <BoltIcon />, tone: "amber", title: "Play", sub: `Ten quick Grade ${grade} questions · 10 XP each` },
    { href: "/times-tables", icon: <GridIcon />, tone: "", title: "Times tables", sub: ready ? `${mastered} of 78 facts mastered` : "Tricks and a sprint for 2 to 12" },
    {
      href: "/tests", icon: <TargetIcon />, tone: "", title: "Practice tests",
      sub: placement ? `Placement: Grade ${placement} · ${plan?.pro ? "all unlocked" : `${freeTests} free, ${paidTests} with Pro`}` : `${freeTests} free, ${paidTests} more with Pro`,
    },
  ];
  return (
    <section className="sidecard" aria-labelledby="more-title">
      <h3 id="more-title">More practice</h3>
      <ul className="morelist">
        {rows.map((r) => (
          <li key={r.href}>
            <Link href={r.href}>
              <span className={`ic ${r.tone}`} aria-hidden="true">{r.icon}</span>
              <span className="ml-text"><b>{r.title}</b><span>{r.sub}</span></span>
              <ArrowIcon />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
