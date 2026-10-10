import { NextResponse } from "next/server";
import { currentParent, linkedCustomer } from "@/lib/parent";
import { clampChildren, MAX_CHILDREN } from "@/lib/profiles";
import { appUrl, getStripe, proPriceId, StripeConfigError } from "@/lib/stripe";

/**
 * Start a Stripe Checkout (test mode) for the Pro plan subscription. The quantity is the
 * number of children on the plan ($7.99 for the first, $3.99 for each extra), and the
 * parent can still change it on Stripe's page. A signed-in parent checks out as their
 * account's Stripe customer (or with their email and account id, so the success step can
 * link the new customer to the account).
 */
export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const base = appUrl(req);
    const body = (await req.json().catch(() => ({}))) as { children?: unknown };
    const parent = await currentParent();
    const customer = parent ? await linkedCustomer(parent.id) : null;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(parent && { client_reference_id: parent.id }),
      ...(customer ? { customer } : parent?.email ? { customer_email: parent.email } : {}),
      line_items: [
        {
          price: await proPriceId(),
          quantity: clampChildren(body.children),
          adjustable_quantity: { enabled: true, minimum: 1, maximum: MAX_CHILDREN },
        },
      ],
      subscription_data: { trial_period_days: 7 },
      success_url: `${base}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pro`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof StripeConfigError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error("Checkout failed", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
