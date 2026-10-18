import { NextResponse } from "next/server";
import { parseFamily } from "@/lib/family";
import { currentParent, deleteParent, loadFamily, saveFamily } from "@/lib/parent";

export const dynamic = "force-dynamic";

/** Children and progress are a few KB; anything far bigger is not from this app. */
const MAX_BYTES = 256 * 1024;

const signedOut = () => NextResponse.json({ error: "Sign in to sync your children." }, { status: 401 });

/** The children kept in the signed-in parent's account (null when none are saved yet). */
export async function GET() {
  const parent = await currentParent();
  if (!parent) return signedOut();
  try {
    return NextResponse.json({ family: await loadFamily(parent.id) });
  } catch (err) {
    console.error("Loading family failed", err);
    return NextResponse.json({ error: "Could not load your children." }, { status: 500 });
  }
}

/** Merge this device's children into the account and return the merged family. */
export async function PUT(req: Request) {
  const parent = await currentParent();
  if (!parent) return signedOut();
  const text = await req.text();
  if (text.length > MAX_BYTES) return NextResponse.json({ error: "Too much data." }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  try {
    return NextResponse.json({ family: await saveFamily(parent.id, parseFamily(body)) });
  } catch (err) {
    console.error("Saving family failed", err);
    return NextResponse.json({ error: "Could not save your children." }, { status: 500 });
  }
}

/** Delete the parent's account and everything synced to it. Profiles on this device stay. */
export async function DELETE() {
  const parent = await currentParent();
  if (!parent) return signedOut();
  try {
    await deleteParent(parent.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Deleting account failed", err);
    return NextResponse.json({ error: "Could not delete your account." }, { status: 500 });
  }
}
