"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import supabase from "@/lib/supabase";

const ACCENT = "#3FCD31"; // ✅ Verde marca (RGB 63,205,49)

type Club = { id: string; name: string; logo_url?: string | null };
type Court = { id: string; club_id: string; name: string };

type ClubTimeRow = {
  id: string;
  club_id: string;
  time_slot: string; // "07:00:00"
};

type ClipRow = {
  id: string;
  club_id: string | null;
  court_id: string | null;
  device_id: string | null;
  video_url: string | null;
  storage_path: string | null;
  created_at: string; // timestamptz ISO
};

function clsx(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

function formatSlotRangeLabel(timeStr: string) {
  const [hhStr, mmStr] = timeStr.split(":");
  const hh = parseInt(hhStr, 10);
  const mm = parseInt(mmStr, 10);

  const startMinutes = hh * 60 + mm;
  const endMinutes = startMinutes + 90;

  const endH = Math.floor(endMinutes / 60) % 24;
  const endM = endMinutes % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)} - ${pad(endH)}:${pad(endM)}`;
}

function prettyFilenameFromISO(iso: string) {
  const d = new Date(iso);

  const datePart = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

  const timePart = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Caracas",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(/:/g, "-");

  return `Recap_${datePart}_${timePart}.mp4`;
}

/** Layout helpers */
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-6">{children}</div>;
}

function Glass({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-3xl border border-white/10 bg-white/[0.08] backdrop-blur",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.03)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function LightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-3xl border border-zinc-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

function StepPill({
  active,
  label,
  sub,
}: {
  active: boolean;
  label: string;
  sub: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border px-4 py-3",
        active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"
      )}
    >
      <div className={clsx("text-xs font-semibold", active ? "text-white/70" : "text-zinc-500")}>
        {label}
      </div>
      <div className={clsx("text-sm font-semibold", active ? "text-white" : "text-zinc-900")}>
        {sub}
      </div>
    </div>
  );
}

export default function Page() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [clubTimes, setClubTimes] = useState<ClubTimeRow[]>([]);
  const [clips, setClips] = useState<ClipRow[]>([]);

  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<ClubTimeRow | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement | null>(null);

  // --- Load clubs ---
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select("id,name,logo_url")
        .order("name");

      if (error) {
        console.error("clubs error:", error);
        setStatusMsg("Error cargando clubes.");
        return;
      }
      setClubs((data ?? []) as Club[]);
    })();
  }, []);

  // --- When club changes: load courts + times ---
  useEffect(() => {
    if (!selectedClub?.id) return;

    setSelectedCourtId(null);
    setSelectedTime(null);
    setClips([]);
    setHasSearched(false);
    setStatusMsg(null);

    (async () => {
      const { data: courtsData, error: courtsErr } = await supabase
        .from("courts")
        .select("id,club_id,name")
        .eq("club_id", selectedClub.id)
        .order("name");

      if (courtsErr) {
        console.error("courts error:", courtsErr);
        setStatusMsg("Error cargando canchas.");
      } else {
        setCourts((courtsData ?? []) as Court[]);
      }

      const { data: timesData, error: timesErr } = await supabase
        .from("club_times")
        .select("id,club_id,time_slot")
        .eq("club_id", selectedClub.id)
        .order("time_slot");

      if (timesErr) {
        console.error("club_times error:", timesErr);
        setStatusMsg("Error cargando horarios.");
      } else {
        setClubTimes((timesData ?? []) as ClubTimeRow[]);
      }
    })();
  }, [selectedClub?.id]);

  const selectedCourtName = useMemo(() => {
    if (!selectedCourtId) return null;
    return courts.find((c) => c.id === selectedCourtId)?.name ?? null;
  }, [selectedCourtId, courts]);

  const selectedTimeLabel = useMemo(() => {
    if (!selectedTime) return null;
    return formatSlotRangeLabel(selectedTime.time_slot);
  }, [selectedTime]);

  const step = useMemo(() => {
    if (!selectedClub) return 1;
    if (!selectedCourtId) return 2;
    if (!selectedTime) return 3;
    return 4;
  }, [selectedClub, selectedCourtId, selectedTime]);

  const resetSelections = () => {
    setSelectedClub(null);
    setSelectedCourtId(null);
    setSelectedTime(null);
    setCourts([]);
    setClubTimes([]);
    setClips([]);
    setHasSearched(false);
    setStatusMsg(null);
  };

  const handleSearch = async () => {
    if (!selectedCourtId || !selectedTime) return;

    setIsSearching(true);
    setHasSearched(true);
    setStatusMsg(null);
    setClips([]);

    try {
      const { data, error } = await supabase.rpc("get_clips_for_slot_90min", {
        p_court_id: selectedCourtId,
        p_slot: selectedTime.time_slot,
      });

      if (error) {
        console.error("clips rpc error:", error);
        setStatusMsg("No se pudieron cargar los clips (revisa permisos/RLS).");
        return;
      }

      const rows = (data ?? []) as ClipRow[];
      setClips(rows);
      if (rows.length === 0) setStatusMsg("Todavía no hay clips en ese horario.");
    } finally {
      setIsSearching(false);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  };

  return (
    <main id="top" className="min-h-screen bg-zinc-950 text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div
          className="absolute -top-28 left-1/2 h-80 w-[52rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `${ACCENT}33` }}
        />
        <div className="absolute top-56 left-[-10rem] h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-8rem] h-96 w-[34rem] rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Header (logo bigger) */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <a href="#top" className="block">
          <Shell>
            <div className="py-3 flex justify-center">
              <img
                src="/RecapLogo.png"
                alt="Recap"
                className="h-14 sm:h-16 object-contain cursor-pointer"
              />
            </div>
          </Shell>
        </a>
      </header>

      {/* HERO (updated copy + cleaner) */}
      <section className="relative">
        <Shell>
          <div className="py-16 md:py-24 text-center">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
              Tu jugada favorita
              <br />
              <span className="inline-block mt-4" style={{ color: ACCENT }}>
                en un Recap
              </span>
            </h1>

            <p className="mt-7 text-white/70 sm:text-lg leading-relaxed max-w-3xl mx-auto">
              Tecnología inteligente diseñada para canchas deportivas. Presiona un botón y guarda tu mejor jugada.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#que-es"
                className="rounded-full px-8 py-3 text-sm font-semibold transition text-zinc-950"
                style={{ background: ACCENT }}
              >
                ¿Qué es Recap?
              </a>
              <a
                href="#buscar"
                className="rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold hover:bg-white/10 transition"
              >
                Buscar mis clips
              </a>
            </div>
          </div>
        </Shell>
      </section>

      {/* VIDEO SECTION (remove extra helper text) */}
      <section id="video" className="pb-16 md:pb-20">
        <Shell>
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 text-center">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Recap en acción</h2>
            </div>

            <Glass className="p-6 sm:p-7">
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                {/* Cuando tengas el video, reemplaza este div por <video ... /> */}
                <div className="aspect-video grid place-items-center">
                  <div className="text-center px-6">
                    <div className="text-sm font-semibold">Video demo (próximamente)</div>
                    <div className="mt-2 text-xs text-white/60">Muestra real jugando + el momento del botón.</div>
                  </div>
                </div>
              </div>
            </Glass>
          </div>
        </Shell>
      </section>

      {/* EXPERIENCE STRIP */}
      <section id="experiencia" className="bg-zinc-100 text-zinc-950">
        <Shell>
          <div className="py-14 md:py-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Encuentra tus clips en segundos.</h2>
                
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
                <StepPill active={step === 1} label="Paso 1" sub="Club" />
                <StepPill active={step === 2} label="Paso 2" sub="Cancha" />
                <StepPill active={step === 3} label="Paso 3" sub="Horario" />
                <StepPill active={step === 4} label="Paso 4" sub="Clips" />
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { t: "Captura continua", d: "Grabación inteligente sin que hagas nada." },
                { t: "Botón en cancha", d: "Presionas y guardas tu jugada (últimos 45s)." },
                { t: "Clips al instante", d: "Míralo, descárgalo y compártelo." },
              ].map((x) => (
                <LightCard key={x.t} className="p-6">
                  <div className="text-sm font-semibold">{x.t}</div>
                  <div className="mt-2 text-sm text-zinc-600">{x.d}</div>
                </LightCard>
              ))}
            </div>
          </div>
        </Shell>
      </section>

      {/* MID “R” badge */}
      <section className="bg-white">
        <Shell>
          <div className="py-10 flex justify-center">
            <div className="group relative">
              <div className="h-28 w-28 rounded-full border border-zinc-200 bg-white shadow-sm p-2" id="recap-badge">
                <img
                  src="/RecapR.png"
                  alt="Recap mark"
                  className="h-full w-full rounded-full object-cover transition-transform duration-700 group-hover:rotate-180"
                />
              </div>
              <div
                className="pointer-events-none absolute -inset-8 rounded-full blur-2xl opacity-60"
                style={{ background: `${ACCENT}22` }}
              />
            </div>
          </div>
        </Shell>
      </section>

      {/* WHAT IS RECAP + HOW IT WORKS */}
      <section id="que-es" className="bg-white text-zinc-950">
        <Shell>
          <div className="py-14 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              <div className="lg:col-span-7">
                <div className="rounded-3xl border border-white/10 bg-zinc-950 text-white shadow-sm p-8 sm:p-10">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
                    <span className="h-2 w-2 rounded-full" style={{ background: ACCENT }} />
                    Tecnología inteligente para canchas deportivas
                  </div>

                  <h3 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight">
                    ¿Qué es <span style={{ color: ACCENT }}>Recap</span>?
                  </h3>

                  <p className="mt-4 text-white/75 leading-relaxed">
                    Recap es tecnología inteligente para canchas deportivas. Graba de forma continua y, con un solo botón, guarda tu mejor jugada para que la encuentres y la descargues al instante.
                  </p>

                  <p className="mt-4 text-white/75 leading-relaxed">
                    Solo elige <span className="text-white font-semibold">club</span>,{" "}
                    <span className="text-white font-semibold">cancha</span> y{" "}
                    <span className="text-white font-semibold">horario</span>. Listo.
                  </p>

                  <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: `${ACCENT}55`, background: `${ACCENT}12` }}>
                    <div className="text-sm font-semibold">Dato importante</div>
                    <div className="mt-1 text-sm text-white/80">
                      Los clips solo están disponibles el mismo día que jugaste. Descárgalos hoy y compártelos.
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <LightCard className="p-8 sm:p-10">
                  <div className="text-sm font-semibold">¿Cómo funciona?</div>

                  <div className="mt-6 space-y-4">
                    {[
                      { t: "1) Juega", d: "Recap captura continuamente por ti." },
                      { t: "2) Presiona el botón", d: "Guardamos los últimos 45 segundos." },
                      { t: "3) Encuentra tu clip", d: "Club → Cancha → Horario. Descarga y comparte." },
                    ].map((s) => (
                      <div key={s.t} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold">{s.t}</div>
                          <span className="h-2 w-2 rounded-full" style={{ background: ACCENT }} />
                        </div>
                        <div className="mt-2 text-sm text-zinc-600">{s.d}</div>
                      </div>
                    ))}
                  </div>

                  <a
                    href="#buscar"
                    className="mt-7 inline-flex w-full items-center justify-center rounded-full px-7 py-3 text-sm font-semibold text-zinc-950 transition"
                    style={{ background: ACCENT }}
                  >
                    Buscar mis clips
                  </a>

                  <div className="mt-4 text-xs text-zinc-500 text-center">Simple. Rápido. Listo.</div>
                </LightCard>
              </div>
            </div>
          </div>
        </Shell>
      </section>

      {/* SEARCH EXPERIENCE */}
      <section id="buscar" className="bg-zinc-950 text-white">
        <Shell>
          <div className="py-14 md:py-16">
            {/* Title: green + centered */}
            <div className="mb-10 text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: ACCENT }}>
                Encuentra tus clips aquí
              </h2>
              <p className="mt-3 text-white/65 max-w-2xl mx-auto">
                Selecciona el club, luego la cancha y por último el horario en el que jugaste. Cuando estés listo,
                presiona <span className="text-white font-semibold">Buscar clips</span>.
              </p>
            </div>

            {/* Sticky selection bar */}
            <div className="sticky top-[64px] z-40">
              <Glass className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">Tu selección</div>
                    <div className="mt-1 text-sm text-white/70">
                      {selectedClub ? (
                        <>
                          <span className="text-white">{selectedClub.name}</span>
                          {" • "}
                          <span className={clsx(selectedCourtName ? "text-white" : "text-white/50")}>
                            {selectedCourtName ?? "elige cancha"}
                          </span>
                          {" • "}
                          <span className={clsx(selectedTimeLabel ? "text-white" : "text-white/50")}>
                            {selectedTimeLabel ?? "elige horario"}
                          </span>
                        </>
                      ) : (
                        <>Selecciona un club para empezar.</>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={resetSelections}
                      className="rounded-full px-6 py-3 text-sm font-semibold transition border border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      Restablecer
                    </button>

                    <button
                      onClick={handleSearch}
                      disabled={!selectedTime || isSearching}
                      className={clsx(
                        "rounded-full px-6 py-3 text-sm font-semibold transition",
                        selectedTime && !isSearching
                          ? "text-zinc-950"
                          : "bg-white/10 text-white/40 cursor-not-allowed"
                      )}
                      style={selectedTime && !isSearching ? { background: ACCENT } : undefined}
                    >
                      {isSearching ? "Buscando..." : "Buscar clips"}
                    </button>
                  </div>
                </div>
              </Glass>
            </div>

            {/* Selection blocks */}
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Clubs */}
              <div className="lg:col-span-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-semibold">Club</h3>
                  <div className="text-xs font-semibold" style={{ color: ACCENT }}>
                    Paso 1
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clubs.map((club) => {
                    const isSelected = selectedClub?.id === club.id;
                    return (
                      <button
                        key={club.id}
                        onClick={() => setSelectedClub(club)}
                        className={clsx(
                          "rounded-3xl border p-4 text-left transition",
                          "border-white/10 bg-white/[0.07] hover:bg-white/[0.10]",
                          isSelected && "bg-white/[0.12]"
                        )}
                        style={isSelected ? { boxShadow: `0 0 0 2px ${ACCENT}88` } : undefined}
                      >
                        <div className="flex items-center gap-3">
                          {club.logo_url ? (
                            <img
                              src={club.logo_url}
                              alt={`${club.name} logo`}
                              className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-white/10 grid place-items-center text-sm font-semibold text-white/80 ring-1 ring-white/10">
                              {(club.name?.[0] ?? "C").toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{club.name}</div>
                            <div className="text-xs text-white/60">{isSelected ? "Seleccionado" : "Toca para elegir"}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Courts + Times */}
              <div className="lg:col-span-7 space-y-8">
                {/* Courts */}
                <div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold">Cancha</h3>
                    <div className="text-xs font-semibold" style={{ color: ACCENT }}>
                      Paso 2
                    </div>
                  </div>

                  {!selectedClub ? (
                    <Glass className="mt-4 p-5 text-sm text-white/60">Selecciona un club para ver las canchas.</Glass>
                  ) : courts.length === 0 ? (
                    <Glass className="mt-4 p-5 text-sm text-white/60">
                      Aún no hay canchas configuradas para este club.
                    </Glass>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {courts.map((court) => {
                        const isSelected = selectedCourtId === court.id;
                        return (
                          <button
                            key={court.id}
                            onClick={() => {
                              setSelectedCourtId(court.id);
                              setSelectedTime(null);
                              setClips([]);
                              setHasSearched(false);
                              setStatusMsg(null);
                            }}
                            className="rounded-full border px-5 py-3 text-sm font-semibold transition border-white/10 bg-white/[0.07] hover:bg-white/[0.10]"
                            style={isSelected ? { boxShadow: `0 0 0 2px ${ACCENT}88` } : undefined}
                          >
                            {court.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Times */}
                <div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold">Horario</h3>
                    <div className="text-xs font-semibold" style={{ color: ACCENT }}>
                      Paso 3
                    </div>
                  </div>

                  {!selectedCourtId ? (
                    <Glass className="mt-4 p-5 text-sm text-white/60">Selecciona una cancha para ver los horarios.</Glass>
                  ) : clubTimes.length === 0 ? (
                    <Glass className="mt-4 p-5 text-sm text-white/60">No hay horarios configurados para este club.</Glass>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {clubTimes.map((t) => {
                        const isSelected = selectedTime?.id === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedTime(t);
                              setClips([]);
                              setHasSearched(false);
                              setStatusMsg(null);
                            }}
                            className="rounded-full border px-5 py-3 text-sm font-semibold transition border-white/10 bg-white/[0.07] hover:bg-white/[0.10]"
                            style={isSelected ? { boxShadow: `0 0 0 2px ${ACCENT}88` } : undefined}
                          >
                            {formatSlotRangeLabel(t.time_slot)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results */}
            <div ref={resultsRef} className="mt-14">
              {hasSearched && statusMsg && (
                <Glass className="mx-auto max-w-xl p-8 text-center">
                  <div className="text-base font-semibold">{statusMsg}</div>
                  <div className="mt-2 text-sm text-white/60">
                    Prueba otro horario o revisa si el sistema estaba grabando.
                  </div>
                </Glass>
              )}

              {clips.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold">Clips disponibles</h3>
                    <div className="text-sm text-white/60">
                      {clips.length} clip{clips.length === 1 ? "" : "s"}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {clips.map((clip) => {
                      const url = clip.video_url ?? "";
                      const filename = prettyFilenameFromISO(clip.created_at);

                      return (
                        <Glass key={clip.id} className="p-4">
                          {clip.video_url ? (
                            <video
                              className="w-full rounded-2xl border border-white/10"
                              controls
                              preload="metadata"
                              src={clip.video_url}
                            />
                          ) : (
                            <div className="h-44 w-full rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-sm text-white/60">
                              Clip sin video_url
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <p className="text-xs text-white/60 truncate">
                              {new Date(clip.created_at).toLocaleString("es-VE", { timeZone: "America/Caracas" })}
                            </p>

                            {clip.video_url && (
                              <div className="flex items-center gap-2 shrink-0">
                                <a
                                  className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition"
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Abrir
                                </a>

                                <a
                                  className="text-xs rounded-full px-3 py-2 transition text-zinc-950 font-semibold"
                                  style={{ background: ACCENT }}
                                  href={`/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`}
                                >
                                  Descargar
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 text-xs text-white/50">Compártelo en tus redes y etiquétanos ✨</div>
                        </Glass>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-16 text-center text-xs text-white/40">© {new Date().getFullYear()} Recap</div>
          </div>
        </Shell>
      </section>

      {/* subtle animations */}
      <style jsx global>{`
        #recap-badge {
          animation: recapFloat 6.5s ease-in-out infinite;
        }
        @keyframes recapFloat {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </main>
  );
}
