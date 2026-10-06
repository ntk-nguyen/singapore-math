import { describe, expect, it } from "vitest";
import { buildPaper, getTest, testGrade, TESTS } from "./tests";

describe("test catalog", () => {
  it("has exactly two free tests and six paid ones", () => {
    expect(TESTS.filter((t) => t.free).map((t) => t.id)).toEqual(["placement", "checkpoint"]);
    expect(TESTS.filter((t) => !t.free)).toHaveLength(6);
  });

  it("clamps the grade to the test's range", () => {
    const psle = getTest("psle")!;
    expect(testGrade(psle, 2)).toBe(5);
    expect(testGrade(psle, 8)).toBe(6);
    expect(testGrade(getTest("checkpoint")!, 2)).toBe(2);
  });

  it("builds the same paper every time", () => {
    const t = getTest("checkpoint")!;
    const a = buildPaper(t, 4);
    expect(a).toHaveLength(15);
    expect(buildPaper(t, 4)).toEqual(a);
  });
});
