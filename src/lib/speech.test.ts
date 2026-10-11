import { describe, expect, it } from "vitest";
import { sayMath, spokenText } from "./speech";

describe("read aloud", () => {
  it("says sums the way people say them", () => {
    expect(sayMath("What is 7 − 3?")).toBe("What is 7 minus 3?");
    expect(sayMath("What is 2 + 3?")).toBe("What is 2 plus 3?");
    expect(sayMath("4 + ? = 9")).toBe("4 plus ? equals 9");
  });

  it("reads the question, then the choices", () => {
    const q = { grade: 0 as const, std: "K.CC.B.5", text: "How many ducks are there? Count them.", answer: "4", choices: ["3", "4", "5", "6"] };
    expect(spokenText(q)).toBe("How many ducks are there? Count them. Is it 3, 4, 5 or 6?");
    expect(spokenText({ ...q, ask: "Find the number.", choices: [] })).toBe("How many ducks are there? Count them. Find the number.");
  });
});
