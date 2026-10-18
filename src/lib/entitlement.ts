import "server-only";
import { cookies } from "next/headers";
import { currentParent, linkedCustomer } from "./parent";
import { COOKIE, decodeClaim, demoUnlockAllowed, devProEnabled, type PlanClaim } from "./session";
import { MAX_CHILDREN } from "./profiles";
import { activeSeats, stripeConfigured } from "./stripe";

async function cookieClaim(): Promise<PlanClaim | null> {
  return decodeClaim((await cookies()).get(COOKIE)?.value);
}

/**
 * Stripe customers whose plan can apply here, best first: the one linked to the signed-in
 * parent's account, then the one this browser checked out with (the signed cookie).
 */
async function customers(): Promise<string[]> {
  const out: string[] = [];
  const parent = await currentParent();
  if (parent) {
    try {
      const linked = await linkedCustomer(parent.id);
      if (linked) out.push(linked);
    } catch (err) {
      console.error("Account customer lookup failed", err);
    }
  }
  const claim = await cookieClaim();
  if (claim?.kind === "stripe" && !out.includes(claim.customer)) out.push(claim.customer);
  return out;
}

/** The Stripe customer to manage billing for. */
export async function stripeCustomer(): Promise<string | null> {
  return (await customers())[0] ?? null;
}

/** Server-side check: how many children this parent's Pro plan covers (0 = no Pro plan). */
export async function proSeats(): Promise<number> {
  if (devProEnabled()) return MAX_CHILDREN;
  const list = await customers();
  if (!list.length) {
    const claim = await cookieClaim();
    return claim?.kind === "demo" && demoUnlockAllowed() ? MAX_CHILDREN : 0;
  }
  if (!stripeConfigured()) return 0;
  try {
    for (const c of list) {
      const seats = await activeSeats(c);
      if (seats > 0) return seats;
    }
    return 0;
  } catch (err) {
    console.error("Stripe subscription lookup failed", err);
    return 0;
  }
}

/** Server-side check: does this parent have the Pro plan? */
export async function hasProPlan(): Promise<boolean> {
  return (await proSeats()) > 0;
}
