import { NextResponse } from "next/server";
import { getAdminSupabase, isDeviceAuthorized } from "@/lib/liveAdmin";

export async function GET(request: Request) {
  if (!isDeviceAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const device = new URL(request.url).searchParams.get("device");
  if (!device) return NextResponse.json({ error: "Falta device." }, { status: 400 });

  const { data, error } = await getAdminSupabase()
    .from("live_streams")
    .select("id,club,court,device_name,desired_state,duration_minutes,updated_at")
    .eq("device_name", device);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ streams: data || [] });
}

export async function POST(request: Request) {
  if (!isDeviceAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    device_name?: string;
    actual_state?: "stopped" | "starting" | "live" | "stopping" | "error";
    started_at?: string | null;
    error_message?: string | null;
  };

  if (!body.id || !body.device_name || !body.actual_state) {
    return NextResponse.json({ error: "Heartbeat incompleto." }, { status: 400 });
  }

  const { data, error } = await getAdminSupabase()
    .from("live_streams")
    .update({
      actual_state: body.actual_state,
      heartbeat_at: new Date().toISOString(),
      started_at: body.started_at ?? undefined,
      error_message: body.error_message ?? null,
    })
    .eq("id", body.id)
    .eq("device_name", body.device_name)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stream: data });
}
