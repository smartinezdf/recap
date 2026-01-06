"use client";

export type Club = {
  id: string;
  name: string;
  city: string;
};

export const CLUBS: Club[] = [
  { id: "club-1", name: "Centro Padel", city: "Caracas" },
  { id: "club-2", name: "Green Court", city: "Miami" },
  { id: "club-3", name: "La Central", city: "Madrid" },
  { id: "club-4", name: "TopSpin Club", city: "Buenos Aires" },
];

export function ClubCard(props: Club & { onSelect?: () => void }) {
  const { name, city, onSelect } = props;

  return (
    <button
      onClick={onSelect}
      className="group w-full rounded-2xl border border-zinc-200 bg-white p-5 hover:shadow-sm transition"
    >
      {/* Placeholder visual */}
      <div className="h-28 w-full rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-100 hero-sheen" />

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-zinc-500">{city}</p>
        </div>

        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-sm group-hover:bg-zinc-100">
          →
        </span>
      </div>
    </button>
  );
}

