import { NextResponse } from "next/server";
import {
  LIVE_ADMIN_COOKIE,
  authenticatePin,
  createAdminSession,
} from "@/lib/liveAdmin";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { pin?: string };
  const club = authenticatePin(body.pin || "");

  if (!club) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
  }

  try {
    const response = NextResponse.json({ club });
    response.cookies.set(LIVE_ADMIN_COOKIE, createAdminSession(club), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 12 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo iniciar sesión." },
      { status: 500 }
    );
  }
}
