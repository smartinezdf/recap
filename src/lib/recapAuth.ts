import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type AdminSession = { club: string; exp: number };
const COOKIE = "recap_admin_session";

function secret(): string {
  const value = process.env.RECAP_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("RECAP_SESSION_SECRET is missing or too short");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function sessionCookieName() { return COOKIE; }

export function createAdminSession(club: string): string {
  const payload = Buffer.from(JSON.stringify({ club, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  return payload + "." + sign(payload);
}

export function verifyAdminSession(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const data: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data || typeof data !== "object") return null;
    const s = data as Record<string, unknown>;
    if (typeof s.club !== "string" || typeof s.exp !== "number" || s.exp <= Date.now()) return null;
    return { club: s.club, exp: s.exp };
  } catch { return null; }
}
