import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/recapAdminRequest";
import { adminDb } from "@/lib/recapAdminServer";

export const runtime = "nodejs";
const allowed = new Set(["sport","cancha","tournament","category","round","match_time","team_a","team_b","status","third_set_mode","sets","game_a","game_b","serving","server_number"]);

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = authorize(req, true);
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) if (allowed.has(key)) payload[key] = value;
  if (!Object.keys(payload).length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  payload.updated_at = new Date().toISOString();
  const { data, error } = await adminDb().from("live_matches").update(payload).eq("id", id).eq("club", auth.club!).select().maybeSingle();
  if (error) return NextResponse.json({ error: "Could not update match" }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = authorize(req, true);
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const { data, error } = await adminDb().from("live_matches").delete().eq("id", id).eq("club", auth.club!).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not delete match" }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
