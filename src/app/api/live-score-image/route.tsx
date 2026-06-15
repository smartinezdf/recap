import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ACCENT = "#3FCD31";

function clean(v: any) {
  return String(v || "").trim().toLowerCase().replace(/\s+/g, "");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const club = searchParams.get("club") || "";
    const court = searchParams.get("court") || "1";
    const cancha = court.includes("Cancha") ? court : `Cancha ${court}`;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("live_matches")
      .select("*")
      .eq("status", "En juego")
      .order("created_at", { ascending: false });

    if (error) throw new Error(JSON.stringify(error));

    const partido =
      (data || []).find((p: any) => {
        const sameCourt = clean(p.cancha) === clean(cancha);
        const sameClub = club ? clean(p.club).includes(clean(club)) : true;
        return sameCourt && sameClub;
      }) || data?.[0];

    if (!partido) {
      return new ImageResponse(
        (
          <div
            style={{
              width: 700,
              height: 360,
              background: "black",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            NO MATCH FOUND
          </div>
        ),
        { width: 700, height: 360 }
      );
    }

    const sets = partido.sets || [];

    return new ImageResponse(
      (
        <div
          style={{
            width: 700,
            height: 360,
            background: "#050806",
            color: "white",
            display: "flex",
            padding: 20,
            fontFamily: "Arial",
          }}
        >
          <div
            style={{
              width: 660,
              height: 320,
              background: "#111613",
              borderRadius: 28,
              display: "flex",
              flexDirection: "column",
              padding: 22,
            }}
          >
            <div style={{ color: ACCENT, fontSize: 16, fontWeight: 900 }}>
              ● EN JUEGO
            </div>

            <div style={{ fontSize: 34, fontWeight: 900, marginTop: 8 }}>
              {partido.tournament || "Open"}
            </div>

            <div style={{ color: "#a1a1aa", fontSize: 18, marginTop: 4 }}>
              {partido.round || ""} · {partido.cancha || ""}
            </div>

            <div style={{ display: "flex", marginTop: 24, color: "#71717a", fontSize: 14 }}>
              <div style={{ width: 360 }}>EQUIPO</div>
              <div style={{ width: 55 }}>S1</div>
              <div style={{ width: 55 }}>S2</div>
              <div style={{ width: 55 }}>S3</div>
              <div style={{ width: 70, color: ACCENT }}>GAME</div>
            </div>

            <div style={{ display: "flex", marginTop: 12, background: "black", borderRadius: 18, padding: 16, fontSize: 26, fontWeight: 900 }}>
              <div style={{ width: 360, color: partido.serving === "A" ? ACCENT : "white" }}>
                {partido.team_a}
              </div>
              <div style={{ width: 55 }}>{sets[0]?.a || "0"}</div>
              <div style={{ width: 55 }}>{sets[1]?.a || "0"}</div>
              <div style={{ width: 55, color: ACCENT }}>{sets[2]?.a || "-"}</div>
              <div style={{ width: 70, color: ACCENT }}>{partido.game_a || "0"}</div>
            </div>

            <div style={{ display: "flex", marginTop: 10, background: "black", borderRadius: 18, padding: 16, fontSize: 26, fontWeight: 900 }}>
              <div style={{ width: 360, color: partido.serving === "B" ? ACCENT : "white" }}>
                {partido.team_b}
              </div>
              <div style={{ width: 55 }}>{sets[0]?.b || "0"}</div>
              <div style={{ width: 55 }}>{sets[1]?.b || "0"}</div>
              <div style={{ width: 55, color: ACCENT }}>{sets[2]?.b || "-"}</div>
              <div style={{ width: 70, color: ACCENT }}>{partido.game_b || "0"}</div>
            </div>

            <div style={{ marginTop: 16, color: "#a1a1aa", fontSize: 18 }}>
              Sacando:{" "}
              <span style={{ color: "white", fontWeight: 900 }}>
                {partido.serving === "A" ? partido.team_a : partido.team_b}
              </span>
            </div>
          </div>
        </div>
      ),
      { width: 700, height: 360 }
    );
  } catch (err: any) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 700,
            height: 360,
            background: "red",
            color: "white",
            display: "flex",
            padding: 30,
            fontSize: 24,
          }}
        >
          ERROR: {String(err?.message || err)}
        </div>
      ),
      { width: 700, height: 360 }
    );
  }
}
