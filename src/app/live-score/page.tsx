"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type MatchStatus = "Pending" | "In Progress" | "Finished";
type ThirdSetMode = "Full 3rd Set" | "Super Tiebreak";

type Match = {
  id: string;
  club: string;
  court: string;
  tournament: string;
  round: string;
  match_time: string;
  team_a: string;
  team_b: string;
  status: MatchStatus;
  third_set_mode: ThirdSetMode;
  sets: { a: string; b: string }[];
  game_a: string;
  game_b: string;
  serving: "A" | "B";
};

const COURTS = ["Court 1", "Court 2", "Court 3", "Court 4"];

export default function LiveScorePage() {
  const [selectedCourt, setSelectedCourt] = useState("Court 1");
  const [matches, setMatches] = useState<Match[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const courtMatches = useMemo(
    () => matches.filter((match) => match.court === selectedCourt),
    [matches, selectedCourt]
  );

  useEffect(() => {
    fetchMatches();

    const channel = supabase
      .channel("live_matches_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_matches" },
        () => fetchMatches()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMatches() {
    setLoading(true);

    const { data, error } = await supabase
      .from("live_matches")
      .select("*")
      .eq("club", "Garana Padel")
      .eq("match_date", new Date().toISOString().slice(0, 10))
      .order("match_time", { ascending: true });

    if (!error) {
      setMatches((data || []) as Match[]);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#050806] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xl"
            >
              ☰
            </button>

            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-green-400">
                Garana Padel
              </p>
              <h1 className="text-2xl font-black">Live Score</h1>
            </div>
          </div>

          <Link href="/" className="text-2xl font-black">
            Recap
          </Link>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-zinc-950 px-5 py-4">
            <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
              <Link className="rounded-2xl bg-white/10 p-4" href="/">
                Clips
              </Link>
              <Link className="rounded-2xl bg-green-400 p-4 font-bold text-black" href="/live-score">
                Live Score
              </Link>
              <button className="rounded-2xl bg-white/10 p-4 text-left text-zinc-400">
                Live Stream · Coming soon
              </button>
            </div>
          </div>
        )}
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-8">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-green-400">
            Today&apos;s matches
          </p>
          <h2 className="text-4xl font-black md:text-6xl">
            Select your court.
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Follow live scores by court. Scores update automatically from the Recap admin panel.
          </p>
        </div>

        <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.07] p-4">
          <p className="mb-3 text-sm font-bold text-zinc-300">
            Courts
          </p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {COURTS.map((court) => {
              const count = matches.filter((match) => match.court === court).length;
              const liveCount = matches.filter(
                (match) => match.court === court && match.status === "In Progress"
              ).length;

              return (
                <button
                  key={court}
                  onClick={() => setSelectedCourt(court)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    selectedCourt === court
                      ? "border-green-400 bg-green-400 text-black"
                      : "border-white/10 bg-black/30 text-white hover:border-green-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-black">{court}</p>
                    {liveCount > 0 && (
                      <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    )}
                  </div>
                  <p className="text-sm opacity-70">{count} matches today</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black">{selectedCourt}</h3>
            <p className="text-sm text-zinc-400">
              {loading ? "Loading scores..." : "Live scores synced from Recap."}
            </p>
          </div>

          <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
            {courtMatches.length} matches
          </span>
        </div>

        {courtMatches.length === 0 && !loading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-zinc-400">
            No matches available for {selectedCourt} right now.
          </div>
        )}

        <div className="grid gap-5">
          {courtMatches.map((match) => (
            <article
              key={match.id}
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-5">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        match.status === "In Progress"
                          ? "bg-green-400"
                          : match.status === "Pending"
                          ? "bg-yellow-300"
                          : "bg-zinc-400"
                      }`}
                    />
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-green-400">
                      {match.status}
                    </span>
                  </div>

                  <h4 className="text-2xl font-black md:text-3xl">
                    {match.tournament}
                  </h4>

                  <p className="text-zinc-400">
                    {match.round} · {match.match_time}
                  </p>
                </div>

                <span className="rounded-full border border-green-400/40 bg-green-400/10 px-4 py-2 text-sm font-bold text-green-400">
                  {match.court}
                </span>
              </div>

              <LiveScoreCard match={match} />

              <div className="flex flex-wrap gap-3 border-t border-white/10 p-5">
                <button className="rounded-full bg-green-400 px-5 py-3 font-black text-black">
                  Score details
                </button>
                <button className="rounded-full border border-white/10 px-5 py-3 text-zinc-300">
                  Live stream coming soon
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function LiveScoreCard({ match }: { match: Match }) {
  const showSet3 = Boolean(match.sets[2]);
  const thirdSetLabel = match.third_set_mode === "Super Tiebreak" ? "TB" : "S3";

  return (
    <div>
      <div
        className={`grid gap-2 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-zinc-500 ${
          showSet3
            ? "grid-cols-[1fr_44px_44px_44px_56px]"
            : "grid-cols-[1fr_44px_44px_56px]"
        }`}
      >
        <div>Team</div>
        <div className="text-center">S1</div>
        <div className="text-center">S2</div>
        {showSet3 && <div className="text-center">{thirdSetLabel}</div>}
        <div className="text-center">Game</div>
      </div>

      <div className="space-y-3 p-4">
        <ScoreRow
          name={match.team_a}
          serving={match.serving === "A"}
          sets={match.sets.map((s) => s.a)}
          game={match.game_a}
          showSet3={showSet3}
        />

        <ScoreRow
          name={match.team_b}
          serving={match.serving === "B"}
          sets={match.sets.map((s) => s.b)}
          game={match.game_b}
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
          className={`h-3.5 w-3.5 shrink-0 rounded-full ${
            serving ? "bg-green-400" : "bg-transparent"
          }`}
        />
        <span className="truncate">{name}</span>
      </div>

      <div className="text-center font-black">{sets[0] ?? "0"}</div>
      <div className="text-center font-black">{sets[1] ?? "0"}</div>
      {showSet3 && <div className="text-center font-black">{sets[2] ?? "0"}</div>}

      <div className="text-center text-xl font-black text-green-400 md:text-2xl">
        {game}
      </div>
    </div>
  );
}
