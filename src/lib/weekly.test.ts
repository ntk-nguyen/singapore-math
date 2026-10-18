import { describe, expect, it } from "vitest";
import { logDay, parseDays, type Days } from "./activity";
import { mergeFamily, DEFAULT_PROGRESS, type Profile } from "./family";
import { practiceNames, weekLabel, weeklySummary } from "./weekly";

const day = (s: string) => new Date(`${s}T12:00:00`);
const names = practiceNames([{ id: "checkpoint", name: "Grade checkpoint" }, { id: "placement", name: "Placement check" }]);

function practise(days: Days, date: string, id: string, pct: number, xp = 50): Days {
  return logDay(days, day(date), { xp, done: 1, score: [id, pct] });
}

describe("weeklySummary", () => {
  it("covers the last seven days and compares XP with the week before", () => {
    let days: Days = {};
    days = logDay(days, day("2026-10-05"), { xp: 100 }); // the week before
    days = logDay(days, day("2026-10-11"), { xp: 999 }); // eight days back: also the week before
    days = practise(days, "2026-10-12", "checkpoint", 90);
    days = practise(days, "2026-10-18", "checkpoint", 70);
    const w = weeklySummary(days, day("2026-10-18"), names);
    expect(w).toMatchObject({ from: "2026-10-12", to: "2026-10-18", xp: 100, prevXp: 1099, activeDays: 2, finished: 2 });
    expect(weekLabel(w)).toBe("Oct 12 – Oct 18");
  });

  it("names strengths and weak spots from the week's average score", () => {
    let days: Days = {};
    days = practise(days, "2026-10-14", "ns-g2-add-2d", 90);
    days = practise(days, "2026-10-15", "ns-g2-add-2d", 100);
    days = practise(days, "2026-10-15", "fd-equiv", 40);
    days = practise(days, "2026-10-16", "fd-equiv", 60);
    days = practise(days, "2026-10-16", "checkpoint", 75);
    const w = weeklySummary(days, day("2026-10-18"), names);
    expect(w.strengths.map((r) => [r.id, r.avg])).toEqual([["ns-g2-add-2d", 95]]);
    expect(w.weakSpots.map((r) => [r.id, r.avg, r.first, r.last])).toEqual([["fd-equiv", 50, 40, 60]]);
    expect(w.practised.find((r) => r.id === "checkpoint")).toMatchObject({ title: "Grade checkpoint", href: "/tests/checkpoint" });
  });

  it("names practice sets from the catalog and skips scores that aren't skills", () => {
    let days: Days = {};
    days = practise(days, "2026-10-18", "ps-word-easy", 30);
    days = practise(days, "2026-10-18", "placement", 20);
    days = practise(days, "2026-10-18", "tt-sprint", 14);
    const w = weeklySummary(days, day("2026-10-18"), names);
    expect(w.practised.map((r) => r.id)).toEqual(["ps-word-easy"]);
    expect(w.weakSpots[0].title).toBe("Word problems: easy");
    expect(w.finished).toBe(3);
  });

  it("is empty for a child who didn't practise", () => {
    const w = weeklySummary({}, day("2026-10-18"), names);
    expect(w).toMatchObject({ xp: 0, finished: 0, activeDays: 0, practised: [], strengths: [], weakSpots: [] });
  });
});

describe("daily scores", () => {
  it("survive saving, and syncing keeps the fuller list from either device", () => {
    const one = practise({}, "2026-10-18", "checkpoint", 60);
    const two = practise(practise({}, "2026-10-18", "checkpoint", 60), "2026-10-18", "checkpoint", 80);
    expect(parseDays(JSON.parse(JSON.stringify(two)))).toEqual(two);
    const kid = (days: Days, updatedAt: number): Profile => ({ id: "a", name: "A", avatar: "🦊", updatedAt, progress: { ...DEFAULT_PROGRESS, days } });
    for (const m of [mergeFamily({ profiles: [kid(one, 2)], removed: [] }, { profiles: [kid(two, 1)], removed: [] }),
      mergeFamily({ profiles: [kid(two, 1)], removed: [] }, { profiles: [kid(one, 2)], removed: [] })]) {
      expect(m.profiles[0].progress.days["2026-10-18"].scores).toEqual({ checkpoint: [60, 80] });
    }
  });

  it("drops malformed saved scores", () => {
    expect(parseDays({ "2026-10-18": { xp: 1, done: 1, scores: { a: [50, "x"], b: "no", c: [] } } })).toEqual({
      "2026-10-18": { xp: 1, done: 1, scores: { a: [50] } },
    });
  });
});
