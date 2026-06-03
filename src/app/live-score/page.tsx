export default function LiveScorePage() {
  const clubs = [
    "Garana Padel",
    "UPadel",
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="text-2xl">☰</button>
            <h1 className="text-2xl font-bold">Recap Live Score</h1>
          </div>

          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-4xl font-bold mb-3">
          Live Scores
        </h2>

        <p className="text-zinc-400 mb-10">
          Follow matches in real time across all Recap clubs.
        </p>

        {/* Club cards */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {clubs.map((club) => (
            <div
              key={club}
              className="
                rounded-3xl
                border border-zinc-800
                bg-white/5
                backdrop-blur-xl
                p-6
                hover:border-green-500
                transition
                cursor-pointer
              "
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-semibold text-lg">
                  {club}
                </span>

                <span className="text-green-500 text-sm">
                  LIVE
                </span>
              </div>

              <div className="space-y-2 text-sm text-zinc-400">
                <p>Available Courts</p>
                <p className="text-white font-medium">
                  4 Courts
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Match */}
        <div
          className="
            mt-12
            rounded-3xl
            border border-zinc-800
            bg-white/5
            backdrop-blur-xl
            p-8
          "
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-green-500 font-semibold">
                LIVE
              </p>

              <h3 className="text-2xl font-bold">
                Garana Padel · Court 2
              </h3>

              <p className="text-zinc-400">
                Semifinal · 6:00 PM
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-5 items-center text-xl">
              <div className="col-span-2 flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Ana / Maria</span>
              </div>

              <div className="text-center">6</div>
              <div className="text-center">4</div>
              <div className="text-center text-green-500 font-bold">
                40
              </div>
            </div>

            <div className="grid grid-cols-5 items-center text-xl">
              <div className="col-span-2">
                Laura / Sofia
              </div>

              <div className="text-center">4</div>
              <div className="text-center">3</div>
              <div className="text-center">30</div>
            </div>
          </div>

          <div className="mt-8">
            <span className="rounded-full border border-green-500 px-4 py-2 text-sm text-green-500">
              Golden Point
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
