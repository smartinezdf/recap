"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ACCENT = "#3FCD31";

type Sport = "padel" | "pickleball";
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
};

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

export default function LiveScoreOverlayPage() {
  const searchParams = useSearchParams();

  const courtParam = searchParams.get("court") || "1";
  const clubParam = searchParams.get("club");

  const cancha = courtParam.toLowerCase().includes("cancha")
    ? courtParam
    : `Cancha ${courtParam}`;

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPartidos();

    const channel = supabase
      .channel("live_matches_overlay_realtime")
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

  const partidoActivo = useMemo(() => {
    return partidos.find((p) => {
      const sameCourt =
        String(p.cancha || "").trim().toLowerCase() ===
        String(cancha || "").trim().toLowerCase();

      const sameClub = clubParam
        ? String(p.club || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(
              String(clubParam || "")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "")
            )
        : true;

      return sameCourt && sameClub && p.status === "En juego";
    });
  }, [partidos, cancha, clubParam]);

  if (cargando) {
    return <main className="h-screen w-screen bg-transparent" />;
  }

  if (!partidoActivo) {
    return <main className="h-screen w-screen bg-transparent" />;
  }

  return (
    <main className="h-screen w-screen bg-transparent p-4 text-white">
      <div className="w-[620px] overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#111613]/95 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ACCENT }}
              />
              <span
                className="text-[11px] font-black uppercase tracking-[0.3em]"
                style={{ color: ACCENT }}
              >
                En juego
              </span>
            </div>

            <h1 className="text-2xl font-black leading-none">
              {partidoActivo.tournament}
            </h1>

            <p className="mt-1 text-sm font-medium text-zinc-400">
              {partidoActivo.category ? `${partidoActivo.category} · ` : ""}
              {partidoActivo.round}
            </p>
          </div>

          <span
            className="rounded-full border px-3 py-1.5 text-xs font-bold"
            style={{
              borderColor: `${ACCENT}66`,
              backgroundColor: `${ACCENT}1A`,
              color: ACCENT,
            }}
          >
            {partidoActivo.cancha}
          </span>
        </div>

        <LiveScoreCard partido={partidoActivo} />
      </div>
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
        className={`grid gap-2 border-b border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 ${
          sport === "padel"
            ? "grid-cols-[1fr_40px_40px_40px_56px]"
            : "grid-cols-[1fr_40px_40px_40px]"
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

      <div className="border-t border-white/10 px-4 pb-4 pt-1 text-sm text-zinc-400">
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
      className={`grid items-center gap-2 rounded-2xl bg-black/45 px-4 py-3 text-lg ${
        sport === "padel"
          ? "grid-cols-[1fr_40px_40px_40px_56px]"
          : "grid-cols-[1fr_40px_40px_40px]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 font-black">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
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
