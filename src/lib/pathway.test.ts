import { describe, expect, it } from "vitest";
import { dayKey, lastWeek, logDay, parseDays, streak } from "./activity";
import { gradeCatalog } from "./catalog";
import { LESSONS } from "./lessons";
import { pathway, skill } from "./pathway";
import { GRADES } from "./questions";

describe("pathway", () => {
  it("makes the first unfinished unit current and nothing else", () => {
    for (const g of GRADES) {
      const units = pathway(gradeCatalog(g), { best: {}, lessons: [], pro: false });
      expect(units.filter((u) => u.state === "current")).toHaveLength(1);
      expect(units[0].state).toBe("current");
    }
  });

  it("masters a unit once every unlocked topic is done, and moves current along", () => {
    const domains = gradeCatalog(3);
    const lesson = LESSONS.find((l) => l.grade === 3)!;
    const best: Record<string, number> = {};
    for (const i of domains[0].items) if (i.bestKey) best[i.bestKey] = 90;
    const units = pathway(domains, { best, lessons: [lesson.id], pro: false });
    expect(units[0].state).toBe("mastered");
    expect(units[0].pct).toBe(100);
    expect(units[1].state).toBe("current");
  });

  it("locks units whose topics all need Pro, and opens them with Pro", () => {
    const g = GRADES.find((x) => gradeCatalog(x).some((d) => d.items.every((i) => !i.free)));
    if (!g) return;
    const free = pathway(gradeCatalog(g), { best: {}, lessons: [], pro: false });
    const pro = pathway(gradeCatalog(g), { best: {}, lessons: [], pro: true });
    expect(free.some((u) => u.state === "locked")).toBe(true);
    expect(pro.some((u) => u.state === "locked")).toBe(false);
  });

  it("scores a skill from saved scores only", () => {
    const domains = gradeCatalog(4);
    const key = domains[1].items[0].bestKey!;
    const units = pathway(domains, { best: { [key]: 60 }, lessons: [], pro: false });
    expect(skill(units[1])).toBe(60);
    expect(units[1].items[0].state).toBe("started");
    expect(skill(units[0])).toBeNull();
  });
});

describe("activity", () => {
  const day = (s: string) => new Date(`${s}T12:00:00`);

  it("counts a streak through today, or up to yesterday before today's practice", () => {
    let days = {};
    for (const d of ["2026-10-03", "2026-10-04", "2026-10-05"]) days = logDay(days, day(d), { xp: 10 });
    expect(streak(days, day("2026-10-06"))).toBe(3);
    days = logDay(days, day("2026-10-06"), { done: 1 });
    expect(streak(days, day("2026-10-06"))).toBe(4);
    expect(streak(days, day("2026-10-08"))).toBe(0);
  });

  it("adds to today and keeps the last week in order", () => {
    let days = logDay({}, day("2026-10-06"), { xp: 10 });
    days = logDay(days, day("2026-10-06"), { xp: 20, done: 1 });
    expect(days[dayKey(day("2026-10-06"))]).toEqual({ xp: 30, done: 1 });
    const week = lastWeek(days, day("2026-10-06"));
    expect(week).toHaveLength(7);
    expect(week[6]).toMatchObject({ xp: 30, today: true });
  });

  it("drops old and malformed saved days", () => {
    const days = logDay({ "2025-01-01": { xp: 5, done: 0 } }, day("2026-10-06"), { xp: 1 });
    expect(Object.keys(days)).toEqual(["2026-10-06"]);
    expect(parseDays({ "2026-10-06": { xp: 3 }, bad: { xp: 1 }, "2026-10-05": 7 })).toEqual({ "2026-10-06": { xp: 3, done: 0 } });
  });
});
