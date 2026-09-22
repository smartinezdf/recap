import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  LIVE_ADMIN_COOKIE,
  getAdminSupabase,
  verifyAdminSession,
  youtubeVideoId,
} from "@/lib/liveAdmin";

async function currentClub() {
  const store = await cookies();
  return verifyAdminSession(store.get(LIVE_ADMIN_COOKIE)?.value);
}

export async function GET() {
  const club = await currentClub();
  if (!club) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const { data, error } = await getAdminSupabase()
      .from("live_streams")
      .select("*")
      .eq("club", club)
      .order("court");

    if (error) throw error;
    return NextResponse.json({ club, streams: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo cargar el streaming." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const club = await currentClub();
  if (!club) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    desired_state?: "live" | "stopped";
    youtube_url?: string;
    duration_minutes?: number;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Falta la cancha." }, { status: 400 });
  }

  if (body.youtube_url && !youtubeVideoId(body.youtube_url)) {
    return NextResponse.json({ error: "El enlace de YouTube no es válido." }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.desired_state) updates.desired_state = body.desired_state;
  if (typeof body.youtube_url === "string") updates.youtube_url = body.youtube_url.trim() || null;
  if (typeof body.duration_minutes === "number") {
    updates.duration_minutes = Math.min(720, Math.max(5, body.duration_minutes));
  }

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("live_streams")
      .update(updates)
      .eq("id", body.id)
      .eq("club", club)
      .select()
      .single();

    if (error) throw error;

    if (typeof body.youtube_url === "string") {
      await supabase
        .from("live_matches")
        .update({ stream_url: body.youtube_url.trim() || null })
        .eq("club", club)
        .eq("cancha", data.court)
        .neq("status", "Terminado");
    }

    return NextResponse.json({ stream: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar el cambio." },
      { status: 500 }
    );
  }
}
