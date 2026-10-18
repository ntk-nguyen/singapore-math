import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signInEnabled } from "@/auth";
import { proSeats, stripeCustomer } from "@/lib/entitlement";
import { currentParent, linkCustomer, linkedCustomer } from "@/lib/parent";
import { COOKIE, decodeClaim, demoUnlockAllowed } from "@/lib/session";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const parent = await currentParent();
  if (parent) {
    // A plan bought on this device before signing in moves to the account, so it follows the parent.
    const claim = decodeClaim((await cookies()).get(COOKIE)?.value);
    if (claim?.kind === "stripe") {
      try {
        if (!(await linkedCustomer(parent.id))) await linkCustomer(parent.id, claim.customer);
      } catch (err) {
        console.error("Linking this device's plan failed", err);
      }
    }
  }
  const seats = await proSeats();
  return NextResponse.json({
    pro: seats > 0,
    seats,
    billing: !!(await stripeCustomer()),
    checkout: stripeConfigured(),
    demoUnlock: demoUnlockAllowed(),
    signIn: signInEnabled(),
    parent: parent && { name: parent.name, email: parent.email },
  });
}
