"use client";

import { useState } from "react";
import Link from "next/link";

const clubs = [
  {
    id: "garana",
    name: "Garana Padel",
    courts: [
      {
        id: "court-1",
        name: "Court 1",
        status: "LIVE",
        tournament: "Copa Garana",
        round: "Semifinal",
        time: "6:00 PM",
        format: "Golden Point",
        teamA: "Ana / Maria",
        teamB: "Laura / Sofia",
        server: "A",
        setsA: [6, 4],
        setsB: [4, 3],
        gameA: "40",
        gameB: "30",
      },
      {
        id: "court-2",
        name: "Court 2",
        status: "LIVE",
        tournament: "Copa Garana",
        round: "Quarterfinal",
        time: "6:30 PM",
        format: "Super Tiebreak",
        teamA: "Carlos / Diego",
        teamB: "Luis / Pablo",
        server: "B",
        setsA: [6, 6, 8],
        setsB: [3, 7, 6],
        gameA: "8",
        gameB: "6",
      },
      {
        id: "court-3",
        name: "Court 3",
        status: "UPCOMING",
        tournament: "Copa Garana",
        round: "Final",
        time: "8:00 PM",
        format: "3rd Set",
        teamA: "Team A",
        teamB: "Team B",
        server: "A",
        setsA: [0, 0],
        setsB: [0, 0],
        gameA: "0",
        gameB: "0",
      },
    ],
  },
  {
    id: "upadel",
    name: "UPadel",
    courts: [
      {
        id: "court-1",
        name: "Court 1",
        status: "LIVE",
        tournament: "UPadel Open",
        round: "Round 1",
        time: "7:00 PM",
        format: "Advantage",
        teamA: "Andrea / Sofia",
        teamB: "Paula / Valeria",
        server: "A",
        setsA: [5],
        setsB: [4],
        gameA: "AD",
        gameB: "40",
      },
    ],
  },
];

export default function LiveScorePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState(clubs[0].id);
  const selectedClub = clubs.find((club) => club.id === selectedClubId)!;

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xl hover:border-green-400"
            >
              ☰
            </button>

            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-green-400">
                Recap
              </p>
              <h1 className="text-xl font-bold">Live Score</h1>
            </div>
          </div>

          <Link href="/" className="text-2xl font-black tracking-tight">
            Recap
          </Link>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-zinc-950 px-6 py-5">
            <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-3">
              <Link className="rounded-2xl bg-white/5 p-4 hover:bg-white/10" href="/">
                Clips
              </Link>
              <Link className="rounded-2xl bg-green-500/15 p-4 text-green-400" href="/live-score">
                Live Score
              </Link>
              <button className="rounded-2xl bg-white/5 p-4 text-left text-zinc-400">
                Live Stream · Coming soon
              </button>
            </div>
          </div>
        )}
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-green-400">
            Tournament Control Center
          </p>
          <h2 className="text-4xl font-black md:text-6xl">
            Scores by club and court.
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Select a club to see active courts, live matches, serving indicator,
            match format, and game score.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap gap-3">
          {clubs.map((club) => (
            <button
              key={club.id}
              onClick={() => setSelectedClubId(club.id)}
              className={`rounded-full border px-5 py-3 font-semibold transition ${
                selectedClubId === club.id
                  ? "border-green-400 bg-green-400 text-black"
                  : "border-white/10 bg-white/5 text-white hover:border-green-400"
              }`}
            >
              {club.name}
            </button>
          ))}
        </div>

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold">{selectedClub.name}</h3>
            <p className="text-zinc-400">Today&apos;s active matches</p>
          </div>

          <div className="rounded-full border border-green-400/40 px-4 py-2 text-sm text-green-400">
            {selectedClub.courts.filter((court) => court.status === "LIVE").length} live courts
          </div>
        </div>

        <div className="grid gap-6">
          {selectedClub.courts.map((match) => (
            <article
              key={match.id}
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-6">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        match.status === "LIVE" ? "bg-green-400" : "bg-zinc-500"
                      }`}
                    />
                    <span className="text-sm font-bold uppercase tracking-[0.25em] text-green-400">
                      {match.status}
                    </span>
                  </div>

                  <h4 className="text-2xl font-black">
                    {match.name} · {match.tournament}
                  </h4>
                  <p className="text-zinc-400">
                    {match.round} · {match.time}
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-zinc-300">
                  {match.format}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-[1fr_52px_52px_70px] gap-3 border-b border-white/10 pb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <div>Team</div>
                  <div className="text-center">S1</div>
                  <div className="text-center">S2</div>
                  <div className="text-center">Game</div>
                </div>

                <div className="space-y-2 pt-4">
                  <ScoreRow
                    name={match.teamA}
                    sets={match.setsA}
                    game={match.gameA}
                    serving={match.server === "A"}
                  />
                  <ScoreRow
                    name={match.teamB}
                    sets={match.setsB}
                    game={match.gameB}
                    serving={match.server === "B"}
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="rounded-full bg-green-400 px-5 py-3 font-bold text-black">
                    View score details
                  </button>
                  <button className="rounded-full border border-white/10 px-5 py-3 text-zinc-300">
                    Live stream coming soon
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ScoreRow({
  name,
  sets,
  game,
  serving,
}: {
  name: string;
  sets: number[];
  game: string;
  serving: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_52px_52px_70px] items-center gap-3 rounded-2xl bg-black/30 px-4 py-4 text-lg">
      <div className="flex items-center gap-3 font-semibold">
        <span
          className={`h-3 w-3 rounded-full ${
            serving ? "bg-green-400" : "bg-transparent"
          }`}
        />
        {name}
      </div>
      <div className="text-center font-bold">{sets[0] ?? "-"}</div>
      <div className="text-center font-bold">{sets[1] ?? "-"}</div>
      <div className="text-center text-2xl font-black text-green-400">
        {game}
      </div>
    </div>
  );
}
