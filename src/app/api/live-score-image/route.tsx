import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ACCENT = "#3FCD31";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("live_matches")
    .select("*")
    .eq("status", "En juego")
    .order("created_at", { ascending: false })
    .limit(1);

  const p = data?.[0];

  if (error || !p) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 700,
            height: 360,
            background: "black",
            color: "white",
            display: "flex",
            fontSize: 32,
            padding: 30,
          }}
        >
          NO MATCH
        </div>
      ),
      { width: 700, height: 360 }
    );
  }

  const sets = p.sets || [];

  return new ImageResponse(
    (
      <div
        style={{
          width: 700,
          height: 360,
          background: "#050806",
          color: "white",
          display: "flex",
          flexDirection: "column",
          padding: 28,
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", color: ACCENT, fontSize: 18 }}>
          ● EN JUEGO
        </div>

        <div style={{ display: "flex", fontSize: 38, fontWeight: 900 }}>
          {p.tournament}
        </div>

        <div style={{ display: "flex", color: "#a1a1aa", fontSize: 20 }}>
          {p.round} · {p.cancha}
        </div>

        <div style={{ display: "flex", marginTop: 28, fontSize: 18, color: "#71717a" }}>
          <div style={{ display: "flex", width: 360 }}>EQUIPO</div>
          <div style={{ display: "flex", width: 55 }}>S1</div>
          <div style={{ display: "flex", width: 55 }}>S2</div>
          <div style={{ display: "flex", width: 55 }}>S3</div>
          <div style={{ display: "flex", width: 70, color: ACCENT }}>GAME</div>
        </div>

        <div style={{ display: "flex", marginTop: 14, fontSize: 28, fontWeight: 900 }}>
          <div style={{ display: "flex", width: 360 }}>{p.team_a}</div>
          <div style={{ display: "flex", width: 55 }}>{sets[0]?.a || "0"}</div>
          <div style={{ display: "flex", width: 55 }}>{sets[1]?.a || "0"}</div>
          <div style={{ display: "flex", width: 55, color: ACCENT }}>{sets[2]?.a || "-"}</div>
          <div style={{ display: "flex", width: 70, color: ACCENT }}>{p.game_a || "0"}</div>
        </div>

        <div style={{ display: "flex", marginTop: 12, fontSize: 28, fontWeight: 900 }}>
          <div style={{ display: "flex", width: 360 }}>{p.team_b}</div>
          <div style={{ display: "flex", width: 55 }}>{sets[0]?.b || "0"}</div>
          <div style={{ display: "flex", width: 55 }}>{sets[1]?.b || "0"}</div>
          <div style={{ display: "flex", width: 55, color: ACCENT }}>{sets[2]?.b || "-"}</div>
          <div style={{ display: "flex", width: 70, color: ACCENT }}>{p.game_b || "0"}</div>
        </div>

        <div style={{ display: "flex", marginTop: 28, fontSize: 20, color: "#a1a1aa" }}>
          Sacando: {p.serving === "A" ? p.team_a : p.team_b}
        </div>
      </div>
    ),
    { width: 700, height: 360 }
  );
}
