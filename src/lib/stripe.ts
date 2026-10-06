import "server-only";
import Stripe from "stripe";
import { isTestKey } from "./stripe-keys";

export class StripeConfigError extends Error {}

/**
 * Stripe client, test mode only. Live keys are refused outright so the app can't
 * take real payments until someone deliberately removes this guard.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new StripeConfigError("Payments are not set up yet (STRIPE_SECRET_KEY is missing).");
  if (!isTestKey(key)) throw new StripeConfigError("Only Stripe test-mode keys (sk_test_ or rk_test_) are allowed.");
  return new Stripe(key);
}

export function stripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!key && isTestKey(key);
}

export function appUrl(req: Request): string {
  return process.env.APP_URL?.replace(/\/$/, "") || new URL(req.url).origin;
}

const ACTIVE = new Set<Stripe.Subscription.Status>(["active", "trialing"]);
const cache = new Map<string, { ok: boolean; at: number }>();
const CACHE_MS = 60_000;

/** Whether a Stripe customer has an active or trialing Pro plan subscription. */
export async function hasActiveSubscription(customerId: string): Promise<boolean> {
  const hit = cache.get(customerId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.ok;
  const subs = await getStripe().subscriptions.list({ customer: customerId, status: "all", limit: 10 });
  const ok = subs.data.some((s) => ACTIVE.has(s.status));
  cache.set(customerId, { ok, at: Date.now() });
  return ok;
}
