import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName, verifyAdminSession } from "@/lib/recapAuth";

export function authorize(req: NextRequest, mutation = false) {
  if (process.env.RECAP_ADMIN_AUTH_ENABLED !== "true") {
    return { error: NextResponse.json({ error: "Not enabled" }, { status: 503 }) };
  }
  if (mutation) {
    const origin = req.headers.get("origin");
    if (!origin || origin !== req.nextUrl.origin) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
  }
  const session = verifyAdminSession(req.cookies.get(sessionCookieName())?.value);
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { club: session.club };
}
