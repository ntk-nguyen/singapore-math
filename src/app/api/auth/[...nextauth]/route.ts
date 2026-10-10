import { NextResponse, type NextRequest } from "next/server";
import { handlers, signInEnabled } from "@/auth";

const off = () => NextResponse.json({ error: "Sign-in is not set up." }, { status: 404 });

export function GET(req: NextRequest) {
  return signInEnabled() ? handlers.GET(req) : off();
}

export function POST(req: NextRequest) {
  return signInEnabled() ? handlers.POST(req) : off();
}
