import { describe, expect, it } from "vitest";
import { cleanName, clampChildren, dollars, isAvatar, MAX_CHILDREN, proMonthlyCents } from "./profiles";

describe("per-child pricing", () => {
  it("charges $7.99 for the first child and $3.99 for each extra", () => {
    expect(dollars(proMonthlyCents(1))).toBe("$7.99");
    expect(dollars(proMonthlyCents(2))).toBe("$11.98");
    expect(dollars(proMonthlyCents(3))).toBe("$15.97");
    expect(dollars(proMonthlyCents(5))).toBe("$23.95");
  });

  it("keeps the number of children between 1 and the cap", () => {
    expect(clampChildren(0)).toBe(1);
    expect(clampChildren(-3)).toBe(1);
    expect(clampChildren(9)).toBe(MAX_CHILDREN);
    expect(clampChildren("3")).toBe(1);
    expect(clampChildren(Number.NaN)).toBe(1);
    expect(clampChildren(2.4)).toBe(2);
  });
});

describe("profile fields", () => {
  it("keeps names short and tidy", () => {
    expect(cleanName("  Mia   Rose ")).toBe("Mia Rose");
    expect(cleanName("x".repeat(40))).toHaveLength(20);
    expect(cleanName("   ")).toBe("");
  });

  it("accepts only built-in avatars", () => {
    expect(isAvatar("🦊")).toBe(true);
    expect(isAvatar("https://example.com/me.png")).toBe(false);
  });
});
