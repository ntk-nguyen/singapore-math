import "server-only";
import Stripe from "stripe";
import { EXTRA_CHILD_CENTS, FIRST_CHILD_CENTS } from "./profiles";
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
const cache = new Map<string, { seats: number; at: number }>();
const CACHE_MS = 60_000;

/** How many children a Stripe customer's active or trialing Pro plan covers (0 when none). */
export async function activeSeats(customerId: string): Promise<number> {
  const hit = cache.get(customerId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.seats;
  const subs = await getStripe().subscriptions.list({ customer: customerId, status: "all", limit: 10 });
  const seats = subs.data
    .filter((s) => ACTIVE.has(s.status))
    .reduce((n, s) => n + s.items.data.reduce((m, i) => m + (i.quantity ?? 1), 0), 0);
  cache.set(customerId, { seats, at: Date.now() });
  return seats;
}

/** Whether a Stripe customer has an active or trialing Pro plan subscription. */
export async function hasActiveSubscription(customerId: string): Promise<boolean> {
  return (await activeSeats(customerId)) > 0;
}

/** Stripe lookup key for the per-child Pro price, so the app can find or create it in test mode. */
const PRICE_LOOKUP = "mathbridge_pro_per_child_monthly";
let priceId: string | null = null;

/**
 * The monthly Pro price: $7.99 for the first child and $3.99 for each extra one, as one
 * graduated tiered price where the subscription quantity is the number of children.
 * STRIPE_PRICE_ID overrides it (it should be a per-unit or tiered price in the same shape).
 */
export async function proPriceId(): Promise<string> {
  if (process.env.STRIPE_PRICE_ID) return process.env.STRIPE_PRICE_ID;
  if (priceId) return priceId;
  const stripe = getStripe();
  const found = await stripe.prices.list({ lookup_keys: [PRICE_LOOKUP], active: true, limit: 1 });
  if (found.data[0]) return (priceId = found.data[0].id);
  const created = await stripe.prices.create({
    currency: "usd",
    lookup_key: PRICE_LOOKUP,
    recurring: { interval: "month" },
    billing_scheme: "tiered",
    tiers_mode: "graduated",
    tiers: [
      { up_to: 1, unit_amount: FIRST_CHILD_CENTS },
      { up_to: "inf", unit_amount: EXTRA_CHILD_CENTS },
    ],
    product_data: { name: "MathBridge Pro plan (per child)" },
  });
  return (priceId = created.id);
}
