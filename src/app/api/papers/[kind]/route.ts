import { NextResponse } from "next/server";
import { hasProPlan } from "@/lib/entitlement";
import { buildPrintPaper, getPaperKind, paperAvailable, paperCode, paperGrade } from "@/lib/papers";
import { isGrade } from "@/lib/questions";
import { attemptSeed, DIFFICULTIES, isDifficulty } from "@/lib/tests";

export const dynamic = "force-dynamic";

/**
 * Serve a printable paper with its answers. Free tests can be printed by anyone;
 * every other paper is only served to Pro plan accounts. Each call is a new paper
 * unless the caller asks for a particular seed (to reprint one).
 */
export async function GET(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind: id } = await ctx.params;
  const kind = getPaperKind(id);
  if (!kind) return NextResponse.json({ error: "Unknown paper." }, { status: 404 });
  const params = new URL(req.url).searchParams;
  const grade = Number(params.get("grade") ?? 3);
  if (!isGrade(grade)) return NextResponse.json({ error: "Grade must be 1 to 8." }, { status: 400 });
  if (!paperAvailable(kind, grade)) return NextResponse.json({ error: `There is no ${kind.name.toLowerCase()} paper for Grade ${grade} yet.` }, { status: 404 });
  if (!kind.free && !(await hasProPlan())) {
    return NextResponse.json({ error: "Printing this paper needs the Pro plan." }, { status: 402 });
  }
  const s = Number(params.get("seed") ?? NaN);
  const seed = Number.isSafeInteger(s) && s >= 0 ? s : attemptSeed();
  const asked = params.get("level");
  const level = isDifficulty(asked) ? asked : "standard";
  return NextResponse.json({
    paper: { id: kind.id, name: kind.name, grade: paperGrade(kind, grade), code: paperCode(seed, level), level: DIFFICULTIES.find((d) => d.id === level)!.label },
    seed,
    questions: buildPrintPaper(kind, grade, seed, level),
  });
}
