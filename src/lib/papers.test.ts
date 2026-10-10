import { describe, expect, it } from "vitest";
import { buildPrintPaper, getPaperKind, PAPER_KINDS, paperAvailable, paperCode, paperGrade } from "./papers";
import { GRADES } from "./questions";
import { questionKey } from "./templates";

describe("printable papers", () => {
  it("offers every test but placement, and one paper per topic", () => {
    expect(PAPER_KINDS.some((k) => k.id === "placement")).toBe(false);
    expect(PAPER_KINDS.filter((k) => k.group === "test")).toHaveLength(7);
    expect(PAPER_KINDS.filter((k) => k.group === "topic").length).toBeGreaterThanOrEqual(7);
  });

  it("only lets free users print the free checkpoint", () => {
    expect(PAPER_KINDS.filter((k) => k.free).map((k) => k.id)).toEqual(["checkpoint"]);
  });

  it("builds a full paper with no repeated question for every kind and grade it is offered at", () => {
    for (const kind of PAPER_KINDS) {
      for (const g of GRADES) {
        if (!paperAvailable(kind, g)) continue;
        const qs = buildPrintPaper(kind, g, 99);
        expect(qs, `${kind.id} grade ${g}`).toHaveLength(kind.test.length);
        expect(new Set(qs.map(questionKey)).size, `${kind.id} grade ${g}`).toBe(qs.length);
        // Never next year's work.
        expect(qs.every((q) => q.grade <= Math.max(paperGrade(kind, g), 1)), `${kind.id} grade ${g}`).toBe(true);
      }
    }
  });

  it("reprints the same paper from its seed and draws a new one otherwise", () => {
    const word = getPaperKind("topic-word")!;
    expect(buildPrintPaper(word, 4, 5)).toEqual(buildPrintPaper(word, 4, 5));
    const first = new Set(buildPrintPaper(word, 4, 5).map((q) => q.text));
    const again = buildPrintPaper(word, 4, 6).filter((q) => first.has(q.text)).length;
    expect(again / first.size).toBeLessThan(0.25);
  });

  it("does not offer a topic before it is taught", () => {
    expect(paperAvailable(getPaperKind("topic-equations")!, 1)).toBe(false);
    expect(paperAvailable(getPaperKind("topic-word")!, 1)).toBe(true);
  });

  it("prints a short paper code", () => {
    expect(paperCode(0)).toBe("000000");
    expect(paperCode(2 ** 31 - 1)).toMatch(/^[0-9A-Z]{6}$/);
  });
});
