import { NextResponse } from "next/server";
import { hasProPlan } from "@/lib/entitlement";
import { isGrade } from "@/lib/questions";
import { attemptSeed, buildPaper, getTest, isDifficulty } from "@/lib/tests";

export const dynamic = "force-dynamic";

/** Serve a test paper. Paid tests are only served to Pro plan accounts. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const test = getTest(id);
  if (!test || id === "placement") return NextResponse.json({ error: "Unknown test." }, { status: 404 });
  const params = new URL(req.url).searchParams;
  const grade = Number(params.get("grade") ?? 3);
  if (!isGrade(grade)) return NextResponse.json({ error: "Grade must be 1 to 8." }, { status: 400 });
  if (!test.free && !(await hasProPlan())) {
    return NextResponse.json({ error: "This test needs the Pro plan." }, { status: 402 });
  }
  // A new paper on every attempt unless the caller asks for a particular one.
  const seed = Number(params.get("seed") ?? NaN);
  const attempt = Number.isSafeInteger(seed) && seed >= 0 ? seed : attemptSeed();
  const asked = params.get("level");
  const level = isDifficulty(asked) ? asked : "standard";
  return NextResponse.json({ test: { id: test.id, name: test.name, free: test.free }, seed: attempt, level, questions: buildPaper(test, grade, attempt, level) });
}
