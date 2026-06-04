"use client";

import { useEffect, useMemo, useState } from "react";
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

const COURTS = ["Court 1", "Court 2", "Court 3", "Court 4"];
const gameOptions = ["0", "15", "30", "40", "AD", "GAME"];

function emptyMatch(court = "Court 1"): Match {
  return {
    id: 0,
    club: "Garana Padel",
    court,
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
}

export default function AdminScorePage() {
  const [selectedCourt, setSelectedCourt] = useState("Court 1");
  const [matches, setMatches] = useState<Match[]>([]);
  const [form, setForm] = useState<Match>(emptyMatch("Court 1"));
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("recap-garana-matches-today");
    if (saved) setMatches(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("recap-garana-matches-today", JSON.stringify(matches));
  }, [matches]);

  const courtMatches = useMemo(
    () => matches.filter((match) => match.court === selectedCourt),
    [matches, selectedCourt]
  );

  const activeMatch = matches.find((match) => match.id === activeMatchId);

  function selectCourt(court: string) {
    setSelectedCourt(court);
    setForm(emptyMatch(court));
    setEditingMatchId(null);
    setFormError("");

    const firstMatch = matches.find((match) => match.court === court);
    setActiveMatchId(firstMatch?.id ?? null);
  }

  function updateForm(field: keyof Match, value: any) {
    setFormError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateForm() {
    const requiredFields = [
      form.tournament,
      form.round,
      form.time,
      form.teamA,
      form.teamB,
    ];

    const missing = requiredFields.some((field) => !field.trim());

    if (missing) {
      setFormError(
        "Please complete tournament, round, time, Team A, and Team B before saving."
      );
      return false;
    }

    return true;
  }

  function saveMatch() {
    if (!validateForm()) return;

    if (editingMatchId) {
      const updatedMatch = {
        ...form,
        id: editingMatchId,
        club: "Garana Padel",
        court: selectedCourt,
      };

      setMatches((current) =>
        current.map((match) =>
          match.id === editingMatchId ? updatedMatch : match
        )
      );

      setActiveMatchId(editingMatchId);
      setEditingMatchId(null);
      setForm(emptyMatch(selectedCourt));
      return;
    }

    const newMatch = {
      ...form,
      id: Date.now(),
      club: "Garana Padel",
      court: selectedCourt,
    };

    setMatches((current) => [...current, newMatch]);
    setActiveMatchId(newMatch.id);
    setForm(emptyMatch(selectedCourt));
  }

  function startEditMatch(match: Match) {
    setForm({
      ...match,
      sets: match.sets.map((set) => ({ ...set })),
    });
    setEditingMatchId(match.id);
    setActiveMatchId(match.id);
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingMatchId(null);
    setForm(emptyMatch(selectedCourt));
    setFormError("");
  }

  function updateMatch(updated: Match) {
    setMatches((current) =>
      current.map((match) => (match.id === updated.id ? updated : match))
    );
  }

  function deleteMatch(id: number) {
    if (!window.confirm("Delete this match?")) return;

    setMatches((current) => current.filter((match) => match.id !== id));

    if (activeMatchId === id) setActiveMatchId(null);

    if (editingMatchId === id) {
      setEditingMatchId(null);
      setForm(emptyMatch(selectedCourt));
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
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-green-400">
              Garana Padel
            </p>
            <h1 className="text-2xl font-black">Recap Score Control</h1>
          </div>

          <Link
            href="/live-score"
            className="rounded-full bg-green-400 px-5 py-3 text-sm font-bold text-black"
          >
            View Live Score
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6">
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.07] p-4">
          <p className="mb-3 text-sm font-bold text-zinc-300">Select court</p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {COURTS.map((court) => {
              const count = matches.filter((match) => match.court === court).length;

              return (
                <button
                  key={court}
                  onClick={() => selectCourt(court)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    selectedCourt === court
                      ? "border-green-400 bg-green-400 text-black"
                      : "border-white/10 bg-black/30 text-white hover:border-green-400"
                  }`}
                >
                  <p className="font-black">{court}</p>
                  <p className="text-sm opacity-70">{count} matches today</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl">
            <div className="mb-5">
              <p className="text-sm uppercase tracking-[0.25em] text-green-400">
                {selectedCourt}
              </p>
              <h2 className="text-xl font-black">
                {editingMatchId ? "Edit match" : "Create match"}
              </h2>
              <p className="text-sm text-zinc-500">
                Garana Padel is already selected. Add match info and save.
              </p>
            </div>

            <div className="grid gap-4">
              <Input
                label="Tournament / Event"
                value={form.tournament}
                onChange={(v) => updateForm("tournament", v)}
              />
              <Input
                label="Round"
                value={form.round}
                onChange={(v) => updateForm("round", v)}
              />
              <Input
                label="Time"
                value={form.time}
                onChange={(v) => updateForm("time", v)}
              />
              <Input
                label="Team A"
                value={form.teamA}
                onChange={(v) => updateForm("teamA", v)}
              />
              <Input
                label="Team B"
                value={form.teamB}
                onChange={(v) => updateForm("teamB", v)}
              />

              {formError && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {formError}
                </div>
              )}

              <button
                onClick={saveMatch}
                className="mt-2 rounded-2xl bg-green-400 px-6 py-4 font-black text-black"
              >
                {editingMatchId ? "Update match" : "Save match"}
              </button>

              {editingMatchId && (
                <button
                  onClick={cancelEdit}
                  className="rounded-2xl border border-white/15 px-6 py-4 font-bold text-zinc-300"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </aside>

          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">{selectedCourt}</h2>
                <p className="text-sm text-zinc-400">
                  Matches saved locally for today.
                </p>
              </div>

              <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
                {courtMatches.length} matches
              </span>
            </div>

            {courtMatches.length === 0 && (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-zinc-400">
                No matches created for {selectedCourt} yet.
              </div>
            )}

            <div className="grid gap-5">
              {courtMatches.map((match) => (
                <div
                  key={match.id}
                  className={`rounded-[2rem] border p-4 transition ${
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
                      <div>
                        <p className="text-sm text-green-400">
                          {match.tournament || "Tournament"} · {match.time || "Time"}
                        </p>
                        <h3 className="text-xl font-black">
                          {match.teamA || "Team A"} vs {match.teamB || "Team B"}
                        </h3>
                        <p className="text-sm text-zinc-400">
                          {match.round || "Round"}
                        </p>
                      </div>

                      <StatusBadge status={match.status} />
                    </div>

                    <LiveScorePreview match={match} compact />
                  </button>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => startEditMatch(match)}
                      className="rounded-full border border-green-400/50 px-4 py-2 text-sm font-bold text-green-300 hover:bg-green-500/10"
                    >
                      Edit match
                    </button>

                    <button
                      onClick={() => deleteMatch(match.id)}
                      className="rounded-full border border-red-400/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
                    >
                      Delete match
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {activeMatch && (
              <div className="mt-8">
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl">
                  <div className="mb-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-green-400">
                      Editing score
                    </p>
                    <h2 className="text-2xl font-black">
                      {activeMatch.teamA || "Team A"} vs {activeMatch.teamB || "Team B"}
                    </h2>
                    <p className="text-zinc-400">{activeMatch.court}</p>
                  </div>

                  <ControlSection title="Match status">
                    <div className="grid gap-3">
                      {(["Pending", "In Progress", "Finished"] as MatchStatus[]).map(
                        (status) => (
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
                        )
                      )}
                    </div>
                  </ControlSection>

                  <ControlSection title="3rd set format">
                    <div className="grid gap-3">
                      {(["Full 3rd Set", "Super Tiebreak"] as ThirdSetMode[]).map(
                        (mode) => (
                          <button
                            key={mode}
                            onClick={() =>
                              updateMatch({ ...activeMatch, thirdSetMode: mode })
                            }
                            className={`rounded-2xl px-5 py-4 font-bold ${
                              activeMatch.thirdSetMode === mode
                                ? "bg-green-400 text-black"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            {mode}
                          </button>
                        )
                      )}
                    </div>
                  </ControlSection>

                  <ControlSection title="Game score">
                    <div className="grid gap-4">
                      <GameButtons
                        label={activeMatch.teamA || "Team A"}
                        value={activeMatch.gameA}
                        onChange={(value) =>
                          updateMatch({ ...activeMatch, gameA: value })
                        }
                      />
                      <GameButtons
                        label={activeMatch.teamB || "Team B"}
                        value={activeMatch.gameB}
                        onChange={(value) =>
                          updateMatch({ ...activeMatch, gameB: value })
                        }
                      />
                    </div>
                  </ControlSection>

                  <ControlSection title="Serving team">
                    <div className="grid gap-3">
                      <button
                        onClick={() => updateMatch({ ...activeMatch, serving: "A" })}
                        className={`rounded-2xl px-5 py-4 font-bold ${
                          activeMatch.serving === "A"
                            ? "bg-green-400 text-black"
                            : "bg-white/10"
                        }`}
                      >
                        ● {activeMatch.teamA || "Team A"}
                      </button>
                      <button
                        onClick={() => updateMatch({ ...activeMatch, serving: "B" })}
                        className={`rounded-2xl px-5 py-4 font-bold ${
                          activeMatch.serving === "B"
                            ? "bg-green-400 text-black"
                            : "bg-white/10"
                        }`}
                      >
                        ● {activeMatch.teamB || "Team B"}
                      </button>
                    </div>
                  </ControlSection>

                  <ControlSection title="Sets">
                    <div className="mb-4 flex flex-wrap gap-2">
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

                    <div className="space-y-3">
                      {activeMatch.sets.map((set, index) => (
                        <div
                          key={index}
                          className="grid gap-3 rounded-2xl bg-black/35 p-3 sm:grid-cols-[90px_1fr_1fr]"
                        >
                          <div className="flex items-center text-sm text-zinc-400">
                            {index === 2 &&
                            activeMatch.thirdSetMode === "Super Tiebreak"
                              ? "Super TB"
                              : `Set ${index + 1}`}
                          </div>

                          <input
                            value={set.a}
                            onChange={(e) =>
                              updateSet(activeMatch, index, "a", e.target.value)
                            }
                            className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-center font-bold outline-none focus:border-green-400"
                          />

                          <input
                            value={set.b}
                            onChange={(e) =>
                              updateSet(activeMatch, index, "b", e.target.value)
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

function LiveScorePreview({
  match,
  compact = false,
}: {
  match: Match;
  compact?: boolean;
}) {
  const showSet3 = Boolean(match.sets[2]);
  const thirdSetLabel = match.thirdSetMode === "Super Tiebreak" ? "TB" : "S3";

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0f0c] shadow-2xl">
      {!compact && (
        <div className="flex items-start justify-between border-b border-white/10 p-5">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-green-400">
              {match.status}
            </p>

            <h3 className="text-2xl font-black md:text-3xl">
              {match.court} · {match.tournament || "Tournament"}
            </h3>

            <p className="text-zinc-400">
              {match.round || "Round"} · {match.time || "Time"}
            </p>
          </div>

          <span className="rounded-full border border-green-400/40 bg-green-400/10 px-4 py-2 text-sm font-bold text-green-400">
            Live Score
          </span>
        </div>
      )}

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

      <div className={compact ? "space-y-2 p-3" : "space-y-3 p-4"}>
        <PublicScoreRow
          name={match.teamA || "Team A"}
          serving={match.serving === "A"}
          sets={match.sets.map((s) => s.a)}
          game={match.gameA}
          showSet3={showSet3}
          compact={compact}
        />

        <PublicScoreRow
          name={match.teamB || "Team B"}
          serving={match.serving === "B"}
          sets={match.sets.map((s) => s.b)}
          game={match.gameB}
          showSet3={showSet3}
          compact={compact}
        />
      </div>
    </div>
  );
}

function PublicScoreRow({
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
          className={`shrink-0 rounded-full ${
            serving ? "bg-green-400" : "bg-transparent"
          } ${compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5"}`}
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
              value === option ? "bg-green-400 text-black" : "bg-white/10 text-white"
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
