export function Value({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">
      <p className="font-medium">{title}</p>
    </div>
  );
}
