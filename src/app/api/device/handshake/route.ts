import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // ✅ Crear supabase dentro del handler (evita crash en build)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { device_id, device_key } = await req.json();

    if (!device_id || !device_key) {
      return NextResponse.json(
        { error: "Missing device_id or device_key" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("devices")
      .select("id, club_id, court_id")
      .eq("id", device_id)
      .eq("device_key", device_key)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Invalid device" }, { status: 401 });
    }

    return NextResponse.json({
      device_id: data.id,
      club_id: data.club_id,
      court_id: data.court_id,
      watermark_url: null,
      timezone: "America/Caracas",
      clip_seconds: 45,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
