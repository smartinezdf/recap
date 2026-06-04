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
const gameOptions = ["0", "15", "30", "40", "AD", "GAME"];

function emptyForm(court = "Court 1") {
  return {
    club: "Garana Padel",
    court,
    tournament: "",
    round: "",
    match_time: "",
    team_a: "",
    team_b: "",
    status: "Pending" as MatchStatus,
    third_set_mode: "Full 3rd Set" as ThirdSetMode,
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
  const [selectedCourt, setSelectedCourt] = useState("Court 1");
  const [matches, setMatches] = useState<Match[]>([]);
  const [form, setForm] = useState(emptyForm("Court 1"));
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);

  const courtMatches = useMemo(
    () => matches.filter((match) => match.court === selectedCourt),
    [matches, selectedCourt]
  );

  const activeMatch = matches.find((match) => match.id === activeMatchId);

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    setLoading(true);

    const { data, error } = await supabase
      .from("live_matches")
      .select("*")
      .eq("club", "Garana Padel")
      .eq("match_date", new Date().toISOString().slice(0, 10))
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setFormError("Could not load matches.");
    } else {
      setMatches((data || []) as Match[]);
    }

    setLoading(false);
  }

  function selectCourt(court: string) {
    setSelectedCourt(court);
    setForm(emptyForm(court));
    setEditingMatchId(null);
    setFormError("");

    const firstMatch = matches.find((match) => match.court === court);
    setActiveMatchId(firstMatch?.id ?? null);
  }

  function updateForm(field: string, value: any) {
    setFormError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateForm() {
    const required = [
      form.tournament,
      form.round,
      form.match_time,
      form.team_a,
      form.team_b,
    ];

    if (required.some((field) => !field.trim())) {
      setFormError("Complete tournament, round, time, Team A, and Team B.");
      return false;
    }

    return true;
  }

  async function saveMatch() {
    if (!validateForm()) return;

    if (editingMatchId) {
      const { error } = await supabase
        .from("live_matches")
        .update({
          club: "Garana Padel",
          court: selectedCourt,
          tournament: form.tournament,
          round: form.round,
          match_time: form.match_time,
          team_a: form.team_a,
          team_b: form.team_b,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingMatchId);

      if (error) {
        console.error(error);
        setFormError("Could not update match.");
        return;
      }

      setEditingMatchId(null);
      setForm(emptyForm(selectedCourt));
      await fetchMatches();
      setActiveMatchId(editingMatchId);
      return;
    }

    const { data, error } = await supabase
      .from("live_matches")
      .insert({
        club: "Garana Padel",
        court: selectedCourt,
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
      console.error(error);
      setFormError("Could not save match.");
      return;
    }

    setForm(emptyForm(selectedCourt));
    await fetchMatches();
    setActiveMatchId(data.id);
  }

  function startEditMatch(match: Match) {
    setForm({
      club: match.club,
      court: match.court,
      tournament: match.tournament,
      round: match.round,
      match_time: match.match_time,
      team_a: match.team_a,
      team_b: match.team_b,
      status: match.status,
      third_set_mode: match.third_set_mode,
      sets: match.sets,
      game_a: match.game_a,
      game_b: match.game_b,
      serving: match.serving,
    });

    setEditingMatchId(match.id);
    setSelectedCourt(match.court);
    setActiveMatchId(match.id);
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingMatchId(null);
    setForm(emptyForm(selectedCourt));
    setFormError("");
  }

  async function updateMatch(id: string, updates: Partial<Match>) {
    const { error } = await supabase
      .from("live_matches")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      setFormError("Could not update score.");
      return;
    }

    setMatches((current) =>
      current.map((match) =>
        match.id === id ? { ...match, ...updates } : match
      )
    );
  }

  async function deleteMatch(id: string) {
    if (!window.confirm("Delete this match?")) return;

    const { error } = await supabase.from("live_matches").delete().eq("id", id);

    if (error) {
      console.error(error);
      setFormError("Could not delete match.");
      return;
    }

    setMatches((current) => current.filter((match) => match.id !== id));

    if (activeMatchId === id) setActiveMatchId(null);
    if (editingMatchId === id) cancelEdit();
  }

  function addSet(match: Match) {
    if (match.sets.length >= 3) return;
    updateMatch(match.id, {
      sets: [...match.sets, { a: "0", b: "0" }],
    });
  }

  function removeSet(match: Match) {
    if (match.sets.length <= 1) return;
    updateMatch(match.id, {
      sets: match.sets.slice(0, -1),
    });
  }

  function updateSet(match: Match, index: number, side: "a" | "b", value: string) {
    const newSets = [...match.sets];
    newSets[index] = { ...newSets[index], [side]: value };
    updateMatch(match.id, { sets: newSets });
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
            </div>

            <div className="grid gap-4">
              <Input label="Tournament / Event" value={form.tournament} onChange={(v) => updateForm("tournament", v)} />
              <Input label="Round" value={form.round} onChange={(v) => updateForm("round", v)} />
              <Input label="Time" value={form.match_time} onChange={(v) => updateForm("match_time", v)} />
              <Input label="Team A" value={form.team_a} onChange={(v) => updateForm("team_a", v)} />
              <Input label="Team B" value={form.team_b} onChange={(v) => updateForm("team_b", v)} />

              {formError && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {formError}
                </div>
              )}

              <button
                onClick={saveMatch}
                className="rounded-2xl bg-green-400 px-6 py-4 font-black text-black"
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
                  {loading ? "Loading matches... : Live Scores"}
                </p>
              </div>

              <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
                {courtMatches.length} matches
              </span>
            </div>

            {courtMatches.length === 0 && !loading && (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-zinc-400">
                No matches created for {selectedCourt} today.
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
                          {match.tournament} · {match.match_time}
                        </p>
                        <h3 className="text-xl font-black">
                          {match.team_a} vs {match.team_b}
                        </h3>
                        <p className="text-sm text-zinc-400">{match.round}</p>
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
                      {activeMatch.team_a} vs {activeMatch.team_b}
                    </h2>
                    <p className="text-zinc-400">{activeMatch.court}</p>
                  </div>

                  <ControlSection title="Match status">
                    <div className="grid gap-3 md:grid-cols-3">
                      {(["Pending", "In Progress", "Finished"] as MatchStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateMatch(activeMatch.id, { status })}
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
                  </ControlSection>

                  <ControlSection title="3rd set format">
                    <div className="grid gap-3 md:grid-cols-2">
                      {(["Full 3rd Set", "Super Tiebreak"] as ThirdSetMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => updateMatch(activeMatch.id, { third_set_mode: mode })}
                          className={`rounded-2xl px-5 py-4 font-bold ${
                            activeMatch.third_set_mode === mode
                              ? "bg-green-400 text-black"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </ControlSection>

                  <ControlSection title="Game score">
                    <div className="grid gap-4 md:grid-cols-2">
                      <GameButtons
                        label={activeMatch.team_a}
                        value={activeMatch.game_a}
                        onChange={(value) => updateMatch(activeMatch.id, { game_a: value })}
                      />
                      <GameButtons
                        label={activeMatch.team_b}
                        value={activeMatch.game_b}
                        onChange={(value) => updateMatch(activeMatch.id, { game_b: value })}
                      />
                    </div>
                  </ControlSection>

                  <ControlSection title="Serving team">
                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        onClick={() => updateMatch(activeMatch.id, { serving: "A" })}
                        className={`rounded-2xl px-5 py-4 font-bold ${
                          activeMatch.serving === "A"
                            ? "bg-green-400 text-black"
                            : "bg-white/10"
                        }`}
                      >
                        ● {activeMatch.team_a}
                      </button>
                      <button
                        onClick={() => updateMatch(activeMatch.id, { serving: "B" })}
                        className={`rounded-2xl px-5 py-4 font-bold ${
                          activeMatch.serving === "B"
                            ? "bg-green-400 text-black"
                            : "bg-white/10"
                        }`}
                      >
                        ● {activeMatch.team_b}
                      </button>
                    </div>
                  </ControlSection>

                  <ControlSection title="Sets">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => addSet(activeMatch)}
                        disabled={activeMatch.sets.length >= 3}
                        className="rounded-full border border-green-400 px-4 py-2 text-sm text-green-400 disabled:opacity-30"
                      >
                        + Add set
                      </button>

                      <button
                        onClick={() => removeSet(activeMatch)}
                        disabled={activeMatch.sets.length <= 1}
                        className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 disabled:opacity-30"
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
                            {index === 2 && activeMatch.third_set_mode === "Super Tiebreak"
                              ? "Super TB"
                              : `Set ${index + 1}`}
                          </div>

                          <input
                            value={set.a}
                            onChange={(e) => updateSet(activeMatch, index, "a", e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-center font-bold outline-none focus:border-green-400"
                          />

                          <input
                            value={set.b}
                            onChange={(e) => updateSet(activeMatch, index, "b", e.target.value)}
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

function LiveScorePreview({ match, compact = false }: { match: Match; compact?: boolean }) {
  const showSet3 = Boolean(match.sets[2]);
  const thirdSetLabel = match.third_set_mode === "Super Tiebreak" ? "TB" : "S3";

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0f0c] shadow-2xl">
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
          name={match.team_a}
          serving={match.serving === "A"}
          sets={match.sets.map((s) => s.a)}
          game={match.game_a}
          showSet3={showSet3}
          compact={compact}
        />

        <PublicScoreRow
          name={match.team_b}
          serving={match.serving === "B"}
          sets={match.sets.map((s) => s.b)}
          game={match.game_b}
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

function ControlSection({ title, children }: { title: string; children: React.ReactNode }) {
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
