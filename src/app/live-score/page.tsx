"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const ACCENT = "#3FCD31";
const DARK = "#111411";
const SOFT_BG = "#F3F3F1";

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
    name: "Saque Padel Club",
    sport: "padel",
    logo_url:
      "https://pub-a24ccb8eb0ea4e87b2bc39e6e975dafc.r2.dev/club-logos/Blanco%20con%20verde%20PNG.png",
  },
];

type EstadoPartido = "Pendiente" | "En juego" | "Terminado";
type ModoTercerSet = "Tercer set completo" | "Super tiebreak";
type FiltroEstado = "Todos" | "En juego" | "Pendiente" | "Terminado";

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

  if ((a >= 6 || b >= 6) && Math.abs(a - b) >= 2) {
    return true;
  }

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

  if (index === -1) {
    return partido.sets.length - 1;
  }

  return index;
}

function getPadelThirdLabel(partido: Partido) {
  return partido.third_set_mode === "Super tiebreak" ? "ST" : "S3";
}

/* =========================================
   CLUB LOGO
========================================= */

function ClubLogo({
  club,
}: {
  club: ScoreClub;
}) {
  /*
   * UPADEL
   * Imagen completa, sin fondo negro visible.
   */
  if (club.name === "Upadel") {
    return (
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[1.35rem] border border-zinc-200 bg-white sm:h-28 sm:w-28">
        <img
          src={club.logo_url}
          alt={club.name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  /*
   * GARANA
   * Fondo negro + logo más grande.
   */
  if (club.name === "Garana Padel") {
    return (
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] bg-black sm:h-28 sm:w-28">
        <img
          src={club.logo_url}
          alt={club.name}
          className="h-full w-full scale-[1.08] object-contain"
        />
      </div>
    );
  }

  /*
   * SAQUE
   * Se mantiene con fondo negro y padding.
   */
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] bg-black p-4 sm:h-28 sm:w-28 sm:p-5">
      <img
        src={club.logo_url}
        alt={club.name}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}

/* =========================================
   MAIN PAGE
========================================= */

export default function LiveScorePage() {
  const [clubSeleccionado, setClubSeleccionado] =
    useState<ScoreClub | null>(null);

  const [canchaSeleccionada, setCanchaSeleccionada] =
    useState<string | null>(null);

  const [filtroEstado, setFiltroEstado] =
    useState<FiltroEstado>("Todos");

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cargando, setCargando] = useState(true);

  /*
   * PARTIDOS DEL CLUB
   */
  const partidosClub = useMemo(() => {
    return partidos.filter(
      (partido) =>
        !clubSeleccionado ||
        String(partido.club || "").trim() ===
          String(clubSeleccionado.name).trim()
    );
  }, [partidos, clubSeleccionado]);

  /*
   * PARTIDOS FILTRADOS
   */
  const partidosMostrados = useMemo(() => {
    let lista = [...partidosClub];

    if (filtroEstado !== "Todos") {
      lista = lista.filter(
        (partido) => partido.status === filtroEstado
      );
    }

    if (canchaSeleccionada) {
      lista = lista.filter(
        (partido) =>
          String(partido.cancha || "").trim() ===
          String(canchaSeleccionada).trim()
      );
    }

    return lista.sort((a, b) => {
      const ordenEstado: Record<EstadoPartido, number> = {
        "En juego": 0,
        Pendiente: 1,
        Terminado: 2,
      };

      const estadoA = ordenEstado[a.status] ?? 3;
      const estadoB = ordenEstado[b.status] ?? 3;

      if (estadoA !== estadoB) {
        return estadoA - estadoB;
      }

      return String(a.match_time || "").localeCompare(
        String(b.match_time || "")
      );
    });
  }, [partidosClub, canchaSeleccionada, filtroEstado]);

  async function cargarPartidos() {
    setCargando(true);

    const { data, error } = await supabase
      .from("live_matches")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setPartidos((data || []) as Partido[]);
    }

    setCargando(false);
  }

  /*
   * SUPABASE REALTIME
   */
  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void cargarPartidos();
    }, 0);

    const channel = supabase
      .channel("live_matches_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_matches",
        },
        () => cargarPartidos()
      )
      .subscribe();

    return () => {
      window.clearTimeout(initialLoad);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main
      className="min-h-screen text-[#111411]"
      style={{
        backgroundColor: SOFT_BG,
      }}
    >
      {/* =====================================
          HEADER
      ====================================== */}

      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Recap home">
            <img
              src="/RecapLogo.png"
              alt="Recap"
              className="h-9 w-auto object-contain sm:h-10"
            />
          </Link>

          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              {clubSeleccionado?.name || "Recap"}
            </p>
            <h1 className="text-sm font-medium text-zinc-950 sm:text-base">Live Score</h1>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid h-9 w-9 place-items-center rounded-full text-zinc-950 transition hover:bg-zinc-100"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* MENU */}

        {menuOpen && (
          <div className="border-t border-zinc-200 bg-white">
            <div className="mx-auto grid max-w-6xl gap-1.5 px-4 py-3 sm:px-6 md:grid-cols-2">
              <Link
                className="rounded-2xl px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                href="/"
              >
                Página principal
              </Link>

              <Link
                className="rounded-2xl px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                href="/live-score"
                onClick={() => {
                  setClubSeleccionado(null);
                  setMenuOpen(false);
                  setCanchaSeleccionada(null);
                  setFiltroEstado("Todos");
                }}
              >
                Score en Vivo
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =====================================
          CLUB SELECTION
      ====================================== */}

      {!clubSeleccionado && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-9">
            <p
              className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] sm:text-xs"
              style={{
                color: ACCENT,
              }}
            >
              RECAP LIVE
            </p>

            <h2 className="text-4xl font-normal tracking-[-0.035em] sm:text-5xl md:text-6xl">
              Selecciona el club
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500 sm:text-base">
              Sigue los partidos y resultados en vivo.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {SCORE_CLUBS.map((club) => (
              <button
                key={club.name}
                onClick={() => {
                  setClubSeleccionado(club);
                  setCanchaSeleccionada(null);
                  setFiltroEstado("Todos");
                }}
                className="group rounded-[1.6rem] border border-zinc-200 bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 sm:p-5"
              >
                <div className="flex items-center gap-4">
                  <ClubLogo club={club} />

                  <div className="min-w-0">
                    <p className="text-lg font-medium leading-tight tracking-[-0.02em] text-zinc-950 sm:text-xl">
                      {club.name}
                    </p>

                    <p className="mt-2 text-xs font-normal text-zinc-400 sm:text-sm">
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

      {/* =====================================
          SELECTED CLUB
      ====================================== */}

      {clubSeleccionado && (
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
          {/* CLUB CARD */}

          <div className="mb-6 rounded-[1.6rem] border border-zinc-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <ClubLogo club={clubSeleccionado} />

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-medium leading-tight tracking-[-0.025em] text-zinc-950 sm:text-2xl">
                  {clubSeleccionado.name}
                </h2>
              </div>

              <button
                onClick={() => {
                  setClubSeleccionado(null);
                  setCanchaSeleccionada(null);
                  setFiltroEstado("Todos");
                }}
                className="shrink-0 rounded-full border border-zinc-200 px-4 py-2 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-50 sm:text-xs"
              >
                Cambiar
              </button>
            </div>
          </div>

          {/* =====================================
              STATUS FILTERS
          ====================================== */}

          <div className="mb-3">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {(
                [
                  "Todos",
                  "En juego",
                  "Pendiente",
                  "Terminado",
                ] as FiltroEstado[]
              ).map((estado) => {
                const active =
                  filtroEstado === estado &&
                  canchaSeleccionada === null;

                return (
                  <button
                    key={estado}
                    onClick={() => {
                      setFiltroEstado(estado);
                      setCanchaSeleccionada(null);
                    }}
                    className={`flex min-h-[42px] min-w-0 items-center justify-center rounded-full px-1 py-2 text-[10px] font-medium transition sm:px-3 sm:text-xs ${
                      active
                        ? "bg-zinc-950 text-white"
                        : "border border-zinc-200 bg-white text-zinc-600"
                    }`}
                  >
                    {estado === "En juego" ? (
                      <span className="flex items-center justify-center gap-1">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: ACCENT,
                          }}
                        />

                        <span>Live</span>
                      </span>
                    ) : estado === "Pendiente" ? (
                      "Próximos"
                    ) : estado === "Terminado" ? (
                      "Terminado"
                    ) : (
                      "Todos"
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =====================================
              COURTS
          ====================================== */}

          <div className="mb-6">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {CANCHAS.map((cancha) => {
                const active =
                  canchaSeleccionada === cancha;

                const label =
                  cancha.replace("Cancha ", "C");

                return (
                  <button
                    key={cancha}
                    onClick={() => {
                      setCanchaSeleccionada(cancha);
                      setFiltroEstado("Todos");
                    }}
                    className={`flex min-h-[42px] items-center justify-center rounded-full px-2 py-2 text-sm font-medium transition ${
                      active
                        ? "text-zinc-950"
                        : "border border-zinc-200 bg-white text-zinc-500"
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor: ACCENT,
                            borderColor: ACCENT,
                          }
                        : undefined
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =====================================
              MATCH SECTION HEADER
          ====================================== */}

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-medium tracking-[-0.02em]">
              {canchaSeleccionada
                ? canchaSeleccionada
                : filtroEstado === "En juego"
                ? "Partidos en vivo"
                : filtroEstado === "Pendiente"
                ? "Próximos partidos"
                : filtroEstado === "Terminado"
                ? "Partidos terminados"
                : "Todos los partidos"}
            </h3>

            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600">
              {cargando
                ? "..."
                : partidosMostrados.length}
            </span>
          </div>

          {/* EMPTY */}

          {partidosMostrados.length === 0 &&
            !cargando && (
              <div className="rounded-[1.4rem] border border-zinc-200 bg-white p-8 text-center">
                <p className="font-medium text-zinc-700">
                  No hay partidos disponibles.
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  Prueba otra cancha o filtro.
                </p>
              </div>
            )}

          {/* =====================================
              MATCH GRID
          ====================================== */}

          <div className="grid gap-3 lg:grid-cols-2">
            {partidosMostrados.map((partido) => (
              <article
                key={partido.id}
                className={`overflow-hidden rounded-[1.4rem] border bg-white transition ${
                  partido.status === "En juego"
                    ? "border-[#3FCD31]/50"
                    : "border-zinc-200"
                }`}
              >
                {/* MATCH HEADER */}

                <div className="border-b border-zinc-100 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge
                          status={partido.status}
                        />

                        <span className="text-xs font-medium text-zinc-400">
                          {partido.cancha}
                        </span>

                        {partido.match_time && (
                          <>
                            <span className="text-zinc-300">
                              •
                            </span>

                            <span className="text-xs font-medium text-zinc-400">
                              {partido.match_time}
                            </span>
                          </>
                        )}
                      </div>

                      <h4 className="truncate text-base font-medium tracking-[-0.02em] text-zinc-950 sm:text-lg">
                        {partido.tournament}
                      </h4>

                      <p className="mt-0.5 text-xs text-zinc-500">
                        {partido.category
                          ? `${partido.category} · `
                          : ""}

                        {partido.round}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SCORE */}

                <LiveScoreCard
                  partido={partido}
                />

                {/* STREAM */}

                {getYoutubeEmbedUrl(partido.stream_url) && (
                  <div className="border-t border-zinc-100 px-3 py-3">
                    <StreamButton partido={partido} />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

/* =========================================
   STATUS BADGE
========================================= */

function StatusBadge({
  status,
}: {
  status: EstadoPartido;
}) {
  if (status === "En juego") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]"
        style={{
          backgroundColor: `${ACCENT}1F`,
          color: "#279C1F",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: ACCENT,
          }}
        />

        Live
      </span>
    );
  }

  if (status === "Pendiente") {
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-amber-600">
        Próximo
      </span>
    );
  }

  return (
    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
      Terminado
    </span>
  );
}

/* =========================================
   LIVE SCORE CARD
========================================= */

function LiveScoreCard({
  partido,
}: {
  partido: Partido;
}) {
  const sport =
    partido.sport || "padel";

  const activeSetIndex =
    getActiveSetIndex(partido);

  const columns =
    sport === "padel"
      ? [
          {
            label: "S1",
            index: 0,
          },
          {
            label: "S2",
            index: 1,
          },
          {
            label:
              getPadelThirdLabel(partido),
            index: 2,
          },
          {
            label: "GAME",
            index: -1,
          },
        ]
      : [
          {
            label: "S1",
            index: 0,
          },
          {
            label: "S2",
            index: 1,
          },
          {
            label: "S3",
            index: 2,
          },
        ];

  return (
    <div>
      {/* SCORE HEADER */}

      <div
        className={`grid items-center gap-1 border-b border-zinc-100 bg-zinc-50/70 px-3 py-2 text-[9px] font-medium uppercase tracking-[0.1em] text-zinc-400 ${
          sport === "padel"
            ? "grid-cols-[minmax(0,1fr)_28px_28px_28px_42px] sm:grid-cols-[minmax(0,1fr)_34px_34px_34px_48px]"
            : "grid-cols-[minmax(0,1fr)_32px_32px_32px]"
        }`}
      >
        <div>Equipo</div>

        {columns.map((col) => (
          <div
            key={col.label}
            className="text-center"
            style={
              col.index ===
                activeSetIndex ||
              col.index === -1
                ? {
                    color: "#279C1F",
                  }
                : undefined
            }
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* TEAMS */}

      <div className="divide-y divide-zinc-100">
        <ScoreRow
          sport={sport}
          name={partido.team_a}
          serving={
            partido.serving === "A"
          }
          sets={partido.sets.map(
            (s) => s.a
          )}
          liveGame={partido.game_a}
          activeSetIndex={
            activeSetIndex
          }
        />

        <ScoreRow
          sport={sport}
          name={partido.team_b}
          serving={
            partido.serving === "B"
          }
          sets={partido.sets.map(
            (s) => s.b
          )}
          liveGame={partido.game_b}
          activeSetIndex={
            activeSetIndex
          }
        />
      </div>

      {/* SERVING */}

      <div className="bg-zinc-50/70 px-4 py-2.5 text-[11px] text-zinc-500">
        Sacando:{" "}
        <span className="font-medium text-zinc-800">
          {partido.serving === "A"
            ? partido.team_a
            : partido.team_b}
        </span>

        {sport === "pickleball" && (
          <>
            {" "}
            · Servidor{" "}
            {partido.server_number || 1}
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================
   SCORE ROW
========================================= */

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
      ? [
          sets[0] ?? "0",
          sets[1] ?? "0",
          sets[2] ?? "-",
          liveGame || "0",
        ]
      : [
          activeSetIndex === 0
            ? liveGame ||
              sets[0] ||
              "0"
            : sets[0] ?? "0",

          activeSetIndex === 1
            ? liveGame ||
              sets[1] ||
              "0"
            : sets[1] ?? "0",

          activeSetIndex === 2
            ? liveGame ||
              sets[2] ||
              "0"
            : sets[2] ?? "0",
        ];

  return (
    <div
      className={`grid min-h-[54px] items-center gap-1 px-3 py-2.5 ${
        sport === "padel"
          ? "grid-cols-[minmax(0,1fr)_28px_28px_28px_42px] sm:grid-cols-[minmax(0,1fr)_34px_34px_34px_48px]"
          : "grid-cols-[minmax(0,1fr)_32px_32px_32px]"
      }`}
    >
      {/* TEAM */}

      <div className="flex min-w-0 items-center gap-1.5 pr-1">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor: serving
              ? ACCENT
              : "transparent",
          }}
        />

        <span className="min-w-0 break-words text-[11px] font-medium leading-[1.15] text-zinc-800 sm:text-xs">
          {name}
        </span>
      </div>

      {/* SCORES */}

      {values.map(
        (value, index) => {
          const isGameCol =
            sport === "padel" &&
            index === 3;

          const isActiveSet =
            index ===
            activeSetIndex;

          return (
            <div
              key={index}
              className={`text-center font-semibold ${
                isGameCol
                  ? "text-base sm:text-lg"
                  : "text-sm sm:text-base"
              }`}
              style={
                isGameCol ||
                isActiveSet
                  ? {
                      color:
                        "#279C1F",
                    }
                  : {
                      color: DARK,
                    }
              }
            >
              {value}
            </div>
          );
        }
      )}
    </div>
  );
}

/* =========================================
   YOUTUBE HELPERS
========================================= */

function getYoutubeEmbedUrl(
  url?: string
) {
  if (!url) return "";

  const normalMatch =
    url.match(/[?&]v=([^&]+)/);

  const shortMatch =
    url.match(
      /youtu\.be\/([^?&]+)/
    );

  const liveMatch =
    url.match(
      /youtube\.com\/live\/([^?&]+)/
    );

  const embedMatch =
    url.match(
      /youtube\.com\/embed\/([^?&]+)/
    );

  const videoId =
    normalMatch?.[1] ||
    shortMatch?.[1] ||
    liveMatch?.[1] ||
    embedMatch?.[1];

  if (!videoId) return "";

  return `https://www.youtube.com/embed/${videoId}`;
}

function getYoutubeWatchUrl(
  url?: string
) {
  if (!url) return "";

  const normalMatch =
    url.match(/[?&]v=([^&]+)/);

  const shortMatch =
    url.match(
      /youtu\.be\/([^?&]+)/
    );

  const liveMatch =
    url.match(
      /youtube\.com\/live\/([^?&]+)/
    );

  const embedMatch =
    url.match(
      /youtube\.com\/embed\/([^?&]+)/
    );

  const videoId =
    normalMatch?.[1] ||
    shortMatch?.[1] ||
    liveMatch?.[1] ||
    embedMatch?.[1];

  if (!videoId) {
    return url;
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

/* =========================================
   STREAM BUTTON
========================================= */

function StreamButton({
  partido,
}: {
  partido: Partido;
}) {
  const [open, setOpen] =
    useState(false);

  const embedUrl =
    getYoutubeEmbedUrl(
      partido.stream_url
    );

  const watchUrl =
    getYoutubeWatchUrl(
      partido.stream_url
    );

  if (!embedUrl) {
    return null;
  }

  return (
    <div className="w-full">
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-600"
      >
        {open
          ? "Cerrar live"
          : "● Ver en vivo"}
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-black">
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
            className="block border-t border-white/10 px-4 py-3 text-center text-xs font-medium text-white"
          >
            Ver en pantalla grande
          </a>
        </div>
      )}
    </div>
  );
}
