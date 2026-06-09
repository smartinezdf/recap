"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const statusText: Record<string, string> = {
  button_detected: "Botón detectado",
  processing: "Procesando clip",
  uploaded: "Clip subido",
  buffer_error: "Error de buffer",
  upload_error: "No se pudo subir el clip",
  wifi_error: "Posible problema de internet/WiFi",
  failed: "Error general",
};

const statusEmoji: Record<string, string> = {
  button_detected: "🟡",
  processing: "🟡",
  uploaded: "🟢",
  buffer_error: "🔴",
  upload_error: "🔴",
  wifi_error: "🔴",
  failed: "🔴",
};

function formatVenezuelaTime(date: string) {
  return new Date(date).toLocaleString("es-VE", {
    timeZone: "America/Caracas",
    hour12: true,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ControlClipsPage() {
  const [events, setEvents] = useState<any[]>([]);

  async function loadEvents() {
    const { data, error } = await supabase
      .from("clip_events")
      .select("*")
      .eq("club", "Garana")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error) setEvents(data || []);
  }

  useEffect(() => {
    loadEvents();

    const channel = supabase
      .channel("clip-events-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clip_events",
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Control de Clips</h1>
      <p>Estado en tiempo real de botones y clips.</p>

      {events.map((event) => (
        <div
          key={event.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 14,
            padding: 16,
            marginTop: 14,
            background: "#fff",
          }}
        >
          <h2 style={{ marginBottom: 8 }}>{event.court}</h2>

          <p>
            <b>Estado:</b>{" "}
            {statusEmoji[event.status] || "⚪"}{" "}
            {statusText[event.status] || event.status}
          </p>

          <p>
            <b>Hora Venezuela:</b>{" "}
            {formatVenezuelaTime(event.created_at)}
          </p>

          {event.error_message && (
            <p>
              <b>Error:</b> {event.error_message}
            </p>
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
