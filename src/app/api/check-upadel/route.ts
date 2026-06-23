import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: device, error } = await supabase
    .from("device_heartbeats")
    .select("*")
    .eq("club", "upadel")
    .single();

  if (error || !device) {
    return Response.json({ error: "No se encontró Upadel" }, { status: 500 });
  }

  const lastSeen = new Date(device.last_seen).getTime();
  const isOffline = Date.now() - lastSeen > 2 * 60 * 1000;

  const lastSeenFormatted = new Date(device.last_seen).toLocaleString("es-VE", {
    timeZone: "America/Caracas",
    dateStyle: "short",
    timeStyle: "medium",
  });

  if (isOffline && !device.alert_sent) {
    await resend.emails.send({
      from: process.env.ALERT_FROM_EMAIL!,
      to: process.env.UPADEL_ALERT_EMAIL!,
      subject: "🔴 Alerta Recap - Sistema desconectado",
      html: `
        <h2>🔴 Sistema desconectado</h2>
        <p>El sistema de Recap en Upadel aparece desconectado.</p>
        <p><strong>Cancha:</strong> ${device.court}</p>
        <p><strong>Dispositivo:</strong> ${device.device_name}</p>
        <p><strong>Última señal:</strong> ${lastSeenFormatted}</p>
        <p>Esto puede indicar que el Raspberry Pi está apagado, sin internet o con un problema de conexión.</p>
      `,
    });

    await supabase
      .from("device_heartbeats")
      .update({ alert_sent: true, status: "offline" })
      .eq("id", device.id);
  }

  if (!isOffline && device.alert_sent) {
    await supabase
      .from("device_heartbeats")
      .update({ alert_sent: false, status: "online" })
      .eq("id", device.id);
  }

  return Response.json({ ok: true, isOffline });
}
