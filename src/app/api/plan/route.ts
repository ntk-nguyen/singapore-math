import { NextResponse } from "next/server";
import { proSeats, stripeCustomer } from "@/lib/entitlement";
import { demoUnlockAllowed } from "@/lib/session";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const seats = await proSeats();
  return NextResponse.json({
    pro: seats > 0,
    seats,
    billing: !!(await stripeCustomer()),
    checkout: stripeConfigured(),
    demoUnlock: demoUnlockAllowed(),
  });
}
