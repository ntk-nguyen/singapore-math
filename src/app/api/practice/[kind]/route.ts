import { NextResponse } from "next/server";
import { hasProPlan } from "@/lib/entitlement";
import { isKind, isLevel, LEVELS, practiceSet } from "@/lib/problems";

export const dynamic = "force-dynamic";

/** Serve a practice set. Intermediate and advanced levels need the Pro plan. */
export async function GET(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  const level = new URL(req.url).searchParams.get("level") ?? "easy";
  if (!isKind(kind) || !isLevel(level)) return NextResponse.json({ error: "Unknown practice set." }, { status: 404 });
  const free = LEVELS.find((l) => l.id === level)!.free;
  if (!free && !(await hasProPlan())) {
    return NextResponse.json({ error: "This level needs the Pro plan." }, { status: 402 });
  }
  return NextResponse.json({ questions: practiceSet(kind, level, Math.random) });
}
