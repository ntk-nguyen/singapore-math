import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed entitlement cookie. It holds the Stripe customer id (or a dev-only demo
 * grant) and is checked on the server before any paid test is served.
 */
export const COOKIE = "bma_plan";
export const MAX_AGE = 60 * 60 * 24 * 365;

export type PlanClaim = { kind: "stripe"; customer: string } | { kind: "demo" };

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set (16+ characters) in production.");
  return "dev-only-insecure-session-secret";
}

const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

export function encodeClaim(claim: PlanClaim): string {
  const body = Buffer.from(JSON.stringify(claim)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeClaim(value: string | undefined): PlanClaim | null {
  if (!value) return null;
  const [body, mac] = value.split(".");
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const claim = JSON.parse(Buffer.from(body, "base64url").toString()) as PlanClaim;
    if (claim.kind === "demo") return claim;
    if (claim.kind === "stripe" && typeof claim.customer === "string") return claim;
    return null;
  } catch {
    return null;
  }
}

/** The demo unlock exists for local development and is never honoured in production. */
export function demoUnlockAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_DEMO_UNLOCK === "true";
}

const ON = ["true", "1", "yes", "on"];
const OFF = ["", "false", "0", "no", "off"];
let warnedDevPro = false;

/** Local development only: treat every visitor as Pro, with no cookie or Stripe. Never honoured in production. */
export function devProEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const value = (process.env.DEV_PRO ?? "").trim().toLowerCase();
  if (ON.includes(value)) return true;
  if (!OFF.includes(value) && !warnedDevPro) {
    warnedDevPro = true;
    console.warn(`DEV_PRO="${process.env.DEV_PRO}" isn't recognised, so Pro stays off. Use DEV_PRO=true and restart npm run dev.`);
  }
  return false;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};
