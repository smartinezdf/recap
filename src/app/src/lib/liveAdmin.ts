import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const LIVE_ADMIN_COOKIE = "recap_live_admin";

export type LiveStreamState = "stopped" | "starting" | "live" | "stopping" | "error";

export type LiveStreamRecord = {
  id: string;
  club: string;
  court: string;
  device_name: string;
  desired_state: "live" | "stopped";
  actual_state: LiveStreamState;
  youtube_url: string | null;
  duration_minutes: number;
  heartbeat_at: string | null;
  started_at: string | null;
  error_message: string | null;
  updated_at: string;
};

function getSessionSecret() {
  return process.env.LIVE_ADMIN_SECRET || "";
}

export function parseClubPins(): Record<string, string> {
  const configured = process.env.RECAP_CLUB_PINS;

  if (!configured) return {};

  try {
    return JSON.parse(configured) as Record<string, string>;
  } catch {
    return {};
  }
}

export function authenticatePin(pin: string) {
  const entries = Object.entries(parseClubPins());
  const match = entries.find(([, expectedPin]) => expectedPin === pin.trim());
  return match?.[0] || null;
}

export function createAdminSession(club: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("LIVE_ADMIN_SECRET is not configured.");

  const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ club, expiresAt })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminSession(token?: string | null) {
  if (!token) return null;

  const secret = getSessionSecret();
  if (!secret) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      club: string;
      expiresAt: number;
    };

    if (!value.club || value.expiresAt < Date.now()) return null;
    return value.club;
  } catch {
    return null;
  }
}

export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isDeviceAuthorized(request: Request) {
  const expected = process.env.LIVE_DEVICE_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!expected || !supplied) return false;

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}

export function youtubeVideoId(url?: string | null) {
  if (!url) return null;

  const matches = [
    url.match(/[?&]v=([^&]+)/),
    url.match(/youtu\.be\/([^?&]+)/),
    url.match(/youtube\.com\/live\/([^?&]+)/),
    url.match(/youtube\.com\/embed\/([^?&]+)/),
  ];

  return matches.find(Boolean)?.[1] || null;
}
