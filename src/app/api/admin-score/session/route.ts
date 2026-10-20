import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName, verifyAdminSession } from "@/lib/recapAuth";

export async function GET(req: NextRequest) {
  const session = verifyAdminSession(req.cookies.get(sessionCookieName())?.value);
  return NextResponse.json(session ? { authenticated: true, club: session.club } : { authenticated: false }, {
    headers: { "Cache-Control": "no-store" },
  });
}
