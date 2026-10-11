import { describe, expect, it } from "vitest";
import { TOPICS } from "./arithmetic";
import { gradeCatalog } from "./catalog";
import { FRACTION_TOPICS } from "./fractions";
import { LESSONS } from "./lessons";
import { GRADES } from "./questions";
import { getKTopic, K, kTopicQuestion, K_TOPICS } from "./quickfire-k";
import { seeded } from "./rng";
import { checkQuestion } from "./templates";
import { THINKING_TOPICS } from "./thinking";

describe("grade catalog", () => {
  it("gives every grade its bar model lesson and at least one other thing to do", () => {
    for (const g of GRADES) {
      const domains = gradeCatalog(g);
      const lesson = LESSONS.find((l) => l.grade === g)!;
      expect(domains[0].items[0].lessonId).toBe(lesson.id);
      expect(domains.flatMap((d) => d.items).length).toBeGreaterThan(1);
    }
  });

  it("lists every number and fraction topic exactly once across the grades", () => {
    const hrefs = GRADES.flatMap((g) => gradeCatalog(g).flatMap((d) => d.items.map((i) => i.href)));
    for (const t of TOPICS) expect(hrefs.filter((h) => h === `/number-skills/${t.id}`)).toHaveLength(1);
    for (const t of FRACTION_TOPICS) expect(hrefs.filter((h) => h === `/fractions/${t.id}`)).toHaveLength(1);
    const keys = GRADES.flatMap((g) => gradeCatalog(g).flatMap((d) => d.items.map((i) => i.bestKey)));
    for (const t of THINKING_TOPICS) expect(keys.filter((k) => k === `dt-${t.id}`)).toHaveLength(1);
  });

  it("never shows a raw Common Core code as a title", () => {
    for (const g of GRADES) {
      for (const i of gradeCatalog(g).flatMap((d) => d.items)) expect(i.title).not.toMatch(/\b\d\.[A-Z]{1,3}\.[A-Z]\.\d/);
    }
  });

  it("sends locked practice sets to the page that offers the Pro plan", () => {
    const paid = GRADES.flatMap((g) => gradeCatalog(g).flatMap((d) => d.items)).filter((i) => !i.free);
    expect(paid.length).toBeGreaterThan(0);
    for (const i of paid) expect(["/problem-solving", "/thinking"]).toContain(i.href);
  });

  it("gives Kindergarten its own free topics, with every Kindergarten question type in exactly one", () => {
    const items = gradeCatalog(0).flatMap((d) => d.items);
    expect(items.every((i) => i.free)).toBe(true);
    for (const i of items.filter((x) => !x.lessonId)) expect(getKTopic(i.href.replace("/kindergarten/", "")), i.href).toBeDefined();
    expect(items.filter((x) => !x.lessonId)).toHaveLength(K_TOPICS.length);
    for (const t of K) expect(K_TOPICS.filter((k) => k.templates.includes(t.id)), t.id).toHaveLength(1);
  });

  it("makes sound practice questions for every Kindergarten topic", () => {
    const r = seeded(5);
    for (const t of K_TOPICS) {
      for (let i = 0; i < 50; i++) {
        const q = kTopicQuestion(t, r);
        expect(q.grade).toBe(0);
        expect(checkQuestion(q), `${t.id}: ${q.text}`).toEqual([]);
      }
    }
  });

  it("skips empty areas", () => {
    expect(gradeCatalog(1).map((d) => d.id)).toEqual(["bar-models", "numbers", "thinking"]);
    expect(gradeCatalog(8).map((d) => d.id)).toEqual(["bar-models", "algebra", "thinking"]);
  });
});
