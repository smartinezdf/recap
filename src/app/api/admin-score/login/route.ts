import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, sessionCookieName } from "@/lib/recapAuth";
import { scryptSync, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

const CLUBS = [
  { club: "Garana Padel", env: "RECAP_PIN_HASH_GARANA" },
  { club: "Upadel", env: "RECAP_PIN_HASH_UPADEL" },
  { club: "Saque Padel Club", env: "RECAP_PIN_HASH_SAQUE" },
] as const;

function matches(pin: string, encoded: string | undefined): boolean {
  if (!encoded) return false;
  const [salt, hex, extra] = encoded.split(":");
  if (!salt || !hex || extra || !/^[a-f0-9]{64}$/i.test(hex)) return false;
  const actual = scryptSync(pin, salt, 32);
  const expected = Buffer.from(hex, "hex");
  return timingSafeEqual(actual, expected);
}

export async function POST(req: NextRequest) {
  // This endpoint must not be enabled publicly without shared, persistent rate limiting.
  if (process.env.RECAP_ADMIN_AUTH_ENABLED !== "true") {
    return NextResponse.json({ error: "Not enabled" }, { status: 503 });
  }
  const origin = req.headers.get("origin");
  if (!origin || origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const pin = (body as { pin?: unknown })?.pin;
  if (typeof pin !== "string" || !/^\\d{4,12}$/.test(pin)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const match = CLUBS.find(({ env }) => matches(pin, process.env[env]));
  if (!match) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const response = NextResponse.json({ club: match.club });
  response.cookies.set(sessionCookieName(), createAdminSession(match.club), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/",
    maxAge: 8 * 60 * 60,
  });
  return response;
}
