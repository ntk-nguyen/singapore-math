import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeClaim, devProEnabled, encodeClaim } from "./session";
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

describe("local Pro flag", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("turns Pro on in development when DEV_PRO=true", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_PRO", "true");
    expect(devProEnabled()).toBe(true);
  });

  it("accepts 1, yes and on in any case", () => {
    vi.stubEnv("NODE_ENV", "development");
    for (const v of ["1", "yes", "ON", " True "]) {
      vi.stubEnv("DEV_PRO", v);
      expect(devProEnabled()).toBe(true);
    }
  });

  it("stays off and warns for an unrecognised value", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_PRO", "tru");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(devProEnabled()).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('DEV_PRO="tru"'));
    warn.mockRestore();
  });

  it("is off when unset or false", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_PRO", "false");
    expect(devProEnabled()).toBe(false);
    vi.stubEnv("DEV_PRO", "");
    expect(devProEnabled()).toBe(false);
  });

  it("is ignored in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_PRO", "true");
    expect(devProEnabled()).toBe(false);
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
