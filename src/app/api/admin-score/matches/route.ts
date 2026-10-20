import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/recapAdminRequest";
import { adminDb } from "@/lib/recapAdminServer";

export const runtime = "nodejs";
const allowed = ["sport","cancha","tournament","category","round","match_time","team_a","team_b","status","third_set_mode","sets","game_a","game_b","serving","server_number"] as const;

export async function GET(req: NextRequest) {
  const auth = authorize(req);
  if (auth.error) return auth.error;
  const { data, error } = await adminDb().from("live_matches").select("*").eq("club", auth.club!).order("created_at", { ascending: false });
  return error ? NextResponse.json({ error: "Could not load matches" }, { status: 500 }) : NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const auth = authorize(req, true);
  if (auth.error) return auth.error;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const input = body as Record<string, unknown>;
  const payload: Record<string, unknown> = { club: auth.club };
  for (const field of allowed) if (Object.prototype.hasOwnProperty.call(input, field)) payload[field] = input[field];
  if (typeof payload.cancha !== "string" || typeof payload.team_a !== "string" || typeof payload.team_b !== "string") {
    return NextResponse.json({ error: "Missing match fields" }, { status: 400 });
  }
  const { data, error } = await adminDb().from("live_matches").insert(payload).select().single();
  return error ? NextResponse.json({ error: "Could not create match" }, { status: 400 }) : NextResponse.json({ data }, { status: 201 });
}
