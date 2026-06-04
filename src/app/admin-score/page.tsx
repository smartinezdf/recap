"use client";

import { useState } from "react";
import Link from "next/link";

type MatchStatus = "Pending" | "In Progress" | "Finished";
type ThirdSetMode = "Full 3rd Set" | "Super Tiebreak";

type Match = {
  id: number;
  club: string;
  court: string;
  tournament: string;
  round: string;
  time: string;
  teamA: string;
  teamB: string;
  status: MatchStatus;
  thirdSetMode: ThirdSetMode;
  sets: { a: string; b: string }[];
  gameA: string;
  gameB: string;
  serving: "A" | "B";
};

const gameOptions = ["0", "15", "30", "40", "AD", "GAME"];

const emptyForm: Match = {
  id: 0,
  club: "",
  court: "",
  tournament: "",
  round: "",
  time: "",
  teamA: "",
  teamB: "",
  status: "Pending",
  thirdSetMode: "Full 3rd Set",
  sets: [
    { a: "0", b: "0" },
    { a: "0", b: "0" },
  ],
  gameA: "0",
  gameB: "0",
  serving: "A",
};

export default function AdminScorePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  const [form, setForm] = useState<Match>(emptyForm);

  const activeMatch = matches.find((m) => m.id === activeMatchId);

  function updateForm(field: keyof Match, value: any) {
    setForm({ ...form, [field]: value });
  }

  function saveMatch() {
    const newMatch = { ...form, id: Date.now() };
    setMatches([...matches, newMatch]);
    setActiveMatchId(newMatch.id);
    setForm(emptyForm);
  }

  function updateMatch(updated: Match) {
    setMatches(matches.map((m) => (m.id === updated.id ? updated : m)));
  }

  function deleteMatch(id: number) {
    const confirmed = window.confirm("Delete this match?");
    if (!confirmed) return;

    setMatches(matches.filter((m) => m.id !== id));

    if (activeMatchId === id) {
      setActiveMatchId(null);
    }
  }

  function addSet(match: Match) {
    if (match.sets.length >= 3) return;

    updateMatch({
      ...match,
      sets: [...match.sets, { a: "0", b: "0" }],
    });
  }

  function removeSet(match: Match) {
    if (match.sets.length <= 1) return;

    updateMatch({
      ...match,
      sets: match.sets.slice(0, -1),
    });
  }

  function updateSet(match: Match, index: number, side: "a" | "b", value: string) {
    const newSets = [...match.sets];
    newSets[index] = { ...newSets[index], [side]: value };
    updateMatch({ ...match, sets: newSets });
  }

  return (
    <main className="min-h-screen bg-[#050806] text-white">
      <header className="border-b border-white/10 bg-black/80 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-green-400">
              Recap Admin
            </p>
            <h1 className="text-2xl font-black">Score Control</h1>
          </div>

          <Link
            href="/live-score"
            className="rounded-full bg-green-400 px-5 py-3 font-bold text-black"
          >
            View Live Score
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[380px_1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="mb-5 text-xl font-black">Create match</h2>

          <div className="grid gap-4">
            <Input label="Club" value={form.club} onChange={(v) => updateForm("club", v)} />
            <Input label="Court" value={form.court} onChange={(v) => updateForm("court", v)} />
            <Input label="Tournament / Event" value={form.tournament} onChange={(v) => updateForm("tournament", v)} />
            <Input label="Round" value={form.round} onChange={(v) => updateForm("round", v)} />
            <Input label="Time" value={form.time} onChange={(v) => updateForm("time", v)} />
            <Input label="Team A" value={form.teamA} onChange={(v) => updateForm("teamA", v)} />
            <Input label="Team B" value={form.teamB} onChange={(v) => updateForm("teamB", v)} />

            <button
              onClick={saveMatch}
              className="mt-3 rounded-2xl bg-green-400 px-6 py-4 font-black text-black"
            >
              Save match
            </button>

            <p className="text-sm text-zinc-500">
              After saving, the form clears and the match appears on the right for live editing.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black">Matches</h2>
            <p className="text-sm text-zinc-400">{matches.length} created</p>
          </div>

          {matches.length === 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-zinc-400">
              Create a match first. After saving, you can edit status, score, serving team, games, and sets.
            </div>
          )}

          <div className="grid gap-5">
            {matches.map((match) => (
              <div
                key={match.id}
                className={`rounded-[2rem] border p-5 transition ${
                  activeMatchId === match.id
                    ? "border-green-400 bg-green-400/10"
                    : "border-white/10 bg-white/[0.06]"
                }`}
              >
                <button
                  onClick={() => setActiveMatchId(match.id)}
                  className="w-full text-left"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm text-green-400">
                      {match.club || "Club"} · {match.court || "Court"}
                    </p>

                    <StatusBadge status={match.status} />
                  </div>

                  <h3 className="text-xl font-black">
                    {match.teamA || "Team A"} vs {match.teamB || "Team B"}
                  </h3>

                  <p className="text-zinc-400">
                    {match.tournament || "Tournament"} · {match.round || "Round"} · {match.time || "Time"}
                  </p>
                </button>

                <button
                  onClick={() => deleteMatch(match.id)}
                  className="mt-4 rounded-full border border-red-400/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
                >
                  Delete match
                </button>
              </div>
            ))}
          </div>

          {activeMatch && (
            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.3em] text-green-400">
                  Editing
                </p>
                <h2 className="text-3xl font-black">
                  {activeMatch.teamA} vs {activeMatch.teamB}
                </h2>
                <p className="text-zinc-400">
                  {activeMatch.club} · {activeMatch.court}
                </p>
              </div>

              <div className="mb-8">
                <p className="mb-3 font-bold">Match status</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {(["Pending", "In Progress", "Finished"] as MatchStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateMatch({ ...activeMatch, status })}
                      className={`rounded-2xl px-5 py-4 font-bold ${
                        activeMatch.status === status
                          ? "bg-green-400 text-black"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <p className="mb-3 font-bold">3rd set format</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {(["Full 3rd Set", "Super Tiebreak"] as ThirdSetMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => updateMatch({ ...activeMatch, thirdSetMode: mode })}
                      className={`rounded-2xl px-5 py-4 font-bold ${
                        activeMatch.thirdSetMode === mode
                          ? "bg-green-400 text-black"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <p className="mb-3 font-bold">Game score</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <GameButtons
                    label={activeMatch.teamA}
                    value={activeMatch.gameA}
                    onChange={(value) => updateMatch({ ...activeMatch, gameA: value })}
                  />
                  <GameButtons
                    label={activeMatch.teamB}
                    value={activeMatch.gameB}
                    onChange={(value) => updateMatch({ ...activeMatch, gameB: value })}
                  />
                </div>
              </div>

              <div className="mb-8">
                <p className="mb-3 font-bold">Serving team</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    onClick={() => updateMatch({ ...activeMatch, serving: "A" })}
                    className={`rounded-2xl px-5 py-4 font-bold ${
                      activeMatch.serving === "A"
                        ? "bg-green-400 text-black"
                        : "bg-white/10"
                    }`}
                  >
                    ● {activeMatch.teamA}
                  </button>
                  <button
                    onClick={() => updateMatch({ ...activeMatch, serving: "B" })}
                    className={`rounded-2xl px-5 py-4 font-bold ${
                      activeMatch.serving === "B"
                        ? "bg-green-400 text-black"
                        : "bg-white/10"
                    }`}
                  >
                    ● {activeMatch.teamB}
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">Sets</p>
                    <p className="text-sm text-zinc-500">
                      Max 3 sets. The 3rd set can be a full set or super tiebreak.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => addSet(activeMatch)}
                      disabled={activeMatch.sets.length >= 3}
                      className="rounded-full border border-green-400 px-4 py-2 text-sm text-green-400 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      + Add set
                    </button>

                    <button
                      onClick={() => removeSet(activeMatch)}
                      disabled={activeMatch.sets.length <= 1}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Remove set
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {activeMatch.sets.map((set, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[90px_1fr_1fr] gap-3 rounded-2xl bg-black/35 p-3"
                    >
                      <div className="flex items-center text-zinc-400">
                        {index === 2 && activeMatch.thirdSetMode === "Super Tiebreak"
                          ? "Super TB"
                          : `Set ${index + 1}`}
                      </div>

                      <input
                        value={set.a}
                        onChange={(e) => updateSet(activeMatch, index, "a", e.target.value)}
                        className="rounded-xl border border-white/10 bg-white/10 p-3 text-center font-bold"
                      />

                      <input
                        value={set.b}
                        onChange={(e) => updateSet(activeMatch, index, "b", e.target.value)}
                        className="rounded-xl border border-white/10 bg-white/10 p-3 text-center font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
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

function GameButtons({
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
        {gameOptions.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-xl py-3 font-black ${
              value === option
                ? "bg-green-400 text-black"
                : "bg-white/10 text-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: MatchStatus }) {
  const styles = {
    Pending: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
    "In Progress": "border-green-400/40 bg-green-400/10 text-green-300",
    Finished: "border-zinc-400/40 bg-zinc-400/10 text-zinc-300",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${styles[status]}`}>
      {status}
    </span>
  );
}
