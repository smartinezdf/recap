import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function UpadelStatusPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <main style={{ padding: 24 }}>
        Faltan variables de Supabase.
      </main>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("device_heartbeats")
    .select("*")
    .eq("club", "upadel")
    .single();

  if (error || !data) {
    return (
      <main style={{ padding: 24 }}>
        No se encontró información de Upadel.
      </main>
    );
  }

  const lastSeen = new Date(data.last_seen).getTime();
  const now = Date.now();

  const isOnline = now - lastSeen < 2 * 60 * 1000;

  const lastSeenFormatted = new Date(data.last_seen).toLocaleString(
    "es-VE",
    {
      timeZone: "America/Caracas",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }
  );

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "Arial, sans-serif",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h1>Upadel - Estado del sistema</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 20,
          marginTop: 20,
        }}
      >
        <h2>Cancha 1</h2>

        <p
          style={{
            fontSize: 24,
            fontWeight: "bold",
          }}
        >
          {isOnline ? "🟢 Pi conectado" : "🔴 Pi desconectado"}
        </p>

        <p>
          <strong>Dispositivo:</strong> {data.device_name}
        </p>

        <p>
          <strong>Última señal:</strong> {lastSeenFormatted}
        </p>

        <p>
          <strong>Estado:</strong> {data.status}
        </p>
      </div>
    </main>
  );
}
