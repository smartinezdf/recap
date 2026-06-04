"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminScorePage() {
  const [sets, setSets] = useState([
    { a: "0", b: "0" },
    { a: "0", b: "0" },
  ]);

  function addSet() {
    setSets([...sets, { a: "0", b: "0" }]);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black/80 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-green-400">
              Recap Admin
            </p>
            <h1 className="text-2xl font-black">Score Control</h1>
          </div>

          <Link href="/live-score" className="text-green-400">
            View Live Score
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
          <input className="rounded-xl bg-black/40 p-4" placeholder="Club name" />
          <input className="rounded-xl bg-black/40 p-4" placeholder="Court" />
          <input className="rounded-xl bg-black/40 p-4" placeholder="Tournament / Event" />
          <input className="rounded-xl bg-black/40 p-4" placeholder="Round" />
          <input className="rounded-xl bg-black/40 p-4" placeholder="Match time" />

          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-xl bg-black/40 p-4" placeholder="Team A" />
            <input className="rounded-xl bg-black/40 p-4" placeholder="Team B" />
          </div>

          <div>
            <p className="mb-3 font-bold">Sets</p>
            <div className="space-y-3">
              {sets.map((set, index) => (
                <div key={index} className="grid grid-cols-3 gap-3">
                  <div className="flex items-center text-zinc-400">Set {index + 1}</div>
                  <input className="rounded-xl bg-black/40 p-4" placeholder="Team A" />
                  <input className="rounded-xl bg-black/40 p-4" placeholder="Team B" />
                </div>
              ))}
            </div>

            <button
              onClick={addSet}
              className="mt-4 rounded-full border border-green-400 px-5 py-3 text-green-400"
            >
              + Add set
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-xl bg-black/40 p-4" placeholder="Game score Team A: 0 / 15 / 30 / 40 / AD" />
            <input className="rounded-xl bg-black/40 p-4" placeholder="Game score Team B: 0 / 15 / 30 / 40 / AD" />
          </div>

          <select className="rounded-xl bg-black/40 p-4">
            <option>Team A serving</option>
            <option>Team B serving</option>
          </select>

          <button className="rounded-full bg-green-400 px-6 py-4 font-black text-black">
            Save match
          </button>
        </div>
      </section>
    </main>
  );
}
