import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ACCENT = "#3FCD31";

type Partido = {
  club: string;
  cancha: string;
  tournament: string;
  category?: string;
  round: string;
  team_a: string;
  team_b: string;
  status: string;
  third_set_mode: string;
  sets: { a: string; b: string }[];
  game_a: string;
  game_b: string;
  serving: "A" | "B";
};

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

  const partido = (data || []).find((p: Partido) => {
    const sameCourt = normalize(p.cancha) === normalize(cancha);

    const sameClub = clubParam
      ? normalize(p.club).includes(normalize(clubParam))
      : true;

    return sameCourt && sameClub;
  }) as Partido | undefined;

  if (!partido) {
    return new ImageResponse(<div style={{ width: 700, height: 360 }} />, {
      width: 700,
      height: 360,
    });
  }

  const sets = partido.sets || [];
  const thirdLabel =
    partido.third_set_mode === "Super tiebreak" ? "ST" : "S3";

  return new ImageResponse(
    (
      <div
        style={{
          width: "700px",
          height: "360px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          background: "transparent",
          padding: "20px",
          color: "white",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            width: "640px",
            borderRadius: "28px",
            background: "rgba(17,22,19,0.95)",
            border: "1px solid rgba(255,255,255,0.12)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "20px",
              borderBottom: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  color: ACCENT,
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                }}
              >
                ● EN JUEGO
              </div>

              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  marginTop: 6,
                  lineHeight: 1,
                }}
              >
                {partido.tournament}
              </div>

              <div
                style={{
                  fontSize: 18,
                  color: "#a1a1aa",
                  marginTop: 8,
                }}
              >
                {partido.category ? `${partido.category} · ` : ""}
                {partido.round}
              </div>
            </div>

            <div
              style={{
                color: ACCENT,
                border: `1px solid ${ACCENT}`,
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              {partido.cancha}
            </div>
          </div>

          <div
            style={{
              padding: "12px 18px",
              display: "grid",
              gridTemplateColumns: "1fr 50px 50px 50px 70px",
              color: "#71717a",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 3,
            }}
          >
            <div>EQUIPO</div>
            <div>S1</div>
            <div>S2</div>
            <div>{thirdLabel}</div>
            <div style={{ color: ACCENT }}>GAME</div>
          </div>

          <ScoreRow
            name={partido.team_a}
            serving={partido.serving === "A"}
            values={[
              sets[0]?.a || "0",
              sets[1]?.a || "0",
              sets[2]?.a || "-",
              partido.game_a || "0",
            ]}
          />

          <ScoreRow
            name={partido.team_b}
            serving={partido.serving === "B"}
            values={[
              sets[0]?.b || "0",
              sets[1]?.b || "0",
              sets[2]?.b || "-",
              partido.game_b || "0",
            ]}
          />

          <div
            style={{
              padding: "14px 20px 18px",
              color: "#a1a1aa",
              fontSize: 18,
              borderTop: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            Sacando:{" "}
            <span style={{ color: "white", fontWeight: 900 }}>
              {partido.serving === "A" ? partido.team_a : partido.team_b}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 700,
      height: 360,
    }
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
        margin: "0 16px 10px",
        padding: "16px",
        borderRadius: "22px",
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        gridTemplateColumns: "1fr 50px 50px 50px 70px",
        alignItems: "center",
        fontSize: 25,
        fontWeight: 900,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: serving ? ACCENT : "transparent",
          }}
        />
        <div>{name}</div>
      </div>

      {values.map((v, i) => (
        <div key={i} style={{ color: i === 3 ? ACCENT : "white" }}>
          {v}
        </div>
      ))}
    </div>
  );
}
