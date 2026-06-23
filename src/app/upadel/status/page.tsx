import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export default async function UpadelStatusPage() {
  const { data, error } = await supabase
    .from("device_heartbeats")
    .select("*")
    .eq("device_name", "upadel")
    .single();

  if (error || !data) {
    return <main style={{ padding: 24 }}>No se encontró el dispositivo.</main>;
  }

  const lastSeen = new Date(data.last_seen).getTime();
  const isOnline = Date.now() - lastSeen < 2 * 60 * 1000;

  return (
    <main style={{ padding: 24, fontFamily: "Arial" }}>
      <h1>Upadel - Estado del sistema</h1>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
        <h2>Cancha 1</h2>

        <p style={{ fontSize: 24 }}>
          {isOnline ? "🟢 Pi conectado" : "🔴 Pi desconectado"}
        </p>

        <p>Dispositivo: {data.device_name}</p>
        <p>Última señal: {new Date(data.last_seen).toLocaleString("es-VE")}</p>
      </div>
    </main>
  );
}
