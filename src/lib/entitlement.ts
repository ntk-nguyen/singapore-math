import "server-only";
import { cookies } from "next/headers";
import { COOKIE, decodeClaim, demoUnlockAllowed } from "./session";
import { hasActiveSubscription, stripeConfigured } from "./stripe";

/** Server-side check: does this browser's parent have the Family plan? */
export async function hasFamilyPlan(): Promise<boolean> {
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
