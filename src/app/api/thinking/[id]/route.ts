import { NextResponse } from "next/server";
import { hasProPlan } from "@/lib/entitlement";
import { getThinkTopic, isFreeTopic, thinkingQuestion } from "@/lib/thinking";

export const dynamic = "force-dynamic";

/** Serve a data & thinking topic: worked examples and practice. Intermediate and advanced topics need the Pro plan. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const topic = getThinkTopic(id);
  if (!topic) return NextResponse.json({ error: "Unknown topic." }, { status: 404 });
  if (!isFreeTopic(topic) && !(await hasProPlan())) {
    return NextResponse.json({ error: "This topic needs the Pro plan." }, { status: 402 });
  }
  const make = () => thinkingQuestion(topic, Math.random);
  return NextResponse.json({ examples: Array.from({ length: 5 }, make), questions: Array.from({ length: 30 }, make) });
}
