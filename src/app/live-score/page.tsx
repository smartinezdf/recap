"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const ACCENT = "#3FCD31";

type Club = {
  id: string;
  name: string;
  logo_url?: string | null;
};

type EstadoPartido = "Pendiente" | "En juego" | "Terminado";
type ModoTercerSet = "Tercer set completo" | "Super tiebreak";

type Partido = {
  id: string;
  club: string;
  cancha: string;
  tournament: string;
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
};

const CANCHAS = ["Cancha 1", "Cancha 2", "Cancha 3", "Cancha 4"];

export default function LiveScorePage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubSeleccionado, setClubSeleccionado] = useState<Club | null>(null);

  const [canchaSeleccionada, setCanchaSeleccionada] = useState("Cancha 1");
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cargando, setCargando] = useState(true);

  const partidosClub = useMemo(
    () =>
      partidos.filter(
        (partido) =>
          !clubSeleccionado ||
          String(partido.club || "").trim() === String(clubSeleccionado.name).trim()
      ),
    [partidos, clubSeleccionado]
  );

  const partidosCancha = useMemo(
    () =>
      partidosClub.filter(
        (partido) =>
          String(partido.cancha || "").trim() === String(canchaSeleccionada).trim()
      ),
    [partidosClub, canchaSeleccionada]
  );

  useEffect(() => {
    cargarClubes();
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

  async function cargarClubes() {
    const { data, error } = await supabase
      .from("clubs")
      .select("id,name,logo_url")
      .order("name");

    if (!error) {
      setClubs((data || []) as Club[]);
    }
  }

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

              <h1 className="text-2xl font-black text-black">Score en Vivo</h1>
            </div>
          </div>

          <Link href="/">
            <img src="/RecapLogo.png" alt="Recap" className="h-10 w-auto" />
          </Link>
        </div>

        {menuOpen && (
          <div className="mt-4 border-t border-zinc-200 pt-4">
            <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
              <Link className="rounded-2xl bg-zinc-100 p-4 font-bold text-black" href="/">
                Clips
              </Link>

              <Link
                className="rounded-2xl bg-zinc-100 p-4 font-bold text-black"
                href="/live-score"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
            {clubs.map((club) => (
              <button
                key={club.id}
                onClick={() => {
                  setClubSeleccionado(club);
                  setCanchaSeleccionada("Cancha 1");
                }}
                className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 text-left transition hover:border-white/30 hover:bg-white/[0.1]"
              >
                <div className="flex items-center gap-4">
                  {club.logo_url ? (
                    <img
                      src={club.logo_url}
                      alt={`${club.name} logo`}
                      className="h-14 w-14 rounded-full object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-white/10 font-black">
                      {club.name[0]}
                    </div>
                  )}

                  <div>
                    <p className="text-2xl font-black">{club.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">Ver score en vivo</p>
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
            onClick={() => setClubSeleccionado(null)}
            className="mb-6 rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-300"
          >
            ← Cambiar club
          </button>

          <div className="mb-6">
            <h2 className="text-4xl font-black md:text-6xl">
              {clubSeleccionado.name}
            </h2>

            <p className="mt-2 text-zinc-400">
              Selecciona la cancha y sigue el score en vivo de los partidos.
            </p>
          </div>

          <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.07] p-4">
            <p className="mb-3 text-sm font-bold text-zinc-300">Canchas</p>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {CANCHAS.map((cancha) => {
                const total = partidosClub.filter(
                  (partido) =>
                    String(partido.cancha || "").trim() === String(cancha).trim()
                ).length;

                const enVivo = partidosClub.filter(
                  (partido) =>
                    String(partido.cancha || "").trim() === String(cancha).trim() &&
                    partido.status === "En juego"
                ).length;

                return (
                  <button
                    key={cancha}
                    onClick={() => setCanchaSeleccionada(cancha)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      canchaSeleccionada === cancha
                        ? "text-black"
                        : "border-white/10 bg-black/30 text-white hover:border-white/40"
                    }`}
                    style={
                      canchaSeleccionada === cancha
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
          </div>

          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-2xl font-black">{canchaSeleccionada}</h3>
              <p className="text-sm text-zinc-400">
                {cargando ? "Cargando..." : "Live Score"}
              </p>
            </div>

            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
              {partidosCancha.length} partidos
            </span>
          </div>

          {partidosCancha.length === 0 && !cargando && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-zinc-400">
              No hay score disponible para {canchaSeleccionada} en este momento.
            </div>
          )}

          <div className="grid gap-5">
            {partidosCancha.map((partido) => (
              <article
                key={partido.id}
                className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-5">
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

                    <h4 className="text-2xl font-black md:text-3xl">
                      {partido.tournament}
                    </h4>

                    <p className="text-zinc-400">
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

                <div className="flex flex-wrap gap-3 border-t border-white/10 p-5">
                  <button className="rounded-full border border-white/10 px-5 py-3 text-zinc-300">
                    Streaming · Próximamente
                  </button>
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
  const showSet3 = Boolean(partido.sets[2]);
  const tercerSetLabel =
    partido.third_set_mode === "Super tiebreak" ? "TB" : "S3";

  return (
    <div>
      <div
        className={`grid gap-2 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-zinc-500 ${
          showSet3
            ? "grid-cols-[1fr_44px_44px_44px_56px]"
            : "grid-cols-[1fr_44px_44px_56px]"
        }`}
      >
        <div>Equipo</div>
        <div className="text-center">S1</div>
        <div className="text-center">S2</div>
        {showSet3 && <div className="text-center">{tercerSetLabel}</div>}
        <div className="text-center">Game</div>
      </div>

      <div className="space-y-3 p-4">
        <ScoreRow
          name={partido.team_a}
          serving={partido.serving === "A"}
          sets={partido.sets.map((s) => s.a)}
          game={partido.game_a}
          showSet3={showSet3}
        />

        <ScoreRow
          name={partido.team_b}
          serving={partido.serving === "B"}
          sets={partido.sets.map((s) => s.b)}
          game={partido.game_b}
          showSet3={showSet3}
        />
      </div>
    </div>
  );
}

function ScoreRow({
  name,
  serving,
  sets,
  game,
  showSet3,
}: {
  name: string;
  serving: boolean;
  sets: string[];
  game: string;
  showSet3: boolean;
}) {
  return (
    <div
      className={`grid items-center gap-2 rounded-3xl bg-black/40 px-4 py-5 text-base md:text-xl ${
        showSet3
          ? "grid-cols-[1fr_44px_44px_44px_56px]"
          : "grid-cols-[1fr_44px_44px_56px]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 font-black">
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full"
          style={{ backgroundColor: serving ? ACCENT : "transparent" }}
        />
        <span className="truncate">{name}</span>
      </div>

      <div className="text-center font-black">{sets[0] ?? "0"}</div>
      <div className="text-center font-black">{sets[1] ?? "0"}</div>

      {showSet3 && (
        <div className="text-center font-black">{sets[2] ?? "0"}</div>
      )}

      <div
        className="text-center text-xl font-black md:text-2xl"
        style={{ color: ACCENT }}
      >
        {game}
      </div>
    </div>
  );
}
