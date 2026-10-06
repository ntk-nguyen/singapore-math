import { describe, expect, it } from "vitest";
import { addSteps, answerFor, areaModel, longDivision, make10Steps, methodQuestion, subSteps, TOPICS } from "./arithmetic";
import { seeded } from "./rng";

const fromResult = (r: (number | null)[]) => Number(r.map((d) => d ?? "").reverse().join("") || 0);

describe("column methods", () => {
  it("addition steps end with the right sum and carries", () => {
    expect(fromResult(addSteps(47, 38).steps.at(-1)!.result)).toBe(85);
    expect(fromResult(addSteps(99999, 1).steps.at(-1)!.result)).toBe(100000);
    const s = addSteps(47, 38);
    expect(s.steps[1].marks[1]).toBe(1); // carried a ten
  });

  it("subtraction renames across zeros", () => {
    const s = subSteps(4003, 1568);
    expect(fromResult(s.steps.at(-1)!.result)).toBe(2435);
    const rename = s.steps.find((x) => x.caption.includes("Rename"))!;
    expect(rename.top).toEqual([13, 9, 9, 3]);
  });

  it("long division gives quotient and remainder", () => {
    const d = longDivision(7563, 4);
    expect(d.steps.map((s) => s.q).join("")).toBe("1890");
    expect(d.steps.at(-1)!.remainder).toBe(3);
    expect(longDivision(756, 3).steps[0].current).toBe(7);
    expect(longDivision(156, 12).steps[0].current).toBe(15); // 1 < 12, so start with 15 tens
  });

  it("area model partial products add up", () => {
    const m = areaModel(23, 14);
    expect(m.cells.flat().map((c) => c.product)).toEqual([200, 30, 80, 12]);
    expect(m.partials.reduce((s, p) => s + p.value, 0)).toBe(322);
  });

  it("make 10 splits the smaller number", () => {
    const m = make10Steps(8, 5);
    expect([m.to10, m.rest]).toEqual([2, 3]);
  });
});

describe("number skills topics", () => {
  it.each(TOPICS.map((t) => [t.id, t] as const))("%s: valid problems, methods and choices", (_, topic) => {
    const r = seeded(topic.id.length * 131 + 7);
    const digitsInTitle = topic.title.match(/(\d)-digit/g)?.map((x) => Number(x[0]));
    for (let i = 0; i < 300; i++) {
      const q = methodQuestion(topic, r);
      const { a, b } = q.method!;
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
      expect(q.answer).toBe(answerFor(q.method!));
      expect(q.std.startsWith(`${topic.grade}.`)).toBe(true);
      if (digitsInTitle && topic.op !== "sub") expect(String(a).length).toBe(digitsInTitle[0]);
      if (topic.op === "sub") expect(a).toBeGreaterThan(b);
      if (topic.op === "add") expect(fromResult(addSteps(a, b).steps.at(-1)!.result)).toBe(a + b);
      if (topic.op === "sub") expect(fromResult(subSteps(a, b).steps.at(-1)!.result)).toBe(a - b);
      if (topic.op === "mul") expect(areaModel(a, b).partials.reduce((s, p) => s + p.value, 0)).toBe(a * b);
      if (topic.op === "div") {
        const d = longDivision(a, b);
        expect(Number(d.steps.map((s) => s.q).join(""))).toBe(Math.floor(a / b));
        expect(d.steps.at(-1)!.remainder).toBe(a % b);
        if (digitsInTitle) expect(String(b).length).toBe(digitsInTitle[1]);
      }
      if (topic.op === "make10") expect(a + b).toBeGreaterThan(10);
    }
  });

  it("covers +, −, ×, ÷ with 2- to 5-digit numbers", () => {
    for (const op of ["add", "sub", "mul", "div"]) expect(TOPICS.some((t) => t.op === op)).toBe(true);
    for (const n of [2, 3, 4, 5]) {
      expect(TOPICS.some((t) => t.op === "add" && t.title.startsWith(`${n}-digit`))).toBe(true);
      expect(TOPICS.some((t) => t.op === "sub" && t.title.startsWith(`${n}-digit`))).toBe(true);
      expect(TOPICS.some((t) => t.op === "mul" && t.title.startsWith(`${n}-digit`))).toBe(true);
      expect(TOPICS.some((t) => t.op === "div" && (t.title.startsWith(`${n}-digit`) || (n === 2 && t.id === "g3-div-facts")))).toBe(true);
    }
  });
});
