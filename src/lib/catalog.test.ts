import { describe, expect, it } from "vitest";
import { TOPICS } from "./arithmetic";
import { gradeCatalog } from "./catalog";
import { FRACTION_TOPICS } from "./fractions";
import { LESSONS } from "./lessons";
import { GRADES } from "./questions";

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
  });

  it("never shows a raw Common Core code as a title", () => {
    for (const g of GRADES) {
      for (const i of gradeCatalog(g).flatMap((d) => d.items)) expect(i.title).not.toMatch(/\b\d\.[A-Z]{1,3}\.[A-Z]\.\d/);
    }
  });

  it("sends locked practice sets to the page that offers the Pro plan", () => {
    const paid = GRADES.flatMap((g) => gradeCatalog(g).flatMap((d) => d.items)).filter((i) => !i.free);
    expect(paid.length).toBeGreaterThan(0);
    for (const i of paid) expect(i.href).toBe("/problem-solving");
  });

  it("skips empty areas", () => {
    expect(gradeCatalog(1).map((d) => d.id)).toEqual(["bar-models", "numbers"]);
    expect(gradeCatalog(8).map((d) => d.id)).toEqual(["bar-models", "algebra"]);
  });
});
