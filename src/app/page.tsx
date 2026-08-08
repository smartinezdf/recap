```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import supabase from "@/lib/supabase";

const ACCENT = "#3FCD31";

type Club = {
  id: string;
  name: string;
  logo_url?: string | null;
};

type Court = {
  id: string;
  club_id: string;
  name: string
  display_order?: number | null;
};

type ClubTimeRow = {
  id: string;
  club_id: string;
  time_slot: string;
};

type ClipRow = {
  id: string;
  club_id: string | null;
  court_id: string | null;
  device_id: string | null;
  video_url: string | null;
  storage_path: string | null;
  created_at: string;
  expires_at?: string | null;
};

function clsx(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

function formatTimeLabel(timeStr: string) {
  const [hhStr, mmStr] = timeStr.split(":");
  const hh = parseInt(hhStr, 10);
  const mm = parseInt(mmStr, 10);

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${pad(hh)}:${pad(mm)}`;
}

function formatSlotRangeLabel(timeStr: string, nextTimeStr?: string) {
  const start = formatTimeLabel(timeStr);

  if (nextTimeStr) {
    return `${start} - ${formatTimeLabel(nextTimeStr)}`;
  }

  if (timeStr === "21:30:00") {
    return `${start} - 23:30`;
  }

  return start;
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
    <div
      className={clsx(
        "rounded-3xl border border-zinc-200 bg-white shadow-sm",
        className
      )}
    >
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
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white"
      )}
    >
      <div
        className={clsx(
          "text-xs font-semibold",
          active ? "text-white/70" : "text-zinc-500"
        )}
      >
        {label}
      </div>

      <div
        className={clsx(
          "text-sm font-semibold",
          active ? "text-white" : "text-zinc-900"
        )}
      >
        {sub}
      </div>
    </div>
  );
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false);

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
        .order("display_order"), { ascending: true});

      console.log("COURTS DATA:", courtsData);

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

    const index = clubTimes.findIndex((t) => t.id === selectedTime.id);
    const nextTime = clubTimes[index + 1]?.time_slot;

    return formatSlotRangeLabel(selectedTime.time_slot, nextTime);
  }, [selectedTime, clubTimes]);

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
      console.log("===== RECAP SEARCH =====");
      console.log("Club:", selectedClub?.name);
      console.log("Club ID:", selectedClub?.id);
      console.log("Court:", selectedCourtName);
      console.log("Court ID:", selectedCourtId);
      console.log("Slot:", selectedTime.time_slot);

      const { data, error } = await supabase.rpc(
        "get_clips_for_slot_90min",
        {
          p_court_id: selectedCourtId,
          p_slot: selectedTime.time_slot,
        }
      );

      console.log("RPC DATA:", data);
      console.log("RPC ERROR:", error);

      if (error) {
        console.error("clips rpc error:", error);

        setStatusMsg(
          `No se pudieron cargar los clips. Error: ${error.message}`
        );

        return;
      }

      const rows = (data ?? []) as ClipRow[];

      console.log("CLIPS ENCONTRADOS:", rows.length);

      rows.forEach((clip, index) => {
        console.log(`CLIP ${index + 1}`, {
          id: clip.id,
          court_id: clip.court_id,
          created_at: clip.created_at,
          video_url: clip.video_url,
        });
      });

      setClips(rows);

      if (rows.length === 0) {
        setStatusMsg("Todavía no hay clips en ese horario.");
      }
    } catch (err) {
      console.error("handleSearch error:", err);
      setStatusMsg("Ocurrió un error buscando los clips.");
    } finally {
      setIsSearching(false);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    }
  };

  return (
    <main id="top" className="min-h-screen bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div
          className="absolute -top-28 left-1/2 h-80 w-[52rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `${ACCENT}33` }}
        />

        <div className="absolute top-56 left-[-10rem] h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute bottom-[-12rem] right-[-8rem] h-96 w-[34rem] rounded-full bg-white/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white px-5 py-4">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-zinc-200 px-4 py-3 text-xl text-black"
          >
            ☰
          </button>

          <a href="#top" className="absolute left-1/2 -translate-x-1/2">
            <img
              src="/RecapLogo.png"
              alt="Recap"
              className="h-14 object-contain sm:h-16"
            />
          </a>

          <div className="w-[54px]" />
        </div>

        {menuOpen && (
          <div className="mt-4 border-t border-zinc-200 pt-4">
            <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-2">
              <a
                href="#buscar"
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl bg-zinc-100 p-4 font-bold text-black transition hover:bg-zinc-200"
              >
                Clips
              </a>

              <a
                href="/live-score"
                className="rounded-2xl bg-zinc-100 p-4 font-bold text-black transition hover:bg-zinc-200"
              >
                Score en Vivo
              </a>
            </div>
          </div>
        )}
      </header>

      <section className="relative">
        <Shell>
          <div className="py-16 text-center md:py-24">
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              Tu jugada favorita
              <br />

              <span
                className="mt-4 inline-block"
                style={{ color: ACCENT }}
              >
                en un Recap
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-white/70 sm:text-lg">
              Tecnología inteligente diseñada para canchas deportivas.
              Presiona un botón y guarda tus mejores jugadas.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#que-es"
                className="rounded-full px-8 py-3 text-sm font-semibold text-zinc-950"
                style={{ background: ACCENT }}
              >
                ¿Qué es Recap?
              </a>

              <a
                href="#buscar"
                className="rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold hover:bg-white/10"
              >
                Buscar mis clips
              </a>
            </div>
          </div>
        </Shell>
      </section>

      <section id="video" className="pb-16 md:pb-20">
        <Shell>
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-bold sm:text-2xl">
                Recap en acción
              </h2>
            </div>

            <Glass className="p-6 sm:p-7">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <video
                  src="/video3.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="aspect-video w-full object-cover"
                  controls={false}
                />
              </div>
            </Glass>
          </div>
        </Shell>
      </section>

      <section
        id="experiencia"
        className="bg-zinc-100 text-zinc-950"
      >
        <Shell>
          <div className="py-14 md:py-16">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <h2 className="text-2xl font-bold sm:text-3xl">
                Encuentra tus clips en segundos.
              </h2>

              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 md:w-auto">
                <StepPill active={step === 1} label="Paso 1" sub="Club" />
                <StepPill active={step === 2} label="Paso 2" sub="Cancha" />
                <StepPill active={step === 3} label="Paso 3" sub="Horario" />
                <StepPill active={step === 4} label="Paso 4" sub="Clips" />
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  t: "Captura continua",
                  d: "Grabación inteligente sin que hagas nada.",
                },
                {
                  t: "Botón en cancha",
                  d: "Presionas y guardas tu jugada (últimos 45s).",
                },
                {
                  t: "Clips al instante",
                  d: "Míralo, descárgalo y compártelo.",
                },
              ].map((x) => (
                <LightCard key={x.t} className="p-6">
                  <div className="text-sm font-semibold">{x.t}</div>
                  <div className="mt-2 text-sm text-zinc-600">
                    {x.d}
                  </div>
                </LightCard>
              ))}
            </div>
          </div>
        </Shell>
      </section>

      <section id="que-es" className="bg-white text-zinc-950">
        <Shell>
          <div className="py-14 md:py-16">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="rounded-3xl bg-zinc-950 p-8 text-white sm:p-10">
                  <h3 className="text-2xl font-bold sm:text-3xl">
                    ¿Qué es{" "}
                    <span style={{ color: ACCENT }}>Recap</span>?
                  </h3>

                  <p className="mt-4 text-white/75">
                    Recap graba de forma continua y, con un botón,
                    guarda tu jugada más reciente.
                  </p>

                  <p className="mt-4 text-white/75">
                    Solo elige club, cancha y horario.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5">
                <LightCard className="p-8 sm:p-10">
                  <div className="font-semibold">¿Cómo funciona?</div>

                  <div className="mt-6 space-y-4">
                    {[
                      {
                        t: "1) Juega",
                        d: "Recap captura continuamente por ti.",
                      },
                      {
                        t: "2) Presiona el botón",
                        d: "Guardamos los últimos 45 segundos.",
                      },
                      {
                        t: "3) Encuentra tu clip",
                        d: "Club → Cancha → Horario.",
                      },
                    ].map((s) => (
                      <div
                        key={s.t}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                      >
                        <div className="font-semibold">{s.t}</div>
                        <div className="mt-2 text-sm text-zinc-600">
                          {s.d}
                        </div>
                      </div>
                    ))}
                  </div>
                </LightCard>
              </div>
            </div>
          </div>
        </Shell>
      </section>

      <section id="buscar" className="bg-zinc-950 text-white">
        <Shell>
          <div className="py-14 md:py-16">
            <div className="mb-10 text-center">
              <h2
                className="text-2xl font-extrabold sm:text-3xl"
                style={{ color: ACCENT }}
              >
                Encuentra tus clips aquí
              </h2>
            </div>

            <Glass className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold">Tu selección</div>

                  <div className="mt-1 text-sm text-white/70">
                    {selectedClub ? (
                      <>
                        {selectedClub.name}
                        {" • "}
                        {selectedCourtName ?? "elige cancha"}
                        {" • "}
                        {selectedTimeLabel ?? "elige horario"}
                      </>
                    ) : (
                      "Selecciona un club para empezar."
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetSelections}
                    className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold"
                  >
                    Restablecer
                  </button>

                  <button
                    onClick={handleSearch}
                    disabled={!selectedTime || isSearching}
                    className={clsx(
                      "rounded-full px-6 py-3 text-sm font-semibold",
                      selectedTime && !isSearching
                        ? "text-zinc-950"
                        : "cursor-not-allowed bg-white/10 text-white/40"
                    )}
                    style={
                      selectedTime && !isSearching
                        ? { background: ACCENT }
                        : undefined
                    }
                  >
                    {isSearching ? "Buscando..." : "Buscar clips"}
                  </button>
                </div>
              </div>
            </Glass>

            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <h3 className="text-lg font-semibold">Club</h3>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {clubs.map((club) => {
                    const isSelected = selectedClub?.id === club.id;

                    return (
                      <button
                        key={club.id}
                        onClick={() => setSelectedClub(club)}
                        className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 text-left"
                        style={
                          isSelected
                            ? {
                                boxShadow: `0 0 0 2px ${ACCENT}88`,
                              }
                            : undefined
                        }
                      >
                        <div className="font-semibold">{club.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-8 lg:col-span-7">
                <div>
                  <h3 className="text-lg font-semibold">Cancha</h3>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {courts.map((court) => {
                      const isSelected = selectedCourtId === court.id;

                      return (
                        <button
                          key={court.id}
                          onClick={() => {
                            console.log("COURT SELECTED:", {
                              name: court.name,
                              id: court.id,
                            });

                            setSelectedCourtId(court.id);
                            setSelectedTime(null);
                            setClips([]);
                            setHasSearched(false);
                            setStatusMsg(null);
                          }}
                          className="rounded-full border border-white/10 bg-white/[0.07] px-5 py-3 text-sm font-semibold"
                          style={
                            isSelected
                              ? {
                                  boxShadow: `0 0 0 2px ${ACCENT}88`,
                                }
                              : undefined
                          }
                        >
                          {court.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Horario</h3>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {clubTimes.map((t, index) => {
                      const nextTime = clubTimes[index + 1]?.time_slot;
                      const isSelected = selectedTime?.id === t.id;

                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            console.log("TIME SELECTED:", t.time_slot);

                            setSelectedTime(t);
                            setClips([]);
                            setHasSearched(false);
                            setStatusMsg(null);
                          }}
                          className="rounded-full border border-white/10 bg-white/[0.07] px-5 py-3 text-sm font-semibold"
                          style={
                            isSelected
                              ? {
                                  boxShadow: `0 0 0 2px ${ACCENT}88`,
                                }
                              : undefined
                          }
                        >
                          {formatSlotRangeLabel(
                            t.time_slot,
                            nextTime
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div ref={resultsRef} className="mt-14">
              {hasSearched && statusMsg && (
                <Glass className="mx-auto max-w-xl p-8 text-center">
                  <div className="font-semibold">{statusMsg}</div>
                </Glass>
              )}

              {clips.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Clips disponibles
                    </h3>

                    <div className="text-sm text-white/60">
                      {clips.length} clip
                      {clips.length === 1 ? "" : "s"}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {clips.map((clip) => {
                      const url = clip.video_url ?? "";

                      const filename = prettyFilenameFromISO(
                        clip.created_at
                      );

                      return (
                        <Glass key={clip.id} className="p-4">
                          {clip.video_url ? (
                            <video
                              className="w-full rounded-2xl border border-white/10"
                              controls
                              preload="metadata"
                              playsInline
                              src={clip.video_url}
                              onError={(e) => {
                                console.error(
                                  "VIDEO ERROR:",
                                  clip.video_url,
                                  e
                                );
                              }}
                            />
                          ) : (
                            <div className="flex h-44 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                              Clip sin video_url
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <p className="truncate text-xs text-white/60">
                              {new Date(
                                clip.created_at
                              ).toLocaleString("es-VE", {
                                timeZone: "America/Caracas",
                              })}
                            </p>

                            {clip.video_url && (
                              <div className="flex gap-2">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs"
                                >
                                  Abrir
                                </a>

                                <a
                                  href={`/api/download?url=${encodeURIComponent(
                                    url
                                  )}&name=${encodeURIComponent(filename)}`}
                                  className="rounded-full px-3 py-2 text-xs font-semibold text-zinc-950"
                                  style={{ background: ACCENT }}
                                >
                                  Descargar
                                </a>
                              </div>
                            )}
                          </div>
                        </Glass>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-16 text-center text-xs text-white/40">
              © {new Date().getFullYear()} Recap
            </div>
          </div>
        </Shell>
      </section>
    </main>
  );
}
```
