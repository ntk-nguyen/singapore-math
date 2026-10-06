import { NextResponse } from "next/server";
import { hasFamilyPlan, stripeCustomer } from "@/lib/entitlement";
import { demoUnlockAllowed } from "@/lib/session";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    family: await hasFamilyPlan(),
    billing: !!(await stripeCustomer()),
    checkout: stripeConfigured(),
    demoUnlock: demoUnlockAllowed(),
  });
}
