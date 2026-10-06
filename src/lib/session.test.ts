import { describe, expect, it } from "vitest";
import { decodeClaim, encodeClaim } from "./session";
import { isTestKey } from "./stripe-keys";

describe("entitlement cookie", () => {
  it("round-trips a signed claim", () => {
    const v = encodeClaim({ kind: "stripe", customer: "cus_123" });
    expect(decodeClaim(v)).toEqual({ kind: "stripe", customer: "cus_123" });
  });

  it("rejects a tampered claim", () => {
    const v = encodeClaim({ kind: "stripe", customer: "cus_123" });
    const [, mac] = v.split(".");
    const forged = Buffer.from(JSON.stringify({ kind: "demo" })).toString("base64url");
    expect(decodeClaim(`${forged}.${mac}`)).toBeNull();
    expect(decodeClaim("garbage")).toBeNull();
    expect(decodeClaim(undefined)).toBeNull();
  });
});

describe("Stripe test mode guard", () => {
  it("only accepts test keys", () => {
    expect(isTestKey("sk_test_abc")).toBe(true);
    expect(isTestKey("rk_test_abc")).toBe(true);
    expect(isTestKey("sk_live_abc")).toBe(false);
    expect(isTestKey("rk_live_abc")).toBe(false);
  });
});
