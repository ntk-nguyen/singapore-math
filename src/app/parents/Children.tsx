"use client";

import { useState } from "react";
import { ManageChildren, ParentGate } from "@/components/Profiles";
import { useProgress, type Profile } from "@/components/Progress";
import { usePlan } from "@/components/usePlan";
import { lastWeek, streak, XP_PER_STAR } from "@/lib/activity";

interface TestName {
  id: string;
  name: string;
}

function weekOf(p: Profile, now: Date) {
  const week = lastWeek(p.progress.days, now);
  return { xp: week.reduce((s, d) => s + d.xp, 0), active: week.filter((d) => d.xp > 0).length };
}

/** Each child's progress on this device, a family summary, and (behind the grown-up check) managing children. */
export function Children({ tests }: { tests: TestName[] }) {
  const { profiles, active, ready } = useProgress();
  const [plan] = usePlan();
  const [tab, setTab] = useState<string>("family");
  if (!ready) return null;
  const now = new Date();
  const shown = profiles.find((p) => p.id === tab);
  const seats = plan?.pro ? plan.seats : 0;

  return (
    <section className="panel" id="children">
      <p className="eyebrow">Your children</p>
      <h2>Progress by child</h2>
      <div className="kidtabs" role="tablist" aria-label="Children">
        <button className="kidtab" role="tab" aria-selected={!shown} onClick={() => setTab("family")}>
          <span className="who-av" aria-hidden="true">👪</span>Family
        </button>
        {profiles.map((p) => (
          <button key={p.id} className="kidtab" role="tab" aria-selected={shown?.id === p.id} onClick={() => setTab(p.id)}>
            <span className="who-av" aria-hidden="true">{p.avatar}</span>
            {p.name}
          </button>
        ))}
      </div>

      {shown ? (
        <ChildDetail p={shown} tests={tests} now={now} />
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr><th>Child</th><th>Grade</th><th>Placement</th><th>Streak</th><th>XP this week</th><th>Days active</th><th>Total XP</th></tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const w = weekOf(p, now);
                return (
                  <tr key={p.id}>
                    <td>{p.avatar} {p.name}{p.id === active.id ? " (now)" : ""}</td>
                    <td>{p.progress.grade}</td>
                    <td>{p.progress.placement ? `Grade ${p.progress.placement}` : "Not taken"}</td>
                    <td>{streak(p.progress.days, now)}</td>
                    <td>{w.xp}</td>
                    <td>{w.active} of 7</td>
                    <td>{(p.progress.stars * XP_PER_STAR).toLocaleString("en-US")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {plan?.pro && profiles.length > seats && (
        <p className="notice">
          Your Pro plan covers {seats} {seats === 1 ? "child" : "children"} and {profiles.length} use this device. Add a child to your plan with
          “Manage or cancel subscription” below.
        </p>
      )}

      <h3>Add or edit children</h3>
      <ParentGate intro="Adding, renaming or deleting a child is for grown-ups.">
        <ManageChildren />
      </ParentGate>
      <p className="muted small">Profiles are saved in this browser only, so each device keeps its own list until parent accounts arrive.</p>
    </section>
  );
}

function ChildDetail({ p, tests, now }: { p: Profile; tests: TestName[]; now: Date }) {
  const w = weekOf(p, now);
  const scores = tests.filter((t) => p.progress.best[t.id] !== undefined);
  const stats: [string, string][] = [
    ["Grade", `Grade ${p.progress.grade}`],
    ["Placement", p.progress.placement ? `Grade ${p.progress.placement}` : "Not taken"],
    ["Streak", `${streak(p.progress.days, now)} days`],
    ["XP this week", String(w.xp)],
    ["Days active", `${w.active} of 7`],
    ["Lessons done", String(p.progress.lessons.length)],
  ];
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="kidstats">
        {stats.map(([k, v]) => (
          <div className="kidstat" key={k}>
            <span>{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>
      {scores.length ? (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Practice test</th><th>Best score</th></tr></thead>
            <tbody>
              {scores.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{p.progress.best[t.id]}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">{p.name} hasn’t finished a practice test yet.</p>
      )}
    </div>
  );
}
