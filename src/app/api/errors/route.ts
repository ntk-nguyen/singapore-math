import { NextResponse } from "next/server";
import { reportError } from "@/lib/report";

export const dynamic = "force-dynamic";

const MAX_BYTES = 16 * 1024;
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

/** Browser errors caught by the error pages, forwarded by the server so children's browsers never contact a third party. */
export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > MAX_BYTES) return new NextResponse(null, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const message = str(body?.message);
  if (!message) return new NextResponse(null, { status: 400 });
  await reportError({ source: "browser", message, name: str(body.name), stack: str(body.stack), digest: str(body.digest), path: str(body.path) });
  return new NextResponse(null, { status: 204 });
}
