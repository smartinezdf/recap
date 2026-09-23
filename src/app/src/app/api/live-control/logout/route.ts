import { NextResponse } from "next/server";
import { LIVE_ADMIN_COOKIE } from "@/lib/liveAdmin";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(LIVE_ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
