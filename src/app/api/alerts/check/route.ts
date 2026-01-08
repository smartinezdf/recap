import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

type HBRow = {
  device_key: string;
  ts: string;
  camera_ok: boolean | null;
  buffer_ok: boolean | null;
  button_ok: boolean | null;
  last_segment_age_sec: number | null;
  disk_free_gb: number | null;
  cpu_temp_c: number | null;
  notes: string | null;
};

function minutesAgo(tsIso: string) {
  const ageMs = Date.now() - new Date(tsIso).getTime();
  return Math.max(0, Math.floor(ageMs / 60000));
}

async function sendEmail(subject: string, html: string) {
  const to = ["smartinezdf@gmail.com"]; // cambia aquí si luego agregas admins
  const from = "Recap Alerts <onboarding@resend.dev>";

  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) console.error("Resend error:", error);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // 🔐 protección
  const key = searchParams.get("key");
  if (key !== process.env.ALERT_CRON_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const OFFLINE_MIN = 10;

  // 1) traer último heartbeat por device (tu view)
  const { data, error } = await supabase
    .from("latest_device_heartbeat")
    .select(
      "device_key, ts, camera_ok, buffer_ok, button_ok, last_segment_age_sec, disk_free_gb, cpu_temp_c, notes"
    );

  if (error) return new Response("Supabase error", { status: 500 });

  const rows = ((data as HBRow[]) || []).sort((a, b) =>
    a.device_key.localeCompare(b.device_key)
  );

  // 2) para cada device, comparar con el estado guardado y alertar SOLO si cambió
  for (const r of rows) {
    const min = minutesAgo(r.ts);
    const isOfflineNow = min > OFFLINE_MIN;

    // lee estado previo
    const { data: prev } = await supabase
      .from("device_status_state")
      .select("device_key, last_is_offline, last_alerted_state")
      .eq("device_key", r.device_key)
      .maybeSingle();

    const wasOffline = prev?.last_is_offline ?? false;

    // si cambió de ONLINE -> OFFLINE
    if (!wasOffline && isOfflineNow) {
      await sendEmail(
        `🔴 Recap OFFLINE: ${r.device_key}`,
        `
          <h2>🔴 Device OFFLINE</h2>
          <p><b>${r.device_key}</b> no ha enviado heartbeat en <b>${min} min</b>.</p>
          <p>Último heartbeat: ${r.ts}</p>
          <p>Umbral offline: > ${OFFLINE_MIN} min</p>
        `
      );

      // guarda estado
      await supabase.from("device_status_state").upsert({
        device_key: r.device_key,
        last_seen_ts: r.ts,
        last_is_offline: true,
        last_alerted_at: new Date().toISOString(),
        last_alerted_state: "offline",
        updated_at: new Date().toISOString(),
      });
    }

    // si cambió de OFFLINE -> ONLINE (back online)
    if (wasOffline && !isOfflineNow) {
      await sendEmail(
        `🟢 Recap BACK ONLINE: ${r.device_key}`,
        `
          <h2>🟢 Device BACK ONLINE</h2>
          <p><b>${r.device_key}</b> volvió a estar online.</p>
          <p>Heartbeat reciente: <b>${min} min</b> ago</p>
          <p>Último heartbeat: ${r.ts}</p>
        `
      );

      await supabase.from("device_status_state").upsert({
        device_key: r.device_key,
        last_seen_ts: r.ts,
        last_is_offline: false,
        last_alerted_at: new Date().toISOString(),
        last_alerted_state: "online",
        updated_at: new Date().toISOString(),
      });
    }

    // si no cambió, igual actualizamos last_seen_ts sin alertar
    if (!prev) {
      await supabase.from("device_status_state").upsert({
        device_key: r.device_key,
        last_seen_ts: r.ts,
        last_is_offline: isOfflineNow,
        updated_at: new Date().toISOString(),
      });
    } else {
      await supabase.from("device_status_state").upsert({
        device_key: r.device_key,
        last_seen_ts: r.ts,
        last_is_offline: isOfflineNow,
        updated_at: new Date().toISOString(),
      });
    }
  }

  // 3) (opcional) devolver HTML bonito o JSON
  // Para no romper tu panel, devolvemos un HTML simple de confirmación:
  return new Response(
    `OK: checked ${rows.length} devices @ ${new Date().toISOString()}`,
    { headers: { "Content-Type": "text/plain" }, status: 200 }
  );
}
