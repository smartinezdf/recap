import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, sessionCookieName } from "@/lib/recapAuth";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { adminDb } from "@/lib/recapAdminServer";

export const runtime = "nodejs";

const CLUBS = [
  { club: "Garana Padel", env: "RECAP_PIN_HASH_GARANA" },
  { club: "Upadel", env: "RECAP_PIN_HASH_UPADEL" },
  { club: "Saque Padel Club", env: "RECAP_PIN_HASH_SAQUE" },
] as const;

// A shared, atomic Supabase counter is required: serverless in-memory limits are bypassable.
async function allowAttempt(req: NextRequest): Promise<boolean> {
  const secret = process.env.RECAP_SESSION_SECRET;
  if (!secret || secret.length < 32) return false;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = req.headers.get("x-real-ip")?.trim() || forwarded;
  if (!ip || ip.length > 128) return false; // Fail closed if the platform cannot identify a client.
  const hash = (key: string) => createHmac("sha256", secret).update(key).digest("hex");
  const db = adminDb();
  // Both limits must pass. Global cap prevents rotating source addresses indefinitely.
  for (const [key, limit] of [[hash("ip:" + ip), 5], [hash("global"), 100]] as const) {
    const { data, error } = await db.rpc("recap_login_rate_limit", { p_key: key, p_limit: limit, p_window_seconds: 900 });
    if (error || data !== true) return false;
  }
  return true;
}

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
  // Consume an attempt before parsing or checking credentials, including malformed requests.
  try {
    if (!(await allowAttempt(req))) return NextResponse.json({ error: "Too many attempts or authentication temporarily unavailable" }, { status: 429, headers: { "Retry-After": "900", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Authentication temporarily unavailable" }, { status: 503 });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const pin = (body as { pin?: unknown })?.pin;
  if (typeof pin !== "string" || !/^\d{4,12}$/.test(pin)) {
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
