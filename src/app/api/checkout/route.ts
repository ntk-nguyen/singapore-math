import { NextResponse } from "next/server";
import { appUrl, getStripe, StripeConfigError } from "@/lib/stripe";

/** Start a Stripe Checkout (test mode) for the Family plan subscription. */
export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const base = appUrl(req);
    const price = process.env.STRIPE_PRICE_ID;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        price
          ? { price, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: 799,
                recurring: { interval: "month" },
                product_data: { name: "Bar Model Academy Family plan" },
              },
            },
      ],
      subscription_data: { trial_period_days: 7 },
      success_url: `${base}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/tests`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof StripeConfigError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error("Checkout failed", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
