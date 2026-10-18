"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProgress, type Profile } from "@/components/Progress";
import { gradeName } from "@/lib/questions";
import { practiceNames, STRONG, weekLabel, weeklySummary, type Names, type Rated } from "@/lib/weekly";

interface TestName {
  id: string;
  name: string;
}

/** Each child's last seven days: practice finished, strengths and weak spots. */
export function WeeklySummary({ tests }: { tests: TestName[] }) {
  const { profiles, ready } = useProgress();
  const names = useMemo(() => practiceNames(tests), [tests]);
  if (!ready) return null;
  const now = new Date();
  const label = weekLabel(weeklySummary({}, now, names));

  return (
    <section className="panel" id="weekly">
      <p className="eyebrow">Weekly summary</p>
      <h2>This week, {label}</h2>
      <p className="muted">What each child finished in the last seven days, where they did well and what to practise next.</p>
      <div className="weekgrid">
        {profiles.map((p) => <ChildWeek key={p.id} p={p} now={now} names={names} />)}
      </div>
    </section>
  );
}

/** XP compared with the week before, shown only when there is something to compare. */
function trend(xp: number, prevXp: number): string {
  if (!prevXp || !xp) return "";
  const pct = Math.round(((xp - prevXp) / prevXp) * 100);
  return pct === 0 ? "same as last week" : `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct)}% on last week`;
}

function scoreText(r: Rated): string {
  const times = r.times === 1 ? "once" : `${r.times} times`;
  const up = r.times > 1 && r.last - r.first >= 20 ? `, up from ${r.first}%` : "";
  return `${r.avg}% average, ${times}${up}`;
}

function ChildWeek({ p, now, names }: { p: Profile; now: Date; names: Names }) {
  const w = weeklySummary(p.progress.days, now, names);
  const next = w.weakSpots[0];
  const change = trend(w.xp, w.prevXp);
  const middle = w.practised.filter((r) => !w.strengths.includes(r) && !w.weakSpots.includes(r));

  return (
    <article className="weekcard">
      <header className="weekhead">
        <span className="who-av" aria-hidden="true">{p.avatar}</span>
        <div>
          <b>{p.name}</b>
          <small>{gradeName(p.progress.grade)}</small>
        </div>
      </header>
      <div className="kidstats">
        <div className="kidstat"><span>Finished</span><b>{w.finished}</b></div>
        <div className="kidstat"><span>Days active</span><b>{w.activeDays} of 7</b></div>
        <div className="kidstat">
          <span>XP</span><b>{w.xp.toLocaleString("en-US")}</b>
          {change && <small className={w.xp >= w.prevXp ? "up" : "down"}>{change}</small>}
        </div>
      </div>

      {w.finished === 0 && w.xp === 0 ? (
        <p className="muted">{p.name} didn’t practise this week. One ten-question round is an easy way back in.</p>
      ) : !w.practised.length ? (
        <p className="muted">Scores for each topic start showing here after {p.name}’s next practice set.</p>
      ) : (
        <>
          <WeekList title="Strengths" tone="good" items={w.strengths} empty={`Nothing at ${STRONG}% or above yet this week.`} />
          <WeekList title="Needs practice" tone="bad" items={w.weakSpots} empty="No weak spots this week." />
          {middle.length > 0 && <WeekList title="Also practised" items={middle} />}
          {next && (
            <Link className="btn ghost self-start" href={next.href}>Practise next: {next.title}</Link>
          )}
        </>
      )}
    </article>
  );
}

function WeekList({ title, tone, items, empty }: { title: string; tone?: "good" | "bad"; items: Rated[]; empty?: string }) {
  return (
    <div className={`weeklist ${tone ?? ""}`}>
      <h4>{title}</h4>
      {items.length ? (
        <ul>
          {items.map((r) => (
            <li key={r.id}><span>{r.title}</span><small>{scoreText(r)}</small></li>
          ))}
        </ul>
      ) : (
        <p className="muted small">{empty}</p>
      )}
    </div>
  );
}
