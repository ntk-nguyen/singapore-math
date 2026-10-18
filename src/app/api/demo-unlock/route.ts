import { NextResponse } from "next/server";
import { COOKIE, cookieOptions, demoUnlockAllowed, encodeClaim } from "@/lib/session";

/** Development only: grant the Pro plan without Stripe. Disabled in production. */
export async function POST() {
  if (!demoUnlockAllowed()) return NextResponse.json({ error: "Not available." }, { status: 404 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, encodeClaim({ kind: "demo" }), cookieOptions);
  return res;
}
