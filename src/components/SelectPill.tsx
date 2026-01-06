"use client";

type Props = {
  label: string;
  selected?: boolean;
  onClick?: () => void;
};

export function SelectPill({ label, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm transition border",
        selected
          ? "bg-black text-white border-black"
          : "bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
