"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type StreamState = "stopped" | "starting" | "live" | "stopping" | "error";

type Stream = {
  id: string;
  club: string;
  court: string;
  desired_state: "live" | "stopped";
  actual_state: StreamState;
  youtube_url: string | null;
  duration_minutes: number;
  heartbeat_at: string | null;
  started_at: string | null;
  error_message: string | null;
};

const stateLabels: Record<StreamState, string> = {
  stopped: "Detenido",
  starting: "Iniciando",
  live: "En vivo",
  stopping: "Deteniendo",
  error: "Error",
};

function heartbeatLabel(value: string | null) {
  if (!value) return "Pi sin conectar";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 20) return "Pi conectado";
  if (seconds < 60) return `Última señal hace ${seconds}s`;
  return `Última señal hace ${Math.floor(seconds / 60)} min`;
}

export default function AdminLivePage() {
  const [pin, setPin] = useState("");
  const [club, setClub] = useState<string | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadStreams = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    const response = await fetch("/api/live-control", { cache: "no-store" });
    if (response.status === 401) {
      setClub(null);
      setStreams([]);
    } else if (response.ok) {
      const data = await response.json();
      setClub(data.club);
      setStreams(data.streams || []);
    }
    if (!quiet) setLoading(false);
  }, []);

  useEffect(() => {
    loadStreams();
    const timer = window.setInterval(() => loadStreams(true), 5000);
    return () => window.clearInterval(timer);
  }, [loadStreams]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setBusy("login");
    const response = await fetch("/api/live-control/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "PIN incorrecto.");
    else {
      setPin("");
      await loadStreams();
    }
    setBusy(null);
  }

  async function updateStream(stream: Stream, updates: Partial<Stream>) {
    setBusy(stream.id);
    setMessage("");
    const response = await fetch("/api/live-control", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: stream.id, ...updates }),
    });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "No se pudo guardar el cambio.");
    await loadStreams(true);
    setBusy(null);
  }

  async function toggle(stream: Stream) {
    const start = stream.desired_state !== "live";
    if (start && !stream.youtube_url) {
      setMessage(`Agrega primero el enlace de YouTube para ${stream.court}.`);
      return;
    }
    const question = start
      ? `¿Iniciar la transmisión de ${stream.court}?`
      : `¿Detener la transmisión de ${stream.court}?`;
    if (!window.confirm(question)) return;
    await updateStream(stream, { desired_state: start ? "live" : "stopped" });
  }

  async function logout() {
    await fetch("/api/live-control/logout", { method: "POST" });
    setClub(null);
    setStreams([]);
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#090b09] text-white">Cargando…</main>;
  }

  if (!club) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090b09] px-5 text-white">
        <form onSubmit={login} className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#141814] p-7 shadow-2xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3fcd31] text-xl font-black text-black">R</div>
            <div><p className="font-black tracking-tight">ReCap Live</p><p className="text-sm text-zinc-400">Control privado del club</p></div>
          </div>
          <label className="text-sm font-semibold text-zinc-300" htmlFor="pin">PIN del club</label>
          <input id="pin" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-center text-2xl tracking-[0.35em] outline-none focus:border-[#3fcd31]" placeholder="••••" />
          {message && <p className="mt-3 text-sm text-red-400">{message}</p>}
          <button disabled={busy === "login"} className="mt-5 w-full rounded-2xl bg-[#3fcd31] py-4 font-black text-black disabled:opacity-50">{busy === "login" ? "Entrando…" : "Entrar"}</button>
          <Link href="/live-score" className="mt-5 block text-center text-sm text-zinc-400 hover:text-white">Volver a resultados</Link>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090b09] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#090b09]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3fcd31]">ReCap Live</p><h1 className="text-lg font-black">{club}</h1></div>
          <div className="flex gap-2"><Link href="/live-score" className="rounded-xl border border-white/15 px-3 py-2 text-sm font-bold">Ver público</Link><button onClick={logout} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">Salir</button></div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6"><h2 className="text-2xl font-black">Transmisiones</h2><p className="mt-1 text-sm text-zinc-400">La orden llega a la Raspberry Pi en aproximadamente 5 segundos.</p></div>
        {message && <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{message}</div>}
        <div className="grid gap-5 md:grid-cols-2">
          {streams.map((stream) => {
            const on = stream.desired_state === "live";
            const connected = !!stream.heartbeat_at && Date.now() - new Date(stream.heartbeat_at).getTime() < 30000;
            return (
              <article key={stream.id} className="rounded-3xl border border-white/10 bg-[#141814] p-5 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="text-xl font-black">{stream.court}</h3><p className={`mt-1 text-sm ${connected ? "text-[#72df68]" : "text-amber-400"}`}>{heartbeatLabel(stream.heartbeat_at)}</p></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${stream.actual_state === "live" ? "bg-red-500 text-white" : stream.actual_state === "error" ? "bg-amber-400 text-black" : "bg-white/10 text-zinc-300"}`}>{stateLabels[stream.actual_state]}</span>
                </div>

                <label className="mt-6 block text-sm font-semibold text-zinc-300">Enlace del directo en YouTube</label>
                <input defaultValue={stream.youtube_url || ""} disabled={on} onBlur={(event) => { if (event.target.value.trim() !== (stream.youtube_url || "")) updateStream(stream, { youtube_url: event.target.value.trim() }); }} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm outline-none focus:border-[#3fcd31] disabled:opacity-50" placeholder="https://youtube.com/live/…" />

                <div className="mt-4 flex items-center gap-3">
                  <label className="text-sm text-zinc-300" htmlFor={`duration-${stream.id}`}>Duración</label>
                  <select id={`duration-${stream.id}`} value={stream.duration_minutes} disabled={on} onChange={(e) => updateStream(stream, { duration_minutes: Number(e.target.value) })} className="rounded-xl border border-white/10 bg-black px-3 py-2 text-sm">
                    <option value={60}>1 hora</option><option value={120}>2 horas</option><option value={240}>4 horas</option><option value={480}>8 horas</option><option value={720}>12 horas</option>
                  </select>
                </div>

                {stream.error_message && <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-300">{stream.error_message}</p>}
                <button disabled={busy === stream.id} onClick={() => toggle(stream)} className={`mt-6 w-full rounded-2xl py-4 text-base font-black transition disabled:opacity-50 ${on ? "bg-red-500 text-white" : "bg-[#3fcd31] text-black"}`}>{busy === stream.id ? "Guardando…" : on ? "Detener transmisión" : "Iniciar transmisión"}</button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
