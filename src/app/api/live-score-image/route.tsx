import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("live_matches")
    .select("*")
    .limit(1);

  return new ImageResponse(
    (
      <div
        style={{
          width: "700px",
          height: "360px",
          background: "black",
          color: "white",
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          fontSize: "20px",
        }}
      >
        <div>DEBUG MODE</div>

        <div style={{ marginTop: "20px" }}>
          ERROR:
        </div>

        <div style={{ fontSize: "14px" }}>
          {JSON.stringify(error)}
        </div>

        <div style={{ marginTop: "20px" }}>
          ROWS:
        </div>

        <div>
          {String(data?.length || 0)}
        </div>

        <div style={{ marginTop: "20px" }}>
          FIRST RECORD:
        </div>

        <div style={{ fontSize: "12px" }}>
          {JSON.stringify(data?.[0] || {})}
        </div>
      </div>
    ),
    {
      width: 700,
      height: 360,
    }
  );
}
