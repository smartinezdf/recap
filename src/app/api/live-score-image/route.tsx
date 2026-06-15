import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("live_matches")
    .select("*")
    .limit(1);

  const partido = data?.[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: "700px",
          height: "360px",
          background: "#111613",
          color: "white",
          display: "flex",
          flexDirection: "column",
          padding: "30px",
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
          }}
        >
          {partido?.tournament}
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 28,
          }}
        >
          {partido?.team_a}
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 28,
          }}
        >
          {partido?.team_b}
        </div>
      </div>
    ),
    {
      width: 700,
      height: 360,
    }
  );
}
