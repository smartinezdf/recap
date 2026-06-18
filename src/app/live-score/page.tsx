"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const ACCENT = "#3FCD31";

type Sport = "padel" | "pickleball";

type ScoreClub = {
  name: string;
  sport: Sport;
  logo_url: string;
};

const SCORE_CLUBS: ScoreClub[] = [
  {
    name: "Garana Padel",
    sport: "padel",
    logo_url:
      "https://pub-a24ccb8eb0ea4e87b2bc39e6e975dafc.r2.dev/club-logos/Garana.PNG",
  },
  {
    name: "Upadel",
    sport: "padel",
    logo_url:
      "https://pub-a24ccb8eb0ea4e87b2bc39e6e975dafc.r2.dev/club-logos/Upadel.JPG",
  },
  {
  {
    name: "Llanos Padel Tour",
    sport: "padel",
    logo_url:
      "https://pub-a24ccb8eb0ea4e87b2bc39e6e975dafc.r2.dev/club-logos/Llanos.PNG",
  },
];

type EstadoPartido = "Pendiente" | "En juego" | "Terminado";
type ModoTercerSet = "Tercer set completo" | "Super tiebreak";

type Partido = {
  id: string;
  club: string;
  sport?: Sport;
  cancha: string;
  tournament: string;
  category?: string;
  round: string;
  match_time: string;
  team_a: string;
  team_b: string;
  status: EstadoPartido;
  third_set_mode: ModoTercerSet;
  sets: { a: string; b: string }[];
  game_a: string;
  game_b: string;
  serving: "A" | "B";
  server_number?: number;
  stream_url?: string;
};

const CANCHAS = ["Cancha 1", "Cancha 2", "Cancha 3", "Cancha 4"];

function toNumber(value: string | undefined) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function isSetCompletePadel(set: { a: string; b: string }) {
  const a = toNumber(set.a);
  const b = toNumber(set.b);

  if ((a === 7 && b === 6) || (a === 6 && b === 7)) return true;
  if ((a >= 6 || b >= 6) && Math.abs(a - b) >= 2) return true;

  return false;
}

function isSetCompletePickleball(set: { a: string; b: string }) {
  const a = toNumber(set.a);
  const b = toNumber(set.b);

  return (a >= 11 || b >= 11) && Math.abs(a - b) >= 2;
}

function getActiveSetIndex(partido: Partido) {
  const sport = partido.sport || "padel";

  const index = partido.sets.findIndex((set) =>
    sport === "pickleball"
      ? !isSetCompletePickleball(set)
      : !isSetCompletePadel(set)
  );

  if (index === -1) return partido.sets.length - 1;
  return index;
}

function getPadelThirdLabel(partido: Partido) {
  return partido.third_set_mode === "Super tiebreak" ? "ST" : "S3";
}

export default function LiveScorePage() {
  const [clubSeleccionado, setClubSeleccionado] = useState<ScoreClub | null>(
    null
  );
  const [canchaSeleccionada, setCanchaSeleccionada] = useState("Cancha 1");
  const [verTodas, setVerTodas] = useState(false);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cargando, setCargando] = useState(true);

  const partidosClub = useMemo(
    () =>
      partidos.filter(
        (partido) =>
          !clubSeleccionado ||
          String(partido.club || "").trim() ===
            String(clubSeleccionado.name).trim()
      ),
    [partidos, clubSeleccionado]
  );

  const partidosCancha = useMemo(
    () =>
      partidosClub.filter(
        (partido) =>
          String(partido.cancha || "").trim() ===
          String(canchaSeleccionada).trim()
      ),
    [partidosClub, canchaSeleccionada]
  );

  const partidosMostrados = useMemo(() => {
    const lista = verTodas ? partidosClub : partidosCancha;

    return [...lista].sort((a, b) => {
      const ordenEstado: Record<EstadoPartido, number> = {
        "En juego": 0,
        Pendiente: 1,
        Terminado: 2,
      };

      const estadoA = ordenEstado[a.status] ?? 3;
      const estadoB = ordenEstado[b.status] ?? 3;

      if (estadoA !== estadoB) return estadoA - estadoB;

      return String(a.match_time || "").localeCompare(
        String(b.match_time || "")
      );
    });
  }, [verTodas, partidosClub, partidosCancha]);

  useEffect(() => {
    cargarPartidos();

    const channel = supabase
      .channel("live_matches_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_matches" },
        () => cargarPartidos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function cargarPartidos() {
    setCargando(true);

    const { data, error } = await supabase
      .from("live_matches")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setPartidos((data || []) as Partido[]);
    }

    setCargando(false);
  }

  return (
    <main className="min-h-screen bg-[#050806] text-white">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-xl text-black"
            >
              ☰
            </button>

            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.35em]"
                style={{ color: ACCENT }}
              >
                {clubSeleccionado?.name || "Recap"}
              </p>

              <h1 className="text-2xl font-black text-black">
                Score en Vivo
              </h1>
            </div>
          </div>

          <Link href="/">
            <img src="/RecapLogo.png" alt="Recap" className="h-10 w-auto" />
          </Link>
        </div>

        {menuOpen && (
          <div className="mt-4 border-t border-zinc-200 pt-4">
            <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
              <Link
                className="rounded-2xl bg-zinc-100 p-4 font-bold text-black"
                href="/"
              >
                Clips
              </Link>

              <Link
                className="rounded-2xl bg-zinc-100 p-4 font-bold text-black"
                href="/live-score"
                onClick={() => {
                  setClubSeleccionado(null);
                  setMenuOpen(false);
                  setVerTodas(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Score en Vivo
              </Link>

              <button className="rounded-2xl bg-zinc-100 p-4 text-left font-bold text-zinc-500">
                Streaming · Próximamente
              </button>
            </div>
          </div>
        )}
      </header>

      {!clubSeleccionado && (
        <section className="mx-auto max-w-7xl px-5 py-8">
          <div className="mb-8">
            <h2 className="text-4xl font-black md:text-6xl">
              Selecciona el club
            </h2>

            <p className="mt-2 text-zinc-400">
              Elige el club para ver los partidos y scores en vivo.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {SCORE_CLUBS.map((club) => (
              <button
                key={club.name}
                onClick={() => {
                  setClubSeleccionado(club);
                  setCanchaSeleccionada("Cancha 1");
                  setVerTodas(false);
                }}
                className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 text-left transition hover:border-white/30 hover:bg-white/[0.1]"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={club.logo_url}
                    alt={club.name}
                    className="h-14 w-14 rounded-full object-cover ring-1 ring-white/10"
                  />

                  <div>
                    <p className="text-2xl font-black">{club.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {club.sport === "pickleball"
                        ? "Pickleball Score"
                        : "Padel Score"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {clubSeleccionado && (
        <section className="mx-auto max-w-7xl px-5 py-8">
          <button
            onClick={() => {
              setClubSeleccionado(null);
              setVerTodas(false);
            }}
            className="mb-6 rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-300"
          >
            ← Cambiar club
          </button>

          <div className="mb-6 flex items-center gap-4">
            <img
              src={clubSeleccionado.logo_url}
              alt={clubSeleccionado.name}
              className="h-16 w-16 rounded-full object-cover"
            />

            <div>
              <h2 className="text-4xl font-black md:text-6xl">
                {clubSeleccionado.name}
              </h2>

              <p className="mt-2 text-zinc-400">
                Selecciona la cancha y sigue el score en vivo de los partidos.
              </p>
            </div>
          </div>

          <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.07] p-4">
            <p className="mb-3 text-sm font-bold text-zinc-300">Canchas</p>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {CANCHAS.map((cancha) => {
                const total = partidosClub.filter(
                  (partido) =>
                    String(partido.cancha || "").trim() ===
                    String(cancha).trim()
                ).length;

                const enVivo = partidosClub.filter(
                  (partido) =>
                    String(partido.cancha || "").trim() ===
                      String(cancha).trim() && partido.status === "En juego"
                ).length;

                return (
                  <button
                    key={cancha}
                    onClick={() => {
                      setCanchaSeleccionada(cancha);
                      setVerTodas(false);
                    }}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      !verTodas && canchaSeleccionada === cancha
                        ? "text-black"
                        : "border-white/10 bg-black/30 text-white hover:border-white/40"
                    }`}
                    style={
                      !verTodas && canchaSeleccionada === cancha
                        ? { backgroundColor: ACCENT, borderColor: ACCENT }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-black">{cancha}</p>

                      {enVivo > 0 && (
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: ACCENT }}
                        />
                      )}
                    </div>

                    <p className="text-sm opacity-70">{total} partidos hoy</p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setVerTodas(!verTodas)}
              className={`mt-4 w-full rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                verTodas
                  ? "text-black"
                  : "border-white/10 bg-black/30 text-white hover:border-white/40"
              }`}
              style={
                verTodas
                  ? { backgroundColor: ACCENT, borderColor: ACCENT }
                  : undefined
              }
            >
              {verTodas ? "Viendo todas las canchas" : "Ver todos los scores"}
            </button>
          </div>

          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-2xl font-black">
                {verTodas ? "Todos los scores" : canchaSeleccionada}
              </h3>
              <p className="text-sm text-zinc-400">
                {cargando ? "Cargando..." : "Live Score"}
              </p>
            </div>

            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
              {partidosMostrados.length} partidos
            </span>
          </div>

          {partidosMostrados.length === 0 && !cargando && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-zinc-400">
              No hay score disponible en este momento.
            </div>
          )}

          <div className="grid gap-4">
            {partidosMostrados.map((partido) => (
              <article
                key={partido.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            partido.status === "En juego"
                              ? ACCENT
                              : partido.status === "Pendiente"
                              ? "#FACC15"
                              : "#A1A1AA",
                        }}
                      />

                      <span
                        className="text-xs font-bold uppercase tracking-[0.25em]"
                        style={{ color: ACCENT }}
                      >
                        {partido.status}
                      </span>
                    </div>

                    <h4 className="text-xl font-black md:text-2xl">
                      {partido.tournament}
                    </h4>

                    <p className="text-sm text-zinc-400">
                      {partido.category ? `${partido.category} · ` : ""}
                      {partido.round} · {partido.match_time}
                    </p>
                  </div>

                  <span
                    className="rounded-full border px-4 py-2 text-sm font-bold"
                    style={{
                      borderColor: `${ACCENT}66`,
                      backgroundColor: `${ACCENT}1A`,
                      color: ACCENT,
                    }}
                  >
                    {partido.cancha}
                  </span>
                </div>

                <LiveScoreCard partido={partido} />

                <div className="flex flex-wrap gap-3 border-t border-white/10 p-3">
                  <StreamButton partido={partido} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function LiveScoreCard({ partido }: { partido: Partido }) {
  const sport = partido.sport || "padel";
  const activeSetIndex = getActiveSetIndex(partido);

  const columns =
    sport === "padel"
      ? [
          { label: "S1", index: 0 },
          { label: "S2", index: 1 },
          { label: getPadelThirdLabel(partido), index: 2 },
          { label: "GAME", index: -1 },
        ]
      : [
          { label: "S1", index: 0 },
          { label: "S2", index: 1 },
          { label: "S3", index: 2 },
        ];

  return (
    <div>
      <div
        className={`grid gap-2 border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500 ${
          sport === "padel"
            ? "grid-cols-[1fr_38px_38px_38px_52px]"
            : "grid-cols-[1fr_38px_38px_38px]"
        }`}
      >
        <div>Equipo</div>

        {columns.map((col) => (
          <div
            key={col.label}
            className="text-center"
            style={
              col.index === activeSetIndex || col.index === -1
                ? { color: ACCENT }
                : undefined
            }
          >
            {col.label}
          </div>
        ))}
      </div>

      <div className="space-y-2 p-3">
        <ScoreRow
          sport={sport}
          name={partido.team_a}
          serving={partido.serving === "A"}
          sets={partido.sets.map((s) => s.a)}
          liveGame={partido.game_a}
          activeSetIndex={activeSetIndex}
        />

        <ScoreRow
          sport={sport}
          name={partido.team_b}
          serving={partido.serving === "B"}
          sets={partido.sets.map((s) => s.b)}
          liveGame={partido.game_b}
          activeSetIndex={activeSetIndex}
        />
      </div>

      <div className="border-t border-white/10 px-4 pb-4 text-xs text-zinc-400">
        Sacando:{" "}
        <span className="font-bold text-white">
          {partido.serving === "A" ? partido.team_a : partido.team_b}
        </span>
        {sport === "pickleball" && <> · Servidor {partido.server_number || 1}</>}
      </div>
    </div>
  );
}

function ScoreRow({
  sport,
  name,
  serving,
  sets,
  liveGame,
  activeSetIndex,
}: {
  sport: Sport;
  name: string;
  serving: boolean;
  sets: string[];
  liveGame: string;
  activeSetIndex: number;
}) {
  const values =
    sport === "padel"
      ? [sets[0] ?? "0", sets[1] ?? "0", sets[2] ?? "-", liveGame || "0"]
      : [
          activeSetIndex === 0 ? liveGame || sets[0] || "0" : sets[0] ?? "0",
          activeSetIndex === 1 ? liveGame || sets[1] || "0" : sets[1] ?? "0",
          activeSetIndex === 2 ? liveGame || sets[2] || "0" : sets[2] ?? "0",
        ];

  return (
    <div
      className={`grid items-center gap-2 rounded-2xl bg-black/40 px-3 py-3 text-sm md:text-base ${
        sport === "padel"
          ? "grid-cols-[1fr_38px_38px_38px_52px]"
          : "grid-cols-[1fr_38px_38px_38px]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2 font-black">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: serving ? ACCENT : "transparent" }}
        />
        <span className="truncate">{name}</span>
      </div>

      {values.map((value, index) => {
        const isGameCol = sport === "padel" && index === 3;
        const isActiveSet = index === activeSetIndex;

        return (
          <div
            key={index}
            className="text-center font-black"
            style={isGameCol || isActiveSet ? { color: ACCENT } : undefined}
          >
            {value}
          </div>
        );
      })}
    </div>
  );
}

function getYoutubeEmbedUrl(url?: string) {
  if (!url) return "";

  const normalMatch = url.match(/[?&]v=([^&]+)/);
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  const liveMatch = url.match(/youtube\.com\/live\/([^?&]+)/);
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);

  const videoId =
    normalMatch?.[1] || shortMatch?.[1] || liveMatch?.[1] || embedMatch?.[1];

  if (!videoId) return "";

  return `https://www.youtube.com/embed/${videoId}`;
}

function getYoutubeWatchUrl(url?: string) {
  if (!url) return "";

  const normalMatch = url.match(/[?&]v=([^&]+)/);
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  const liveMatch = url.match(/youtube\.com\/live\/([^?&]+)/);
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);

  const videoId =
    normalMatch?.[1] || shortMatch?.[1] || liveMatch?.[1] || embedMatch?.[1];

  if (!videoId) return url;

  return `https://www.youtube.com/watch?v=${videoId}`;
}

function StreamButton({ partido }: { partido: Partido }) {
  const [open, setOpen] = useState(false);

  const embedUrl = getYoutubeEmbedUrl(partido.stream_url);
  const watchUrl = getYoutubeWatchUrl(partido.stream_url);

  if (!embedUrl) {
    return (
      <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-500">
        Streaming · Próximamente
      </button>
    );
  }

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full border px-4 py-2 text-sm font-bold"
        style={{
          borderColor: "#ef4444",
          color: "#ef4444",
        }}
      >
        {open ? "Cerrar live" : "🔴 Ver en vivo"}
      </button>

      {open && (
        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black">
          <iframe
            src={embedUrl}
            className="aspect-video w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />

          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-t border-white/10 px-4 py-3 text-center text-sm font-bold text-zinc-300"
          >
            Ver en pantalla grande
          </a>
        </div>
      )}
    </div>
  );
}
