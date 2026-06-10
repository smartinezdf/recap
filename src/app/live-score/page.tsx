"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const ACCENT = "#3FCD31";

type Sport = "padel" | "pickleball";

type ClubAccess = {
  club: string;
  sport: Sport;
  logo: string;
};

const CLUB_PINS: Record<string, ClubAccess> = {
  "9700": {
    club: "Garana Padel",
    sport: "padel",
    logo: "https://pub-a24ccb8eb0ea4e87b2bc39e6e975dafc.r2.dev/club-logos/Garana.PNG",
  },
  "4600": {
    club: "Upadel",
    sport: "padel",
    logo: "https://pub-a24ccb8eb0ea4e87b2bc39e6e975dafc.r2.dev/club-logos/Upadel.JPG",
  },
  "2025": {
    club: "Pickle Tour Venezuela",
    sport: "pickleball",
    logo: "https://pub-a24ccb8eb0ea4e87b2bc39e6e975dafc.r2.dev/club-logos/PickleTour.jpeg",
  },
};

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

const CANCHAS = ["Cancha 1", "Cancha 2", "Cancha 3", "Cancha 4"];

function formularioVacio(cancha = "Cancha 1") {
  return {
    club: "",
    sport: "padel" as Sport,
    cancha,
    tournament: "",
    category: "",
    round: "",
    match_time: "",
    team_a: "",
    team_b: "",
    status: "Pendiente" as EstadoPartido,
    third_set_mode: "Tercer set completo" as ModoTercerSet,
    sets: [
      { a: "0", b: "0" },
      { a: "0", b: "0" },
    ],
    game_a: "0",
    game_b: "0",
    serving: "A" as "A" | "B",
    server_number: 1,
  };
}

function toNumber(value: string | undefined) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function nextPointPadel(point: string) {
  if (point === "0") return "15";
  if (point === "15") return "30";
  if (point === "30") return "40";
  return point;
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

function countSetsWon(sets: { a: string; b: string }[]) {
  let a = 0;
  let b = 0;

  sets.forEach((set) => {
    const sa = toNumber(set.a);
    const sb = toNumber(set.b);

    if (sa > sb) a += 1;
    if (sb > sa) b += 1;
  });

  return { a, b };
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

export default function AdminScorePage() {
  const [clubActual, setClubActual] = useState<ClubAccess | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const [canchaSeleccionada, setCanchaSeleccionada] = useState("Cancha 1");
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [form, setForm] = useState(formularioVacio("Cancha 1"));
  const [partidoActivoId, setPartidoActivoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [cargando, setCargando] = useState(false);

  const partidosCancha = useMemo(
    () =>
      partidos.filter(
        (partido) =>
          String(partido.cancha || "").trim() ===
          String(canchaSeleccionada).trim()
      ),
    [partidos, canchaSeleccionada]
  );

  const partidoActivo = partidos.find(
    (partido) => partido.id === partidoActivoId
  );

  useEffect(() => {
    if (clubActual) cargarPartidos();
  }, [clubActual]);

  async function cargarPartidos() {
    if (!clubActual) return;

    setCargando(true);
    setErrorFormulario("");

    const { data, error } = await supabase
      .from("live_matches")
      .select("*")
      .eq("club", clubActual.club)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorFormulario(error.message);
      setPartidos([]);
    } else {
      setPartidos((data || []) as Partido[]);
    }

    setCargando(false);
  }

  function entrarConPin() {
    const club = CLUB_PINS[pin.trim()];

    if (!club) {
      setPinError("PIN incorrecto.");
      return;
    }

    setClubActual(club);
    setPin("");
    setPinError("");
    setCanchaSeleccionada("Cancha 1");
    setForm({ ...formularioVacio("Cancha 1"), sport: club.sport });
  }

  function seleccionarCancha(cancha: string) {
    setCanchaSeleccionada(cancha);
    setForm({ ...formularioVacio(cancha), sport: clubActual?.sport || "padel" });
    setEditandoId(null);
    setErrorFormulario("");

    const primerPartido = partidos.find(
      (partido) => String(partido.cancha || "").trim() === cancha
    );

    setPartidoActivoId(primerPartido?.id ?? null);
  }

  function actualizarForm(campo: string, valor: string) {
    setErrorFormulario("");
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  function validarFormulario() {
    const requeridos = [
      form.tournament,
      form.category,
      form.round,
      form.match_time,
      form.team_a,
      form.team_b,
    ];

    if (requeridos.some((campo) => !campo.trim())) {
      setErrorFormulario(
        "Completa torneo, categoría, ronda, hora, Equipo A y Equipo B antes de guardar."
      );
      return false;
    }

    return true;
  }

  async function guardarPartido() {
    if (!clubActual) return;
    if (!validarFormulario()) return;

    if (editandoId) {
      const { error } = await supabase
        .from("live_matches")
        .update({
          club: clubActual.club,
          sport: clubActual.sport,
          cancha: canchaSeleccionada,
          tournament: form.tournament,
          category: form.category,
          round: form.round,
          match_time: form.match_time,
          team_a: form.team_a,
          team_b: form.team_b,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editandoId);

      if (error) {
        setErrorFormulario(error.message);
        return;
      }

      const idActualizado = editandoId;
      setEditandoId(null);
      setForm({
        ...formularioVacio(canchaSeleccionada),
        sport: clubActual.sport,
      });
      await cargarPartidos();
      setPartidoActivoId(idActualizado);
      return;
    }

    const initialSets =
      clubActual.sport === "pickleball"
        ? [
            { a: "0", b: "0" },
            { a: "0", b: "0" },
            { a: "0", b: "0" },
          ]
        : [
            { a: "0", b: "0" },
            { a: "0", b: "0" },
          ];

    const { data, error } = await supabase
      .from("live_matches")
      .insert({
        club: clubActual.club,
        sport: clubActual.sport,
        cancha: canchaSeleccionada,
        tournament: form.tournament,
        category: form.category,
        round: form.round,
        match_time: form.match_time,
        team_a: form.team_a,
        team_b: form.team_b,
        status: form.status,
        third_set_mode: form.third_set_mode,
        sets: initialSets,
        game_a: "0",
        game_b: "0",
        serving: "A",
        server_number: 1,
      })
      .select()
      .single();

    if (error) {
      setErrorFormulario(error.message);
      return;
    }

    setForm({
      ...formularioVacio(canchaSeleccionada),
      sport: clubActual.sport,
    });
    await cargarPartidos();
    setPartidoActivoId(data.id);
  }

  function editarPartido(partido: Partido) {
    setForm({
      club: partido.club,
      sport: partido.sport || clubActual?.sport || "padel",
      cancha: partido.cancha,
      tournament: partido.tournament,
      category: partido.category || "",
      round: partido.round,
      match_time: partido.match_time,
      team_a: partido.team_a,
      team_b: partido.team_b,
      status: partido.status,
      third_set_mode: partido.third_set_mode,
      sets: partido.sets,
      game_a: partido.game_a,
      game_b: partido.game_b,
      serving: partido.serving,
      server_number: partido.server_number || 1,
    });

    setEditandoId(partido.id);
    setCanchaSeleccionada(partido.cancha);
    setPartidoActivoId(partido.id);
    setErrorFormulario("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm({
      ...formularioVacio(canchaSeleccionada),
      sport: clubActual?.sport || "padel",
    });
    setErrorFormulario("");
  }

  async function updateMatch(id: string, cambios: Partial<Partido>) {
    const { error } = await supabase
      .from("live_matches")
      .update({
        ...cambios,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setErrorFormulario(error.message);
      return;
    }

    setPartidos((actual) =>
      actual.map((partido) =>
        partido.id === id ? { ...partido, ...cambios } : partido
      )
    );
  }

  async function eliminarPartido(id: string) {
    if (!window.confirm("¿Eliminar este partido?")) return;

    const { error } = await supabase.from("live_matches").delete().eq("id", id);

    if (error) {
      setErrorFormulario(error.message);
      return;
    }

    setPartidos((actual) => actual.filter((partido) => partido.id !== id));

    if (partidoActivoId === id) setPartidoActivoId(null);
    if (editandoId === id) cancelarEdicion();
  }

  function actualizarSet(
    partido: Partido,
    index: number,
    lado: "a" | "b",
    valor: string
  ) {
    const nuevosSets = [...partido.sets];
    nuevosSets[index] = { ...nuevosSets[index], [lado]: valor };
    updateMatch(partido.id, { sets: nuevosSets });
  }

  function cambiarSaque(partido: Partido) {
    updateMatch(partido.id, {
      serving: partido.serving === "A" ? "B" : "A",
    });
  }

  function resetGame(partido: Partido) {
    updateMatch(partido.id, {
      game_a: "0",
      game_b: "0",
    });
  }

  function bajarPuntoPickleball(partido: Partido, lado: "A" | "B") {
    const gameA = Math.max(
      0,
      Number(partido.game_a || 0) - (lado === "A" ? 1 : 0)
    );
    const gameB = Math.max(
      0,
      Number(partido.game_b || 0) - (lado === "B" ? 1 : 0)
    );

    updateMatch(partido.id, {
      game_a: String(gameA),
      game_b: String(gameB),
    });
  }

  function resetPickleballScore(partido: Partido) {
    updateMatch(partido.id, {
      game_a: "0",
      game_b: "0",
      server_number: 1,
    });
  }

  function cambiarFormatoTercerSet(partido: Partido, mode: ModoTercerSet) {
    updateMatch(partido.id, {
      third_set_mode: mode,
      game_a: "0",
      game_b: "0",
    });
  }

  function puntoPadel(partido: Partido, ganador: "A" | "B") {
    const sets = partido.sets?.length ? [...partido.sets] : [{ a: "0", b: "0" }];
    const activeSetIndex = getActiveSetIndex(partido);
    const setActual = sets[activeSetIndex] || { a: "0", b: "0" };

    if (isSetCompletePadel(setActual)) {
      setErrorFormulario(
        "Ese set ya está cerrado. Edita el set manualmente si hubo un error."
      );
      return;
    }

    const setA = toNumber(setActual.a);
    const setB = toNumber(setActual.b);

    const isThirdSet = activeSetIndex === 2;
    const isSuperTie = isThirdSet && partido.third_set_mode === "Super tiebreak";
    const isTieBreak = isSuperTie || (setA === 6 && setB === 6);

    let gameA = partido.game_a || "0";
    let gameB = partido.game_b || "0";
    let serving = partido.serving || "A";

    if (isTieBreak) {
      let tbA = toNumber(gameA);
      let tbB = toNumber(gameB);

      if (ganador === "A") tbA += 1;
      if (ganador === "B") tbB += 1;

      const target = isSuperTie ? 10 : 7;
      const totalPoints = tbA + tbB;

      if (totalPoints === 1 || totalPoints % 2 === 1) {
        serving = serving === "A" ? "B" : "A";
      }

      if ((tbA >= target || tbB >= target) && Math.abs(tbA - tbB) >= 2) {
        if (isSuperTie) {
          sets[activeSetIndex] = { a: String(tbA), b: String(tbB) };
        } else {
          sets[activeSetIndex] =
            tbA > tbB ? { a: "7", b: "6" } : { a: "6", b: "7" };
        }

        const won = countSetsWon(sets);

        updateMatch(partido.id, {
          sets,
          game_a: "0",
          game_b: "0",
          serving,
          server_number: 1,
          status: won.a === 2 || won.b === 2 ? "Terminado" : "En juego",
        });
        return;
      }

      updateMatch(partido.id, {
        game_a: String(tbA),
        game_b: String(tbB),
        serving,
        status: "En juego",
      });
      return;
    }

    const winnerPoint = ganador === "A" ? gameA : gameB;
    const loserPoint = ganador === "A" ? gameB : gameA;

    let gameWon = false;

    if (winnerPoint === "AD") {
      gameWon = true;
    } else if (
      winnerPoint === "40" &&
      loserPoint !== "40" &&
      loserPoint !== "AD"
    ) {
      gameWon = true;
    } else if (winnerPoint === "40" && loserPoint === "40") {
      if (ganador === "A") gameA = "AD";
      if (ganador === "B") gameB = "AD";
    } else if (loserPoint === "AD") {
      gameA = "40";
      gameB = "40";
    } else {
      if (ganador === "A") gameA = nextPointPadel(gameA);
      if (ganador === "B") gameB = nextPointPadel(gameB);
    }

    if (!gameWon) {
      updateMatch(partido.id, {
        game_a: gameA,
        game_b: gameB,
        status: "En juego",
      });
      return;
    }

    const nextSetA = setA + (ganador === "A" ? 1 : 0);
    const nextSetB = setB + (ganador === "B" ? 1 : 0);

    const nextSet = {
      a: String(nextSetA),
      b: String(nextSetB),
    };

    if (
      (nextSetA > 7 || nextSetB > 7) ||
      (nextSetA === 7 && nextSetB < 5) ||
      (nextSetB === 7 && nextSetA < 5)
    ) {
      setErrorFormulario("Score de set inválido. Revisa el marcador.");
      return;
    }

    sets[activeSetIndex] = nextSet;

    let nextSets = sets;
    const setFinished = isSetCompletePadel(sets[activeSetIndex]);
    const won = countSetsWon(sets);

    if (
      setFinished &&
      activeSetIndex === 1 &&
      won.a === 1 &&
      won.b === 1 &&
      sets.length < 3
    ) {
      nextSets = [...sets, { a: "0", b: "0" }];
    }

    const nextServing = serving === "A" ? "B" : "A";

    updateMatch(partido.id, {
      sets: nextSets,
      game_a: "0",
      game_b: "0",
      serving: nextServing,
      server_number: 1,
      status: won.a === 2 || won.b === 2 ? "Terminado" : "En juego",
    });
  }

  function puntoPickleball(partido: Partido, ganador: "A" | "B") {
    const serving = partido.serving || "A";
    const serverNumber = partido.server_number || 1;

    let gameA = Number(partido.game_a || 0);
    let gameB = Number(partido.game_b || 0);
    let nextServing = serving;
    let nextServerNumber = serverNumber;

    if (ganador === serving) {
      if (ganador === "A") gameA += 1;
      if (ganador === "B") gameB += 1;
    } else {
      if (serverNumber === 1) {
        nextServerNumber = 2;
      } else {
        nextServing = serving === "A" ? "B" : "A";
        nextServerNumber = 1;
      }
    }

    updateMatch(partido.id, {
      game_a: String(gameA),
      game_b: String(gameB),
      serving: nextServing,
      server_number: nextServerNumber,
      status: "En juego",
    });
  }

  function guardarSetPickleball(partido: Partido) {
    const gameA = Number(partido.game_a || 0);
    const gameB = Number(partido.game_b || 0);

    if (!isSetCompletePickleball({ a: String(gameA), b: String(gameB) })) {
      setErrorFormulario(
        "Para cerrar el set, alguien debe llegar a 11 y ganar por 2."
      );
      return;
    }

    const sets = partido.sets?.length
      ? [...partido.sets]
      : [
          { a: "0", b: "0" },
          { a: "0", b: "0" },
          { a: "0", b: "0" },
        ];

    const indexSet = getActiveSetIndex(partido);

    sets[indexSet] = {
      a: String(gameA),
      b: String(gameB),
    };

    const won = countSetsWon(sets);

    updateMatch(partido.id, {
      sets,
      game_a: "0",
      game_b: "0",
      serving: gameA > gameB ? "B" : "A",
      server_number: 1,
      status: won.a === 2 || won.b === 2 ? "Terminado" : "En juego",
    });
  }

  if (!clubActual) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050806] px-5 text-white">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.08] p-8 shadow-2xl">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.35em]"
            style={{ color: ACCENT }}
          >
            Recap Admin
          </p>

          <h1 className="mb-2 text-3xl font-black">Control de Score</h1>

          <p className="mb-6 text-sm text-zinc-400">
            Ingresa el PIN del club para continuar.
          </p>

          <div className="mb-6 grid gap-3">
            {Object.values(CLUB_PINS).map((club) => (
              <div
                key={club.club}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <img
                  src={club.logo}
                  alt={club.club}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold">{club.club}</p>
                  <p className="text-xs text-zinc-400">
                    {club.sport === "pickleball" ? "Pickleball" : "Padel"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setPinError("");
            }}
            placeholder="PIN"
            className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-[#3FCD31]"
          />

          {pinError && <p className="mt-3 text-sm text-red-300">{pinError}</p>}

          <button
            onClick={entrarConPin}
            className="mt-5 w-full rounded-2xl px-6 py-4 font-black text-black"
            style={{ backgroundColor: ACCENT }}
          >
            Entrar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050806] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={clubActual.logo}
              alt={clubActual.club}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <p
                className="text-xs uppercase tracking-[0.35em] font-bold"
                style={{ color: ACCENT }}
              >
                {clubActual.club}
              </p>
              <h1 className="text-2xl font-black">Control de Score</h1>
            </div>
          </div>

          <Link
            href="/live-score"
            className="rounded-full px-5 py-3 text-sm font-bold text-black"
            style={{ backgroundColor: ACCENT }}
          >
            Ver Score en Vivo
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6">
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.07] p-4">
          <p className="mb-3 text-sm font-bold text-zinc-300">
            Selecciona la cancha
          </p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {CANCHAS.map((cancha) => {
              const total = partidos.filter(
                (p) => String(p.cancha || "").trim() === cancha
              ).length;

              return (
                <button
                  key={cancha}
                  onClick={() => seleccionarCancha(cancha)}
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
                  <p className="font-black">{cancha}</p>
                  <p className="text-sm opacity-70">{total} partidos hoy</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl">
            <div className="mb-5">
              <p
                className="text-sm uppercase tracking-[0.25em] font-bold"
                style={{ color: ACCENT }}
              >
                {canchaSeleccionada}
              </p>
              <h2 className="text-xl font-black">
                {editandoId ? "Editar partido" : "Crear partido"}
              </h2>
            </div>

            <div className="grid gap-4">
              <Input
                label="Torneo / Evento"
                value={form.tournament}
                onChange={(v) => actualizarForm("tournament", v)}
              />
              <Input
                label="Categoría"
                value={form.category || ""}
                onChange={(v) => actualizarForm("category", v)}
              />
              <Input
                label="Ronda"
                value={form.round}
                onChange={(v) => actualizarForm("round", v)}
              />
              <Input
                label="Hora"
                value={form.match_time}
                onChange={(v) => actualizarForm("match_time", v)}
              />
              <Input
                label="Equipo A"
                value={form.team_a}
                onChange={(v) => actualizarForm("team_a", v)}
              />
              <Input
                label="Equipo B"
                value={form.team_b}
                onChange={(v) => actualizarForm("team_b", v)}
              />

              {errorFormulario && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {errorFormulario}
                </div>
              )}

              <button
                onClick={guardarPartido}
                className="rounded-2xl px-6 py-4 font-black text-black"
                style={{ backgroundColor: ACCENT }}
              >
                {editandoId ? "Actualizar partido" : "Guardar partido"}
              </button>

              {editandoId && (
                <button
                  onClick={cancelarEdicion}
                  className="rounded-2xl border border-white/15 px-6 py-4 font-bold text-zinc-300"
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </aside>

          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">{canchaSeleccionada}</h2>
                <p className="text-sm text-zinc-400">
                  {cargando ? "Cargando partidos..." : "Partidos de hoy"}
                </p>
              </div>

              <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
                {partidosCancha.length} partidos
              </span>
            </div>

            {partidosCancha.length === 0 && !cargando && (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-zinc-400">
                No hay score disponible para {canchaSeleccionada} hoy.
              </div>
            )}

            <div className="grid gap-5">
              {partidosCancha.map((partido) => (
                <div
                  key={partido.id}
                  className={`rounded-[2rem] border p-4 transition ${
                    partidoActivoId === partido.id
                      ? "bg-white/[0.08]"
                      : "border-white/10 bg-white/[0.06]"
                  }`}
                  style={
                    partidoActivoId === partido.id
                      ? { borderColor: ACCENT }
                      : undefined
                  }
                >
                  <button
                    onClick={() => setPartidoActivoId(partido.id)}
                    className="w-full text-left"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p style={{ color: ACCENT }} className="text-sm">
                          {partido.tournament}
                          {partido.category ? ` · ${partido.category}` : ""}
                          {" · "}
                          {partido.match_time}
                        </p>

                        <h3 className="text-xl font-black">
                          {partido.team_a} vs {partido.team_b}
                        </h3>

                        <p className="text-sm text-zinc-400">{partido.round}</p>
                      </div>

                      <EstadoBadge status={partido.status} />
                    </div>

                    <ScorePreview partido={partido} compact />
                  </button>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => editarPartido(partido)}
                      className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-white/10"
                      style={{ borderColor: `${ACCENT}80`, color: ACCENT }}
                    >
                      Editar partido
                    </button>

                    <button
                      onClick={() => eliminarPartido(partido.id)}
                      className="rounded-full border border-red-400/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
                    >
                      Eliminar partido
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {partidoActivo && (
              <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl">
                <div className="mb-6">
                  <p
                    className="text-sm uppercase tracking-[0.3em] font-bold"
                    style={{ color: ACCENT }}
                  >
                    Editando score
                  </p>
                  <h2 className="text-2xl font-black">
                    {partidoActivo.team_a} vs {partidoActivo.team_b}
                  </h2>
                  <p className="text-zinc-400">
                    {partidoActivo.cancha} ·{" "}
                    {partidoActivo.category
                      ? `${partidoActivo.category} · `
                      : ""}
                    {(partidoActivo.sport || clubActual.sport) === "pickleball"
                      ? "Pickleball"
                      : "Padel"}
                  </p>
                </div>

                <ControlSection title="Estado del partido">
                  <div className="grid gap-3 md:grid-cols-3">
                    {(["Pendiente", "En juego", "Terminado"] as EstadoPartido[]).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => updateMatch(partidoActivo.id, { status })}
                          className={`rounded-2xl px-5 py-4 font-bold ${
                            partidoActivo.status === status
                              ? "text-black"
                              : "bg-white/10 text-white"
                          }`}
                          style={
                            partidoActivo.status === status
                              ? { backgroundColor: ACCENT }
                              : undefined
                          }
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </ControlSection>

                {(partidoActivo.sport || clubActual.sport) === "pickleball" ? (
                  <PickleballControls
                    partido={partidoActivo}
                    onPoint={puntoPickleball}
                    onSaveSet={guardarSetPickleball}
                    onChangeServe={cambiarSaque}
                    onMinusPoint={bajarPuntoPickleball}
                    onResetScore={resetPickleballScore}
                  />
                ) : (
                  <PadelControls
                    partido={partidoActivo}
                    onPoint={puntoPadel}
                    onChangeServe={cambiarSaque}
                    onChangeMode={cambiarFormatoTercerSet}
                    onResetGame={resetGame}
                  />
                )}

                <ControlSection title="Sets">
                  <div className="space-y-3">
                    {partidoActivo.sets.map((set, index) => (
                      <div
                        key={index}
                        className="grid gap-3 rounded-2xl bg-black/35 p-3 sm:grid-cols-[110px_1fr_1fr]"
                      >
                        <div className="flex items-center text-sm text-zinc-400">
                          {index === 2 &&
                          partidoActivo.third_set_mode === "Super tiebreak"
                            ? "ST"
                            : `Set ${index + 1}`}
                        </div>

                        <input
                          value={set.a}
                          onChange={(e) =>
                            actualizarSet(partidoActivo, index, "a", e.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-center font-bold outline-none focus:border-green-400"
                        />

                        <input
                          value={set.b}
                          onChange={(e) =>
                            actualizarSet(partidoActivo, index, "b", e.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-center font-bold outline-none focus:border-green-400"
                        />
                      </div>
                    ))}
                  </div>
                </ControlSection>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function PadelControls({
  partido,
  onPoint,
  onChangeServe,
  onChangeMode,
  onResetGame,
}: {
  partido: Partido;
  onPoint: (partido: Partido, ganador: "A" | "B") => void;
  onChangeServe: (partido: Partido) => void;
  onChangeMode: (partido: Partido, mode: ModoTercerSet) => void;
  onResetGame: (partido: Partido) => void;
}) {
  const activeIndex = getActiveSetIndex(partido);
  const set = partido.sets[activeIndex] || { a: "0", b: "0" };
  const isSuperTie =
    activeIndex === 2 && partido.third_set_mode === "Super tiebreak";
  const isTieBreak =
    isSuperTie || (toNumber(set.a) === 6 && toNumber(set.b) === 6);

  return (
    <>
      <ControlSection
        title={
          isSuperTie
            ? "Super tiebreak a 10"
            : isTieBreak
            ? "Tiebreak a 7"
            : "Score del game"
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => onPoint(partido, "A")}
            className="rounded-2xl px-5 py-5 font-black text-black"
            style={{ backgroundColor: ACCENT }}
          >
            + Punto {partido.team_a}
          </button>

          <button
            onClick={() => onPoint(partido, "B")}
            className="rounded-2xl px-5 py-5 font-black text-black"
            style={{ backgroundColor: ACCENT }}
          >
            + Punto {partido.team_b}
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-zinc-400">Game / tie actual</p>
          <p className="mt-1 text-3xl font-black">
            {partido.game_a} - {partido.game_b}
          </p>

          <p className="mt-3 text-sm text-zinc-400">
            Sacando:{" "}
            <span className="font-bold text-white">
              {partido.serving === "A" ? partido.team_a : partido.team_b}
            </span>
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <button
            onClick={() => onChangeServe(partido)}
            className="rounded-2xl border border-white/10 px-5 py-4 font-bold text-white"
          >
            Cambiar saque manualmente
          </button>

          <button
            onClick={() => onResetGame(partido)}
            className="rounded-2xl border border-red-400/40 px-5 py-4 font-bold text-red-300"
          >
            Borrar game actual
          </button>
        </div>
      </ControlSection>

      <ControlSection title="Formato del tercer set">
        <div className="grid gap-3 md:grid-cols-2">
          {(["Tercer set completo", "Super tiebreak"] as ModoTercerSet[]).map(
            (mode) => (
              <button
                key={mode}
                onClick={() => onChangeMode(partido, mode)}
                className={`rounded-2xl px-5 py-4 font-bold ${
                  partido.third_set_mode === mode
                    ? "text-black"
                    : "bg-white/10 text-white"
                }`}
                style={
                  partido.third_set_mode === mode
                    ? { backgroundColor: ACCENT }
                    : undefined
                }
              >
                {mode}
              </button>
            )
          )}
        </div>
      </ControlSection>
    </>
  );
}

function PickleballControls({
  partido,
  onPoint,
  onSaveSet,
  onChangeServe,
  onMinusPoint,
  onResetScore,
}: {
  partido: Partido;
  onPoint: (partido: Partido, ganador: "A" | "B") => void;
  onSaveSet: (partido: Partido) => void;
  onChangeServe: (partido: Partido) => void;
  onMinusPoint: (partido: Partido, lado: "A" | "B") => void;
  onResetScore: (partido: Partido) => void;
}) {
  return (
    <ControlSection title="Score Pickleball">
      <div className="grid gap-4 md:grid-cols-2">
        <button
          onClick={() => onPoint(partido, "A")}
          className="rounded-2xl px-5 py-5 font-black text-black"
          style={{ backgroundColor: ACCENT }}
        >
          + Punto {partido.team_a}
        </button>

        <button
          onClick={() => onPoint(partido, "B")}
          className="rounded-2xl px-5 py-5 font-black text-black"
          style={{ backgroundColor: ACCENT }}
        >
          + Punto {partido.team_b}
        </button>

        <button
          onClick={() => onMinusPoint(partido, "A")}
          className="rounded-2xl border border-red-400/40 px-5 py-4 font-bold text-red-300"
        >
          - Punto {partido.team_a}
        </button>

        <button
          onClick={() => onMinusPoint(partido, "B")}
          className="rounded-2xl border border-red-400/40 px-5 py-4 font-bold text-red-300"
        >
          - Punto {partido.team_b}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
        <p className="text-sm text-zinc-400">Score actual</p>
        <p className="mt-1 text-3xl font-black">
          {partido.game_a} - {partido.game_b}
        </p>

        <p className="mt-3 text-sm text-zinc-400">
          Sacando:{" "}
          <span className="font-bold text-white">
            {partido.serving === "A" ? partido.team_a : partido.team_b}
          </span>{" "}
          · Servidor {partido.server_number || 1}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <button
          onClick={() => onChangeServe(partido)}
          className="rounded-2xl border border-white/10 px-5 py-4 font-bold text-white"
        >
          Cambiar saque
        </button>

        <button
          onClick={() => onResetScore(partido)}
          className="rounded-2xl border border-red-400/40 px-5 py-4 font-bold text-red-300"
        >
          Reiniciar score
        </button>

        <button
          onClick={() => onSaveSet(partido)}
          className="rounded-2xl border border-white/10 px-5 py-4 font-bold text-white"
        >
          Guardar set ganado
        </button>
      </div>
    </ControlSection>
  );
}

function ScorePreview({
  partido,
  compact = false,
}: {
  partido: Partido;
  compact?: boolean;
}) {
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
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0f0c] shadow-2xl">
      <div
        className={`grid gap-2 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-zinc-500 ${
          sport === "padel"
            ? "grid-cols-[1fr_44px_44px_44px_64px]"
            : "grid-cols-[1fr_44px_44px_44px]"
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

      <div className={compact ? "space-y-2 p-3" : "space-y-3 p-4"}>
        <FilaScore
          sport={sport}
          name={partido.team_a}
          serving={partido.serving === "A"}
          sets={partido.sets.map((s) => s.a)}
          liveGame={partido.game_a}
          compact={compact}
          activeSetIndex={activeSetIndex}
        />

        <FilaScore
          sport={sport}
          name={partido.team_b}
          serving={partido.serving === "B"}
          sets={partido.sets.map((s) => s.b)}
          liveGame={partido.game_b}
          compact={compact}
          activeSetIndex={activeSetIndex}
        />
      </div>
    </div>
  );
}

function FilaScore({
  sport,
  name,
  serving,
  sets,
  liveGame,
  compact,
  activeSetIndex,
}: {
  sport: Sport;
  name: string;
  serving: boolean;
  sets: string[];
  liveGame: string;
  compact?: boolean;
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
      className={`grid items-center gap-2 rounded-3xl bg-black/40 ${
        sport === "padel"
          ? "grid-cols-[1fr_44px_44px_44px_64px]"
          : "grid-cols-[1fr_44px_44px_44px]"
      } ${compact ? "px-3 py-3 text-sm" : "px-4 py-5 text-base md:text-xl"}`}
    >
      <div className="flex min-w-0 items-center gap-3 font-black">
        <span
          className="shrink-0 rounded-full"
          style={{
            backgroundColor: serving ? ACCENT : "transparent",
            height: compact ? 10 : 14,
            width: compact ? 10 : 14,
          }}
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

function ControlSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <p className="mb-3 font-bold">{title}</p>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-zinc-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl border border-white/10 bg-white/10 p-4 outline-none focus:border-green-400"
      />
    </label>
  );
}

function EstadoBadge({ status }: { status: EstadoPartido }) {
  const styles = {
    Pendiente: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
    "En juego": "text-black",
    Terminado: "border-zinc-400/40 bg-zinc-400/10 text-zinc-300",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold ${styles[status]}`}
      style={
        status === "En juego"
          ? { backgroundColor: ACCENT, borderColor: ACCENT }
          : undefined
      }
    >
      {status}
    </span>
  );
}
