import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACCENT = "#3FCD31";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("live_matches")
    .select("*")
    .eq("status", "En juego")
    .order("created_at", { ascending: false })
    .limit(1);

  const p = data?.[0];
  const sets = p?.sets || [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "700px",
          height: "360px",
          background: "transparent",
          display: "flex",
          padding: "18px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: "664px",
            height: "324px",
            background: "#111613",
            borderRadius: "28px",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "18px 22px",
              borderBottom: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  color: ACCENT,
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 4,
                }}
              >
                ● EN JUEGO
              </div>

              <div
                style={{
                  display: "flex",
                  marginTop: 7,
                  fontSize: 31,
                  fontWeight: 900,
                }}
              >
                {p?.tournament || "NO MATCH"}
              </div>

              <div
                style={{
                  display: "flex",
                  marginTop: 4,
                  fontSize: 16,
                  color: "#a1a1aa",
                }}
              >
                {p ? `${p.round || ""} · ${p.cancha || ""}` : "No hay partido"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                height: 32,
                padding: "7px 14px",
                borderRadius: 999,
                border: `1px solid ${ACCENT}`,
                color: ACCENT,
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              {p?.cancha || ""}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              padding: "12px 20px 8px",
              color: "#71717a",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 3,
            }}
          >
            <div style={{ display: "flex", width: 380 }}>EQUIPO</div>
            <div style={{ display: "flex", width: 48 }}>S1</div>
            <div style={{ display: "flex", width: 48 }}>S2</div>
            <div style={{ display: "flex", width: 48 }}>S3</div>
            <div style={{ display: "flex", width: 70, color: ACCENT }}>GAME</div>
          </div>

          <ScoreRow
            name={p?.team_a || "-"}
            serving={p?.serving === "A"}
            s1={sets[0]?.a || "0"}
            s2={sets[1]?.a || "0"}
            s3={sets[2]?.a || "-"}
            game={p?.game_a || "0"}
          />

          <ScoreRow
            name={p?.team_b || "-"}
            serving={p?.serving === "B"}
            s1={sets[0]?.b || "0"}
            s2={sets[1]?.b || "0"}
            s3={sets[2]?.b || "-"}
            game={p?.game_b || "0"}
          />

          <div
            style={{
              display: "flex",
              marginTop: 6,
              padding: "0 22px",
              fontSize: 16,
              color: "#a1a1aa",
            }}
          >
            Sacando:{" "}
            <span style={{ color: "white", fontWeight: 900 }}>
              {p?.serving === "A" ? p?.team_a : p?.team_b}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 700,
      height: 360,
      headers: { "Cache-Control": "no-store, no-cache, max-age=0" },
    }
  );
}

function ScoreRow({
  name,
  serving,
  s1,
  s2,
  s3,
  game,
}: {
  name: string;
  serving: boolean;
  s1: string;
  s2: string;
  s3: string;
  game: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        margin: "8px 16px 0",
        padding: "14px 16px",
        borderRadius: "22px",
        background: "rgba(0,0,0,0.48)",
        fontSize: 25,
        fontWeight: 900,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", width: 380, alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            width: 13,
            height: 13,
            borderRadius: 999,
            background: serving ? ACCENT : "transparent",
            marginRight: 12,
          }}
        />
        <div style={{ display: "flex" }}>{name}</div>
      </div>

      <div style={{ display: "flex", width: 48 }}>{s1}</div>
      <div style={{ display: "flex", width: 48 }}>{s2}</div>
      <div style={{ display: "flex", width: 48, color: ACCENT }}>{s3}</div>
      <div style={{ display: "flex", width: 70, color: ACCENT }}>{game}</div>
    </div>
  );
}
