import { NextResponse } from "next/server";
import { stripeCustomer } from "@/lib/entitlement";
import { appUrl, getStripe, StripeConfigError } from "@/lib/stripe";

/** Open the Stripe Customer Portal so parents can cancel or change their plan. */
export async function POST(req: Request) {
  const customer = await stripeCustomer();
  if (!customer) return NextResponse.json({ error: "No subscription on this device or account." }, { status: 404 });
  try {
    const portal = await getStripe().billingPortal.sessions.create({ customer, return_url: `${appUrl(req)}/parents` });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    if (err instanceof StripeConfigError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error("Portal failed", err);
    return NextResponse.json({ error: "Could not open the billing portal." }, { status: 500 });
  }
}
