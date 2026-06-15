import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "700px",
          height: "360px",
          background: "black",
          color: "white",
          fontSize: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        TEST SCORE IMAGE
      </div>
    ),
    {
      width: 700,
      height: 360,
    }
  );
}
