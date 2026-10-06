import { NextResponse } from "next/server";
import { hasFamilyPlan } from "@/lib/entitlement";
import { isGrade } from "@/lib/questions";
import { buildPaper, getTest } from "@/lib/tests";

export const dynamic = "force-dynamic";

/** Serve a test paper. Paid tests are only served to Family plan accounts. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const test = getTest(id);
  if (!test || id === "placement") return NextResponse.json({ error: "Unknown test." }, { status: 404 });
  const grade = Number(new URL(req.url).searchParams.get("grade") ?? 3);
  if (!isGrade(grade)) return NextResponse.json({ error: "Grade must be 1 to 8." }, { status: 400 });
  if (!test.free && !(await hasFamilyPlan())) {
    return NextResponse.json({ error: "This test needs the Family plan." }, { status: 402 });
  }
  return NextResponse.json({ test: { id: test.id, name: test.name, free: test.free }, questions: buildPaper(test, grade) });
}
