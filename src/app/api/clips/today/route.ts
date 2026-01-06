import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const court_id = searchParams.get("court_id");

  if (!court_id) {
    return NextResponse.json({ error: "Missing court_id" }, { status: 400 });
  }

  // ✅ Crear el cliente DENTRO del handler (evita crash en build)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Inicio y fin de HOY en hora Caracas
  const now = new Date();
  const startOfDay = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Caracas" })
  );
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("clips")
    .select("id, video_url, created_at")
    .eq("court_id", court_id)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

