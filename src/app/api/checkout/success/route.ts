import { NextResponse } from "next/server";
import { currentParent, linkCustomer } from "@/lib/parent";
import { appUrl, getStripe } from "@/lib/stripe";
import { COOKIE, cookieOptions, encodeClaim } from "@/lib/session";

/** Stripe redirects here after checkout. Verify the session, then remember the customer on this device and the parent's account. */
export async function GET(req: Request) {
  const base = appUrl(req);
  const id = new URL(req.url).searchParams.get("session_id");
  if (!id) return NextResponse.redirect(`${base}/tests`);
  try {
    const session = await getStripe().checkout.sessions.retrieve(id);
    const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (session.status !== "complete" || !customer) return NextResponse.redirect(`${base}/tests?checkout=incomplete`);
    // Checkout started by this signed-in parent: keep the plan on their account too.
    const parent = await currentParent();
    if (parent && session.client_reference_id === parent.id) {
      await linkCustomer(parent.id, customer).catch((err) => console.error("Linking the plan to the account failed", err));
    }
    const res = NextResponse.redirect(`${base}/tests?unlocked=1`);
    res.cookies.set(COOKIE, encodeClaim({ kind: "stripe", customer }), cookieOptions);
    return res;
  } catch (err) {
    console.error("Checkout verification failed", err);
    return NextResponse.redirect(`${base}/tests?checkout=error`);
  }
}
