import "server-only";
import { cookies } from "next/headers";
import { COOKIE, decodeClaim, demoUnlockAllowed, devProEnabled } from "./session";
import { hasActiveSubscription, stripeConfigured } from "./stripe";

/** Server-side check: does this browser's parent have the Pro plan? */
export async function hasProPlan(): Promise<boolean> {
  if (devProEnabled()) return true;
  const claim = decodeClaim((await cookies()).get(COOKIE)?.value);
  if (!claim) return false;
  if (claim.kind === "demo") return demoUnlockAllowed();
  if (!stripeConfigured()) return false;
  try {
    return await hasActiveSubscription(claim.customer);
  } catch (err) {
    console.error("Stripe subscription lookup failed", err);
    return false;
  }
}

export async function stripeCustomer(): Promise<string | null> {
  const claim = decodeClaim((await cookies()).get(COOKIE)?.value);
  return claim?.kind === "stripe" ? claim.customer : null;
}
