// A small box with a label, a big number and an optional note underneath.
export default function StatCard({
  label,
  value,
  note,
  children,
}: {
  label: string;
  value: string;
  note?: string;
  children?: React.ReactNode; // optional extra, e.g. a progress bar
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
      {children}
    </div>
  );
}
