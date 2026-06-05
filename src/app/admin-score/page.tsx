"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const ACCENT = "#3FCD31";

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
const PUNTOS = ["0", "15", "30", "40", "AD", "GAME"];

function formularioVacio(cancha = "Cancha 1") {
  return {
    club: "Garana Padel",
    cancha,
    tournament: "",
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
  };
}

export default function AdminScorePage() {
  const [canchaSeleccionada, setCanchaSeleccionada] = useState("Cancha 1");
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [form, setForm] = useState(formularioVacio("Cancha 1"));
  const [partidoActivoId, setPartidoActivoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [cargando, setCargando] = useState(true);

  const partidosCancha = useMemo(
    () =>
      partidos.filter(
        (partido) =>
          String(partido.cancha || "").trim() === String(canchaSeleccionada).trim()
      ),
    [partidos, canchaSeleccionada]
  );

  const partidoActivo = partidos.find((partido) => partido.id === partidoActivoId);

  useEffect(() => {
    cargarPartidos();
  }, []);

  async function cargarPartidos() {
    setCargando(true);
    setErrorFormulario("");

    const { data, error } = await supabase
      .from("live_matches")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("LIVE MATCHES DATA:", data);
    console.log("LIVE MATCHES ERROR:", error);

    if (error) {
      setErrorFormulario(error.message);
      setPartidos([]);
    } else {
      setPartidos((data || []) as Partido[]);
    }

    setCargando(false);
  }

  function seleccionarCancha(cancha: string) {
    setCanchaSeleccionada(cancha);
    setForm(formularioVacio(cancha));
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
      form.round,
      form.match_time,
      form.team_a,
      form.team_b,
    ];

    if (requeridos.some((campo) => !campo.trim())) {
      setErrorFormulario(
        "Completa torneo, ronda, hora, Equipo A y Equipo B antes de guardar."
      );
      return false;
    }

    return true;
  }

  async function guardarPartido() {
    if (!validarFormulario()) return;

    if (editandoId) {
      const { error } = await supabase
        .from("live_matches")
        .update({
          club: "Garana Padel",
          cancha: canchaSeleccionada,
          tournament: form.tournament,
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
      setForm(formularioVacio(canchaSeleccionada));
      await cargarPartidos();
      setPartidoActivoId(idActualizado);
      return;
    }

    const { data, error } = await supabase
      .from("live_matches")
      .insert({
        club: "Garana Padel",
        cancha: canchaSeleccionada,
        tournament: form.tournament,
        round: form.round,
        match_time: form.match_time,
        team_a: form.team_a,
        team_b: form.team_b,
        status: form.status,
        third_set_mode: form.third_set_mode,
        sets: form.sets,
        game_a: form.game_a,
        game_b: form.game_b,
        serving: form.serving,
      })
      .select()
      .single();

    if (error) {
      setErrorFormulario(error.message);
      return;
    }

    setForm(formularioVacio(canchaSeleccionada));
    await cargarPartidos();
    setPartidoActivoId(data.id);
  }

  function editarPartido(partido: Partido) {
    setForm({
      club: partido.club,
      cancha: partido.cancha,
      tournament: partido.tournament,
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
    });

    setEditandoId(partido.id);
    setCanchaSeleccionada(partido.cancha);
    setPartidoActivoId(partido.id);
    setErrorFormulario("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm(formularioVacio(canchaSeleccionada));
    setErrorFormulario("");
  }

  async function actualizarPartido(id: string, cambios: Partial<Partido>) {
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

  function agregarSet(partido: Partido) {
    if (partido.sets.length >= 3) return;

    actualizarPartido(partido.id, {
      sets: [...partido.sets, { a: "0", b: "0" }],
    });
  }

  function quitarSet(partido: Partido) {
    if (partido.sets.length <= 1) return;

    actualizarPartido(partido.id, {
      sets: partido.sets.slice(0, -1),
    });
  }

  function actualizarSet(
    partido: Partido,
    index: number,
    lado: "a" | "b",
    valor: string
  ) {
    const nuevosSets = [...partido.sets];
    nuevosSets[index] = { ...nuevosSets[index], [lado]: valor };
    actualizarPartido(partido.id, { sets: nuevosSets });
  }

  return (
    <main className="min-h-screen bg-[#050806] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p
              className="text-xs uppercase tracking-[0.35em] font-bold"
              style={{ color: ACCENT }}
            >
              Garana Padel
            </p>
            <h1 className="text-2xl font-black">Control de Score</h1>
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
              <Input label="Torneo / Evento" value={form.tournament} onChange={(v) => actualizarForm("tournament", v)} />
              <Input label="Ronda" value={form.round} onChange={(v) => actualizarForm("round", v)} />
              <Input label="Hora" value={form.match_time} onChange={(v) => actualizarForm("match_time", v)} />
              <Input label="Equipo A" value={form.team_a} onChange={(v) => actualizarForm("team_a", v)} />
              <Input label="Equipo B" value={form.team_b} onChange={(v) => actualizarForm("team_b", v)} />

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
                No hay partidos creados para {canchaSeleccionada} hoy.
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
                          {partido.tournament} · {partido.match_time}
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
              <div className="mt-8">
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl">
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
                    <p className="text-zinc-400">{partidoActivo.cancha}</p>
                  </div>

                  <ControlSection title="Estado del partido">
                    <div className="grid gap-3 md:grid-cols-3">
                      {(["Pendiente", "En juego", "Terminado"] as EstadoPartido[]).map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() => actualizarPartido(partidoActivo.id, { status })}
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

                  <ControlSection title="Formato del tercer set">
                    <div className="grid gap-3 md:grid-cols-2">
                      {(["Tercer set completo", "Super tiebreak"] as ModoTercerSet[]).map(
                        (mode) => (
                          <button
                            key={mode}
                            onClick={() =>
                              actualizarPartido(partidoActivo.id, { third_set_mode: mode })
                            }
                            className={`rounded-2xl px-5 py-4 font-bold ${
                              partidoActivo.third_set_mode === mode
                                ? "text-black"
                                : "bg-white/10 text-white"
                            }`}
                            style={
                              partidoActivo.third_set_mode === mode
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

                  <ControlSection title="Score del game">
                    <div className="grid gap-4 md:grid-cols-2">
                      <BotonesPuntos
                        label={partidoActivo.team_a}
                        value={partidoActivo.game_a}
                        onChange={(value) =>
                          actualizarPartido(partidoActivo.id, { game_a: value })
                        }
                      />
                      <BotonesPuntos
                        label={partidoActivo.team_b}
                        value={partidoActivo.game_b}
                        onChange={(value) =>
                          actualizarPartido(partidoActivo.id, { game_b: value })
                        }
                      />
                    </div>
                  </ControlSection>

                  <ControlSection title="Equipo que saca">
                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        onClick={() => actualizarPartido(partidoActivo.id, { serving: "A" })}
                        className={`rounded-2xl px-5 py-4 font-bold ${
                          partidoActivo.serving === "A"
                            ? "text-black"
                            : "bg-white/10"
                        }`}
                        style={
                          partidoActivo.serving === "A"
                            ? { backgroundColor: ACCENT }
                            : undefined
                        }
                      >
                        ● {partidoActivo.team_a}
                      </button>
                      <button
                        onClick={() => actualizarPartido(partidoActivo.id, { serving: "B" })}
                        className={`rounded-2xl px-5 py-4 font-bold ${
                          partidoActivo.serving === "B"
                            ? "text-black"
                            : "bg-white/10"
                        }`}
                        style={
                          partidoActivo.serving === "B"
                            ? { backgroundColor: ACCENT }
                            : undefined
                        }
                      >
                        ● {partidoActivo.team_b}
                      </button>
                    </div>
                  </ControlSection>

                  <ControlSection title="Sets">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => agregarSet(partidoActivo)}
                        disabled={partidoActivo.sets.length >= 3}
                        className="rounded-full border px-4 py-2 text-sm disabled:opacity-30"
                        style={{ borderColor: ACCENT, color: ACCENT }}
                      >
                        + Agregar set
                      </button>

                      <button
                        onClick={() => quitarSet(partidoActivo)}
                        disabled={partidoActivo.sets.length <= 1}
                        className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 disabled:opacity-30"
                      >
                        Quitar set
                      </button>
                    </div>

                    <div className="space-y-3">
                      {partidoActivo.sets.map((set, index) => (
                        <div
                          key={index}
                          className="grid gap-3 rounded-2xl bg-black/35 p-3 sm:grid-cols-[110px_1fr_1fr]"
                        >
                          <div className="flex items-center text-sm text-zinc-400">
                            {index === 2 &&
                            partidoActivo.third_set_mode === "Super tiebreak"
                              ? "Super TB"
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
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function ScorePreview({
  partido,
  compact = false,
}: {
  partido: Partido;
  compact?: boolean;
}) {
  const showSet3 = Boolean(partido.sets[2]);
  const tercerSetLabel = partido.third_set_mode === "Super tiebreak" ? "TB" : "S3";

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0f0c] shadow-2xl">
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

      <div className={compact ? "space-y-2 p-3" : "space-y-3 p-4"}>
        <FilaScore
          name={partido.team_a}
          serving={partido.serving === "A"}
          sets={partido.sets.map((s) => s.a)}
          game={partido.game_a}
          showSet3={showSet3}
          compact={compact}
        />

        <FilaScore
          name={partido.team_b}
          serving={partido.serving === "B"}
          sets={partido.sets.map((s) => s.b)}
          game={partido.game_b}
          showSet3={showSet3}
          compact={compact}
        />
      </div>
    </div>
  );
}

function FilaScore({
  name,
  serving,
  sets,
  game,
  showSet3,
  compact,
}: {
  name: string;
  serving: boolean;
  sets: string[];
  game: string;
  showSet3: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid items-center gap-2 rounded-3xl bg-black/40 ${
        showSet3
          ? "grid-cols-[1fr_44px_44px_44px_56px]"
          : "grid-cols-[1fr_44px_44px_56px]"
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

      <div className="text-center font-black">{sets[0] ?? "0"}</div>
      <div className="text-center font-black">{sets[1] ?? "0"}</div>
      {showSet3 && <div className="text-center font-black">{sets[2] ?? "0"}</div>}

      <div
        className="text-center text-xl font-black md:text-2xl"
        style={{ color: ACCENT }}
      >
        {game}
      </div>
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

function BotonesPuntos({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-black/35 p-4">
      <p className="mb-3 font-bold">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {PUNTOS.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-xl py-3 font-black ${
              value === option ? "text-black" : "bg-white/10 text-white"
            }`}
            style={value === option ? { backgroundColor: ACCENT } : undefined}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
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
