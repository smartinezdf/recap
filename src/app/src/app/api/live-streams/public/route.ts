import { NextResponse } from "next/server";
import { getAdminSupabase, youtubeVideoId } from "@/lib/liveAdmin";

export async function GET(request: Request) {
  const club = new URL(request.url).searchParams.get("club");
  if (!club) return NextResponse.json({ streams: [] });

  try {
    const { data, error } = await getAdminSupabase()
      .from("live_streams")
      .select("court,actual_state,youtube_url,heartbeat_at")
      .eq("club", club)
      .eq("actual_state", "live");

    if (error) throw error;

    return NextResponse.json({
      streams: (data || []).flatMap((stream) => {
        const videoId = youtubeVideoId(stream.youtube_url);
        return videoId
          ? [{ court: stream.court, videoId, heartbeat_at: stream.heartbeat_at }]
          : [];
      }),
    });
  } catch {
    return NextResponse.json({ streams: [] });
  }
}
