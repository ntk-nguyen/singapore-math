import "server-only";
import { cookies } from "next/headers";
import { COOKIE, decodeClaim, demoUnlockAllowed, devProEnabled } from "./session";
import { MAX_CHILDREN } from "./profiles";
import { activeSeats, stripeConfigured } from "./stripe";

/** Server-side check: how many children this browser's Pro plan covers (0 = no Pro plan). */
export async function proSeats(): Promise<number> {
  if (devProEnabled()) return MAX_CHILDREN;
  const claim = decodeClaim((await cookies()).get(COOKIE)?.value);
  if (!claim) return 0;
  if (claim.kind === "demo") return demoUnlockAllowed() ? MAX_CHILDREN : 0;
  if (!stripeConfigured()) return 0;
  try {
    return await activeSeats(claim.customer);
  } catch (err) {
    console.error("Stripe subscription lookup failed", err);
    return 0;
  }
}

/** Server-side check: does this browser's parent have the Pro plan? */
export async function hasProPlan(): Promise<boolean> {
  return (await proSeats()) > 0;
}

export async function stripeCustomer(): Promise<string | null> {
  const claim = decodeClaim((await cookies()).get(COOKIE)?.value);
  return claim?.kind === "stripe" ? claim.customer : null;
}
