import { describe, expect, it } from "vitest";
import { placementResult, recordAnswer, startPlacement } from "./placement";

describe("placement", () => {
  it("starts at the selected grade, capped at 5", () => {
    expect(startPlacement(3).grade).toBe(3);
    expect(startPlacement(8).grade).toBe(5);
  });

  it("moves up after two correct answers and down after a miss", () => {
    let s = startPlacement(3);
    s = recordAnswer(s, true);
    expect(s.grade).toBe(3);
    s = recordAnswer(s, true);
    expect(s.grade).toBe(4);
    s = recordAnswer(s, false);
    expect(s.grade).toBe(3);
  });

  it("never leaves grades 1 to 8", () => {
    let s = startPlacement(1);
    for (let i = 0; i < 5; i++) s = recordAnswer(s, false);
    expect(s.grade).toBe(1);
    for (let i = 0; i < 30; i++) s = recordAnswer(s, true);
    expect(s.grade).toBe(8);
  });

  it("places a child who gets everything right at grade 8", () => {
    let s = startPlacement(5);
    for (let i = 0; i < 12; i++) s = recordAnswer(s, true);
    expect(placementResult(s)).toBe(8);
  });

  it("places a child who gets everything wrong at grade 1", () => {
    let s = startPlacement(4);
    for (let i = 0; i < 12; i++) s = recordAnswer(s, false);
    expect(placementResult(s)).toBe(1);
  });
});
