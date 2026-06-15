import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ACCENT = "#3FCD31";

function normalize(value: string) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const clubParam = searchParams.get("club") || "";
  const courtParam = searchParams.get("court") || "1";

  const cancha = courtParam.toLowerCase().includes("cancha")
    ? courtParam
    : `Cancha ${courtParam}`;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("live_matches")
    .select("*")
    .eq("status", "En juego")
    .order("created_at", { ascending: false });

  const partido = (data || []).find((p: any) => {
    const sameCourt = normalize(p.cancha) === normalize(cancha);
    const sameClub = clubParam
      ? normalize(p.club).includes(normalize(clubParam))
      : true;

    return sameCourt && sameClub;
  });

  if (!partido) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "700px",
            height: "360px",
            background: "transparent",
            display: "flex",
          }}
        />
      ),
      { width: 700, height: 360 }
    );
  }

  const sets = partido.sets || [];
  const thirdLabel =
    partido.third_set_mode === "Super tiebreak" ? "ST" : "S3";

  const rowA = [
    sets[0]?.a || "0",
    sets[1]?.a || "0",
    sets[2]?.a || "-",
    partido.game_a || "0",
  ];

  const rowB = [
    sets[0]?.b || "0",
    sets[1]?.b || "0",
    sets[2]?.b || "-",
    partido.game_b || "0",
  ];

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
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            width: "664px",
            height: "324px",
            background: "#111613",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: "28px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "98px",
              padding: "18px 22px",
              borderBottom: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  color: ACCENT,
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                }}
              >
                ● EN JUEGO
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 31,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {partido.tournament || "Open"}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 16,
                  color: "#a1a1aa",
                  fontWeight: 500,
                }}
              >
                {partido.category ? `${partido.category} · ` : ""}
                {partido.round || ""}
              </div>
            </div>

            <div
              style={{
                height: 34,
                padding: "7px 14px",
                borderRadius: 999,
                border: `1px solid ${ACCENT}`,
                background: "rgba(63,205,49,0.12)",
                color: ACCENT,
                fontSize: 15,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
              }}
            >
              {partido.cancha}
            </div>
          </div>

          <div
            style={{
              height: 40,
              padding: "0 22px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              color: "#71717a",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 3,
            }}
          >
            <div style={{ width: 390 }}>EQUIPO</div>
            <div style={{ width: 48, textAlign: "center" }}>S1</div>
            <div style={{ width: 48, textAlign: "center" }}>S2</div>
            <div style={{ width: 48, textAlign: "center" }}>{thirdLabel}</div>
            <div style={{ width: 70, textAlign: "center", color: ACCENT }}>
              GAME
            </div>
          </div>

          <ScoreRow
            name={partido.team_a}
            serving={partido.serving === "A"}
            values={rowA}
          />

          <ScoreRow
            name={partido.team_b}
            serving={partido.serving === "B"}
            values={rowB}
          />

          <div
            style={{
              marginTop: 4,
              padding: "0 22px",
              height: 34,
              color: "#a1a1aa",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Sacando:&nbsp;
            <span style={{ color: "white", fontWeight: 900 }}>
              {partido.serving === "A" ? partido.team_a : partido.team_b}
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 700, height: 360 }
  );
}

function ScoreRow({
  name,
  serving,
  values,
}: {
  name: string;
  serving: boolean;
  values: string[];
}) {
  return (
    <div
      style={{
        margin: "10px 16px 0",
        height: 58,
        borderRadius: 22,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        fontSize: 24,
        fontWeight: 900,
      }}
    >
      <div
        style={{
          width: 390,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: serving ? ACCENT : "transparent",
            marginRight: 12,
          }}
        />
        <div>{name}</div>
      </div>

      {values.map((v, i) => (
        <div
          key={i}
          style={{
            width: i === 3 ? 70 : 48,
            textAlign: "center",
            color: i === 3 || i === 2 ? ACCENT : "white",
          }}
        >
          {v}
        </div>
      ))}
    </div>
  );
}
