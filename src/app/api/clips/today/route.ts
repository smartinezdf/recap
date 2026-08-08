```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courtId = searchParams.get("court_id");

    if (!courtId) {
      return NextResponse.json(
        { error: "Missing court_id" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        {
          error:
            "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    /*
      Obtener la fecha actual en Caracas.

      Ejemplo:
      2026-08-07

      Luego construimos explícitamente:
      2026-08-07T00:00:00-04:00
      2026-08-07T23:59:59.999-04:00

      Esto evita depender del timezone del servidor de Vercel.
    */
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Caracas",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const todayCaracas = formatter.format(new Date());

    const startOfDay = new Date(
      `${todayCaracas}T00:00:00.000-04:00`
    );

    const endOfDay = new Date(
      `${todayCaracas}T23:59:59.999-04:00`
    );

    const { data, error } = await supabase
      .from("clips")
      .select(`
        id,
        club_id,
        court_id,
        device_id,
        video_url,
        storage_path,
        created_at,
        expires_at
      `)
      .eq("court_id", courtId)
      .gte("created_at", startOfDay.toISOString())
      .lte("created_at", endOfDay.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase clips error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("GET /api/clips/today error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```
