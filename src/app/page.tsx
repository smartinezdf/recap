"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
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
  name: string;
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

  return pad(hh) + ":" + pad(mm);
}

function formatSlotRangeLabel(timeStr: string, nextTimeStr?: string) {
  const start = formatTimeLabel(timeStr);

  if (nextTimeStr) {
    return start + " - " + formatTimeLabel(nextTimeStr);
  }

  if (timeStr === "21:30:00") {
    return start + " - 23:30";
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

  return "Recap_" + datePart + "_" + timePart + ".mp4";
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

export function HomePage({ premiumTop = false }: { premiumTop?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"es" | "en">("es");

  const ui = language === "en"
    ? {
        about: "What is Recap?",
        demo: "See it in action",
        liveScore: "Live Score",
        findClips: "Find my clips",
        heroTitle: "Your favorite play,",
        heroAccent: "in one Recap.",
        heroBody:
          "Smart technology built for sports courts. Press one button and save your best plays.",
        videoEyebrow: "Recap in action",
        videoTitle: "Your play, ready to share.",
        findSeconds: "Find your clips in seconds.",
        step: "Step",
        court: "Court",
        time: "Time",
        continuous: "Continuous capture",
        continuousText: "Smart recording that works while you play.",
        button: "On-court button",
        buttonText: "Press it and save your most recent play (last 45s).",
        instant: "Instant clips",
        instantText: "Watch, download and share.",
        whatIs: "What is",
        whatText:
          "Recap records continuously and saves your most recent play with one button.",
        chooseText: "Just choose your club, court and time.",
        availabilityNote:
          "Clips are available only on the day you played. Download them before leaving the court.",
        how: "How does it work?",
        play: "1) Play",
        playText: "Recap captures continuously for you.",
        press: "2) Press the button",
        pressText: "We save the last 45 seconds.",
        locate: "3) Find your clip",
        locateText: "Club → Court → Time.",
        findHere: "Find your clips here",
        selection: "Your selection",
        chooseCourt: "choose a court",
        chooseTime: "choose a time",
        selectClub: "Select a club to begin.",
        reset: "Reset",
        searching: "Searching...",
        search: "Find clips",
        available: "Available clips",
        clip: "clip",
        clips: "clips",
        open: "Open",
        download: "Download",
        noVideo: "Clip without video_url",
        noClips: "There are no clips in that time slot yet.",
        searchError: "Clips could not be loaded. Error: ",
        generalError: "Something went wrong while searching for clips.",
      }
    : {
        about: "¿Qué es Recap?",
        demo: "Ver en acción",
        liveScore: "Score en Vivo",
        findClips: "Buscar mis clips",
        heroTitle: "Tu jugada favorita,",
        heroAccent: "en un Recap.",
        heroBody:
          "Tecnología inteligente diseñada para canchas deportivas. Presiona un botón y guarda tus mejores jugadas.",
        videoEyebrow: "Recap en acción",
        videoTitle: "Tu jugada, lista para compartir.",
        findSeconds: "Encuentra tus clips en segundos.",
        step: "Paso",
        court: "Cancha",
        time: "Horario",
        continuous: "Captura continua",
        continuousText: "Grabación inteligente sin que hagas nada.",
        button: "Botón en cancha",
        buttonText: "Presionas y guardas tu jugada (últimos 45s).",
        instant: "Clips al instante",
        instantText: "Míralo, descárgalo y compártelo.",
        whatIs: "¿Qué es",
        whatText:
          "Recap graba de forma continua y, con un botón, guarda tu jugada más reciente.",
        chooseText: "Solo elige club, cancha y horario.",
        availabilityNote:
          "Los clips están disponibles únicamente el día que jugaste. Descárgalos antes de salir de la cancha.",
        how: "¿Cómo funciona?",
        play: "1) Juega",
        playText: "Recap captura continuamente por ti.",
        press: "2) Presiona el botón",
        pressText: "Guardamos los últimos 45 segundos.",
        locate: "3) Encuentra tu clip",
        locateText: "Club → Cancha → Horario.",
        findHere: "Encuentra tus clips aquí",
        selection: "Tu selección",
        chooseCourt: "elige cancha",
        chooseTime: "elige horario",
        selectClub: "Selecciona un club para empezar.",
        reset: "Restablecer",
        searching: "Buscando...",
        search: "Buscar clips",
        available: "Clips disponibles",
        clip: "clip",
        clips: "clips",
        open: "Abrir",
        download: "Descargar",
        noVideo: "Clip sin video_url",
        noClips: "Todavía no hay clips en ese horario.",
        searchError: "No se pudieron cargar los clips. Error: ",
        generalError: "Ocurrió un error buscando los clips.",
      };

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
        .select("id,club_id,name,display_order")
        .eq("club_id", selectedClub.id)
        .order("display_order", {
          ascending: true,
          nullsFirst: false,
        });

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

        setStatusMsg(ui.searchError + error.message);

        return;
      }

      const rows = (data ?? []) as ClipRow[];

      console.log("CLIPS ENCONTRADOS:", rows.length);

      rows.forEach((clip, index) => {
        console.log("CLIP " + (index + 1), {
          id: clip.id,
          court_id: clip.court_id,
          created_at: clip.created_at,
          video_url: clip.video_url,
        });
      });

      setClips(rows);

      if (rows.length === 0) {
        setStatusMsg(ui.noClips);
      }
    } catch (err) {
      console.error("handleSearch error:", err);
      setStatusMsg(ui.generalError);
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
    <main id="top" className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {!premiumTop && <div className="pointer-events-none fixed inset-0 opacity-40">
        <div
          className="absolute -top-28 left-1/2 h-80 w-[52rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: ACCENT + "33" }}
        />

        <div className="absolute top-56 left-[-10rem] h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute bottom-[-12rem] right-[-8rem] h-96 w-[34rem] rounded-full bg-white/10 blur-3xl" />
      </div>}

      {premiumTop ? (
        <>
          <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
              <a href="#top" aria-label="Recap home" className="relative z-10">
                <img
                  src="/RecapLogo.png"
                  alt="Recap"
                  className="h-9 w-auto object-contain sm:h-10"
                />
              </a>

              <nav className="hidden items-center gap-8 text-[13px] font-normal text-zinc-600 md:flex">
                <a href="#que-es" className="transition hover:text-zinc-950">
                  {ui.about}
                </a>
                <a
                  href="/live-score"
                  className="transition hover:text-zinc-950"
                >
                  {ui.liveScore}
                </a>
              </nav>

              <div className="hidden items-center gap-2 md:flex">
                <div className="flex rounded-full border border-zinc-200 p-1 text-[11px]">
                  {(["es", "en"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setLanguage(option)}
                      className={clsx(
                        "rounded-full px-2.5 py-1 transition",
                        language === option
                          ? "bg-zinc-950 text-white"
                          : "text-zinc-500 hover:text-zinc-950"
                      )}
                    >
                      {option.toUpperCase()}
                    </button>
                  ))}
                </div>
                <a
                  href="#buscar"
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-zinc-950 transition hover:opacity-90"
                  style={{ background: ACCENT }}
                >
                  {ui.findClips}
                  <ArrowRight size={15} />
                </a>
              </div>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative z-10 grid h-9 w-9 place-items-center rounded-full text-zinc-950 md:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

            {menuOpen && (
              <nav className="mx-auto mt-3 grid max-w-6xl gap-1.5 rounded-3xl border border-zinc-200 bg-white p-2 shadow-xl shadow-black/10 md:hidden">
                <div className="mb-1 flex items-center justify-between px-3 py-2 text-xs text-zinc-500">
                  <span>Language</span>
                  <div className="flex rounded-full border border-zinc-200 p-1">
                    {(["es", "en"] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => setLanguage(option)}
                        className={clsx(
                          "rounded-full px-3 py-1.5",
                          language === option
                            ? "bg-zinc-950 text-white"
                            : "text-zinc-500"
                        )}
                      >
                        {option.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <a
                  href="#buscar"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-zinc-950"
                  style={{ background: ACCENT }}
                >
                  {ui.findClips} <ArrowRight size={16} />
                </a>
                <a
                  href="#que-es"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm text-zinc-700"
                >
                  {ui.about}
                </a>
                <a
                  href="/live-score"
                  className="rounded-2xl px-4 py-3 text-sm text-zinc-700"
                >
                  {ui.liveScore}
                </a>
              </nav>
            )}
          </header>

          <section className="overflow-hidden border-b border-white/10 bg-[#0b0c0e]">
            <div className="mx-auto max-w-6xl px-5 pb-14 pt-14 text-center sm:px-6 sm:pb-20 sm:pt-20 lg:pt-24">
              <h1 className="mx-auto max-w-4xl text-[2.75rem] font-normal leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.6rem]">
                {ui.heroTitle}
                <span className="block text-white/[0.42]">{ui.heroAccent}</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-[15px] font-normal leading-7 text-white/55 sm:text-lg">
                {ui.heroBody}
              </p>

              <div className="mt-8 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center">
                <a
                  href="#buscar"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium text-zinc-950 transition hover:opacity-90"
                  style={{ background: ACCENT }}
                >
                  {ui.findClips}
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#que-es"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-normal text-white/75 transition hover:bg-white/5 hover:text-white"
                >
                  {ui.about}
                </a>
              </div>

              <div id="video" className="mt-12 scroll-mt-28 sm:mt-16">
                <div className="mb-4 flex items-end justify-between text-left sm:mb-5">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40 sm:text-xs">
                      {ui.videoEyebrow}
                    </div>
                    <div className="mt-1 text-lg font-normal text-white sm:text-2xl">
                      {ui.videoTitle}
                    </div>
                  </div>
                  <div className="mb-1 h-px w-12 sm:w-20" style={{ background: ACCENT }} />
                </div>

                <div className="rounded-[1.25rem] border border-white/15 bg-white/[0.04] p-1.5 shadow-[0_28px_90px_rgba(0,0,0,.45)] sm:rounded-[1.6rem] sm:p-2">
                  <div className="relative overflow-hidden rounded-[0.9rem] bg-black sm:rounded-[1.1rem]">
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
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-white/75 backdrop-blur-md sm:bottom-5 sm:left-5 sm:text-xs">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
                      Recap
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
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
        </>
      )}

      <section
        id="experiencia"
        className={premiumTop ? "order-2 bg-white text-zinc-950" : "bg-zinc-100 text-zinc-950"}
      >
        <Shell>
          <div className={premiumTop ? "py-20 md:py-28" : "py-14 md:py-16"}>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <h2 className={premiumTop ? "max-w-xl text-3xl font-normal tracking-[-0.03em] sm:text-5xl" : "text-2xl font-bold sm:text-3xl"}>
                {ui.findSeconds}
              </h2>

              {premiumTop ? (
                <div className="grid w-full grid-cols-4 border-y border-zinc-200 md:w-auto md:min-w-[28rem]">
                  {["Club", ui.court, ui.time, "Clips"].map((label, index) => (
                    <div key={label} className="py-3 text-center">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="mt-1 text-xs font-medium text-zinc-800 sm:text-sm">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 md:w-auto">
                  <StepPill active={step === 1} label={`${ui.step} 1`} sub="Club" />
                  <StepPill active={step === 2} label={`${ui.step} 2`} sub={ui.court} />
                  <StepPill active={step === 3} label={`${ui.step} 3`} sub={ui.time} />
                  <StepPill active={step === 4} label={`${ui.step} 4`} sub="Clips" />
                </div>
              )}
            </div>

            <div className={premiumTop ? "mt-14 grid grid-cols-1 border-t border-zinc-200 md:grid-cols-3" : "mt-10 grid grid-cols-1 gap-4 md:grid-cols-3"}>
              {[
                {
                  t: ui.continuous,
                  d: ui.continuousText,
                },
                {
                  t: ui.button,
                  d: ui.buttonText,
                },
                {
                  t: ui.instant,
                  d: ui.instantText,
                },
              ].map((x, index) => (
                premiumTop ? (
                  <div
                    key={x.t}
                    className="border-b border-zinc-200 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
                  >
                    <div className="text-xs text-zinc-400">0{index + 1}</div>
                    <div className="mt-5 text-lg font-medium">{x.t}</div>
                    <div className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">{x.d}</div>
                  </div>
                ) : (
                  <LightCard key={x.t} className="p-6">
                    <div className="text-sm font-semibold">{x.t}</div>
                    <div className="mt-2 text-sm text-zinc-600">{x.d}</div>
                  </LightCard>
                )
              ))}
            </div>
          </div>
        </Shell>
      </section>

      <section
        id="que-es"
        className={premiumTop ? "order-1 bg-[#f3f3f1] text-zinc-950" : "bg-white text-zinc-950"}
      >
        <Shell>
          <div className={premiumTop ? "py-20 md:py-28" : "py-14 md:py-16"}>
            <div className={premiumTop ? "grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-20" : "grid grid-cols-1 gap-8 lg:grid-cols-12"}>
              <div className="lg:col-span-7">
                <div className={premiumTop ? "" : "rounded-3xl bg-zinc-950 p-8 text-white sm:p-10"}>
                  <h3 className={premiumTop ? "text-4xl font-normal tracking-[-0.035em] sm:text-6xl" : "text-2xl font-bold sm:text-3xl"}>
                    {ui.whatIs}{" "}
                    <span style={{ color: ACCENT }}>Recap</span>?
                  </h3>

                  <p className={premiumTop ? "mt-8 max-w-2xl text-lg leading-8 text-zinc-600" : "mt-4 text-white/75"}>
                    {ui.whatText}
                  </p>

                  <p className={premiumTop ? "mt-4 text-lg leading-8 text-zinc-600" : "mt-4 text-white/75"}>
                    {ui.chooseText}
                  </p>

                  <div
                    className={premiumTop
                      ? "mt-10 border-l-2 pl-5 text-sm leading-6 text-zinc-700"
                      : "mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/75"}
                    style={{ borderLeftColor: ACCENT }}
                  >
                    {ui.availabilityNote}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className={premiumTop ? "border-t border-zinc-300" : "rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10"}>
                  <div className={premiumTop ? "py-5 text-sm font-medium uppercase tracking-[0.15em] text-zinc-500" : "font-semibold"}>{ui.how}</div>

                  <div className={premiumTop ? "" : "mt-6 space-y-4"}>
                    {[
                      {
                        t: ui.play,
                        d: ui.playText,
                      },
                      {
                        t: ui.press,
                        d: ui.pressText,
                      },
                      {
                        t: ui.locate,
                        d: ui.locateText,
                      },
                    ].map((s) => (
                      <div
                        key={s.t}
                        className={premiumTop ? "border-t border-zinc-300 py-6" : "rounded-2xl border border-zinc-200 bg-zinc-50 p-5"}
                      >
                        <div className={premiumTop ? "font-medium" : "font-semibold"}>{s.t}</div>
                        <div className="mt-2 text-sm leading-6 text-zinc-600">
                          {s.d}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Shell>
      </section>

      <section id="buscar" className={premiumTop ? "order-3 bg-[#0b0c0e] text-white" : "bg-zinc-950 text-white"}>
        <Shell>
          <div className={premiumTop ? "py-20 md:py-28" : "py-14 md:py-16"}>
            <div className={premiumTop ? "mb-12" : "mb-10 text-center"}>
              <h2
                className={premiumTop ? "max-w-3xl text-4xl font-normal tracking-[-0.035em] text-white sm:text-6xl" : "text-2xl font-extrabold sm:text-3xl"}
                style={!premiumTop ? { color: ACCENT } : undefined}
              >
                {ui.findHere}
              </h2>
            </div>

            <div className={premiumTop ? "border-y border-white/15 py-5" : "rounded-3xl border border-white/10 bg-white/[0.08] p-6 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className={premiumTop ? "text-xs uppercase tracking-[0.15em] text-white/40" : "font-semibold"}>{ui.selection}</div>

                  <div className={premiumTop ? "mt-2 text-sm text-white/75" : "mt-1 text-sm text-white/70"}>
                    {selectedClub ? (
                      <>
                        {selectedClub.name}
                        {" • "}
                        {selectedCourtName ?? ui.chooseCourt}
                        {" • "}
                        {selectedTimeLabel ?? ui.chooseTime}
                      </>
                    ) : (
                      ui.selectClub
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetSelections}
                    className={premiumTop ? "rounded-full border border-white/15 px-5 py-2.5 text-sm font-normal text-white/70" : "rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold"}
                  >
                    {ui.reset}
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
                    {isSearching ? ui.searching : ui.search}
                  </button>
                </div>
              </div>
            </div>

            <div className={premiumTop ? "mt-14 space-y-12" : "mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12"}>
              <div className={premiumTop ? "" : "lg:col-span-5"}>
                <h3 className={premiumTop ? "text-sm font-medium uppercase tracking-[0.14em] text-white/50" : "text-lg font-semibold"}>Club</h3>

                <div className={premiumTop ? "mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" : "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"}>
                  {clubs.map((club) => {
                    const isSelected = selectedClub?.id === club.id;
                    const normalizedClubName = club.name
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .toLowerCase();
                    const isGarana = normalizedClubName.includes("garana");

                    return (
                      <button
                        key={club.id}
                        onClick={() => setSelectedClub(club)}
                        className={premiumTop
                          ? clsx(
                              "group relative flex min-h-40 flex-col items-center justify-center overflow-hidden rounded-[1.4rem] border bg-gradient-to-b from-[#222326] to-[#131416] p-4 text-center text-white shadow-[0_16px_45px_rgba(0,0,0,.22)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 sm:min-h-48 sm:rounded-[1.65rem] sm:p-5",
                              isSelected ? "border-transparent" : "border-white/10"
                            )
                          : "rounded-3xl border border-white/10 bg-white/[0.07] p-4 text-left"}
                        style={
                          isSelected
                            ? premiumTop
                              ? { boxShadow: "inset 0 0 0 2px " + ACCENT }
                              : { boxShadow: "0 0 0 2px " + ACCENT + "88" }
                            : undefined
                        }
                      >
                        <div className={premiumTop ? "flex w-full flex-col items-center justify-center" : "flex items-center gap-3"}>
                          {club.logo_url && (
                            premiumTop ? (
                              <div className="grid h-20 w-full place-items-center overflow-hidden rounded-2xl sm:h-24 sm:rounded-[1.25rem]">
                                <img
                                  src={club.logo_url}
                                  alt={club.name}
                                  className={clsx(
                                    "h-full max-h-20 w-full max-w-[8.5rem] rounded-xl object-contain transition-transform duration-200 sm:max-h-24 sm:rounded-2xl",
                                    isGarana ? "scale-[1.22]" : "scale-105"
                                  )}
                                />
                              </div>
                            ) : (
                              <img
                                src={club.logo_url}
                                alt={club.name}
                                className="h-10 w-10 shrink-0 rounded-full object-cover"
                              />
                            )
                          )}

                          <div className={premiumTop ? "mt-4 w-full min-w-0" : "min-w-0 flex-1"}>
                            <div className={premiumTop ? "truncate text-sm font-medium text-white/85 sm:text-base" : "font-semibold"}>
                              {club.name}
                            </div>
                          </div>
                          {premiumTop && (
                            <span
                              className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border border-white/25"
                              style={isSelected ? { background: ACCENT, borderColor: ACCENT } : undefined}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(!premiumTop || selectedClub) && <div className={premiumTop ? "space-y-9 border-t border-white/10 pt-8" : "space-y-8 lg:col-span-7"}>
                <div>
                  <h3 className={premiumTop ? "text-sm font-medium uppercase tracking-[0.14em] text-white/50" : "text-lg font-semibold"}>{ui.court}</h3>

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
                          className={premiumTop
                            ? clsx(
                                "rounded-full border px-5 py-3 text-sm font-medium transition",
                                isSelected
                                  ? "border-transparent text-zinc-950"
                                  : "border-white/15 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"
                              )
                            : "rounded-full border border-white/10 bg-white/[0.07] px-5 py-3 text-sm font-semibold"}
                          style={
                            isSelected
                              ? premiumTop
                                ? { background: ACCENT }
                                : { boxShadow: "0 0 0 2px " + ACCENT + "88" }
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
                  <h3 className={premiumTop ? "text-sm font-medium uppercase tracking-[0.14em] text-white/50" : "text-lg font-semibold"}>{ui.time}</h3>

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
                          className={premiumTop
                            ? clsx(
                                "rounded-full border px-5 py-3 text-sm font-medium transition",
                                isSelected
                                  ? "border-transparent text-zinc-950"
                                  : "border-white/15 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"
                              )
                            : "rounded-full border border-white/10 bg-white/[0.07] px-5 py-3 text-sm font-semibold"}
                          style={
                            isSelected
                              ? premiumTop
                                ? { background: ACCENT }
                                : { boxShadow: "0 0 0 2px " + ACCENT + "88" }
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
              </div>}
            </div>

            {selectedClub && selectedCourtId && selectedTime && (
              <div className="mt-8 lg:hidden">
                <Glass className="p-4">
                  <div className="text-sm font-semibold leading-relaxed">
                    {selectedClub.name}
                    {" • "}
                    {selectedCourtName}
                    {" • "}
                    {selectedTimeLabel}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={resetSelections}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold"
                    >
                      {ui.reset}
                    </button>

                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className={clsx(
                        "rounded-full px-4 py-3 text-sm font-semibold",
                        !isSearching
                          ? "text-zinc-950"
                          : "cursor-not-allowed bg-white/10 text-white/40"
                      )}
                      style={
                        !isSearching
                          ? { background: ACCENT }
                          : undefined
                      }
                    >
                      {isSearching ? ui.searching : ui.search}
                    </button>
                  </div>
                </Glass>
              </div>
            )}

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
                      {ui.available}
                    </h3>

                    <div className="text-sm text-white/60">
                      {clips.length} {clips.length === 1 ? ui.clip : ui.clips}
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
                              {ui.noVideo}
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <p className="truncate text-xs text-white/60">
                              {new Date(
                                clip.created_at
                              ).toLocaleString(language === "en" ? "en-US" : "es-VE", {
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
                                  {ui.open}
                                </a>

                                <a
                                  href={
                                    "/api/download?url=" +
                                    encodeURIComponent(url) +
                                    "&name=" +
                                    encodeURIComponent(filename)
                                  }
                                  className="rounded-full px-3 py-2 text-xs font-semibold text-zinc-950"
                                  style={{ background: ACCENT }}
                                >
                                  {ui.download}
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

export default function Page() {
  return <HomePage premiumTop />;
}
