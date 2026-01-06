import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const name = searchParams.get("name") || "recap.mp4";

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch file", status: res.status },
      { status: 502 }
    );
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type":
        res.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
