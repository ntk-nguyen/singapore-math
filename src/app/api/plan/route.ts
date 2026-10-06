import { NextResponse } from "next/server";
import { hasProPlan, stripeCustomer } from "@/lib/entitlement";
import { demoUnlockAllowed } from "@/lib/session";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    pro: await hasProPlan(),
    billing: !!(await stripeCustomer()),
    checkout: stripeConfigured(),
    demoUnlock: demoUnlockAllowed(),
  });
}
