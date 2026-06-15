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
          width: "760px",
          height: "230px",
          background: "transparent",
          display: "flex",
          padding: "18px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: "680px",
            background: "rgba(18, 24, 20, 0.96)",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
            display: "flex",
            flexDirection: "column",
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              {p?.tournament || "NO MATCH"}
            </div>

            <div
              style={{
                color: ACCENT,
                border: `1px solid ${ACCENT}`,
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              {p?.cancha || ""}
            </div>
          </div>

          <TeamRow
            name={p?.team_a || "-"}
            serving={p?.serving === "A"}
            s1={sets[0]?.a || "0"}
            s2={sets[1]?.a || "0"}
            s3={sets[2]?.a || "-"}
            game={p?.game_a || "0"}
          />

          <TeamRow
            name={p?.team_b || "-"}
            serving={p?.serving === "B"}
            s1={sets[0]?.b || "0"}
            s2={sets[1]?.b || "0"}
            s3={sets[2]?.b || "-"}
            game={p?.game_b || "0"}
          />
        </div>
      </div>
    ),
    {
      width: 760,
      height: 230,
      headers: {
        "Cache-Control": "no-store, no-cache, max-age=0",
      },
    }
  );
}

function TeamRow({
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
        alignItems: "center",
        background: "rgba(5, 8, 6, 0.92)",
        borderRadius: "17px",
        padding: "10px 14px",
        marginTop: 8,
        fontSize: 22,
        fontWeight: 800,
      }}
    >
      <div style={{ width: 380, display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: 15,
            height: 15,
            borderRadius: 999,
            background: serving ? ACCENT : "transparent",
            marginRight: 12,
          }}
        />
        <div>{name}</div>
      </div>

      <div style={{ width: 48, textAlign: "center" }}>{s1}</div>
      <div style={{ width: 48, textAlign: "center" }}>{s2}</div>
      <div style={{ width: 48, textAlign: "center", color: ACCENT }}>{s3}</div>
      <div style={{ width: 58, textAlign: "center", color: ACCENT }}>{game}</div>
    </div>
  );
}


