import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const statusText: any = {
  button_detected: "Botón detectado",
  processing: "Procesando clip",
  uploaded: "Clip subido",
  buffer_error: "Error de buffer",
  upload_error: "No se pudo subir",
  wifi_error: "Posible problema de internet/WiFi",
  failed: "Error general",
};

export default async function ControlClipsPage() {
  const { data } = await supabase
    .from("clip_events")
    .select("*")
    .eq("club", "Garana")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main style={{ padding: 24 }}>
      <h1>Control de Clips</h1>
      <p>Estado reciente de botones y clips.</p>

      {data?.map((event) => (
        <div
          key={event.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            marginTop: 12,
          }}
        >
          <h2>{event.court}</h2>
          <p><b>Estado:</b> {statusText[event.status] || event.status}</p>
          <p><b>Hora:</b> {new Date(event.created_at).toLocaleString()}</p>

          {event.error_message && (
            <p><b>Error:</b> {event.error_message}</p>
          )}

          {event.clip_url && (
            <a href={event.clip_url} target="_blank">
              Ver clip
            </a>
          )}
        </div>
      ))}
    </main>
  );
}
