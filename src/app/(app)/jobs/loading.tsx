// Shown automatically by Next.js while the job feed is loading
export default function LoadingJobs() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold text-white">Jobs for you</h1>
      <p className="mt-1 text-slate-400">Finding jobs that match your skills...</p>
      <ul className="mt-8 space-y-4" aria-hidden>
        {[1, 2, 3].map((n) => (
          <li key={n} className="glass h-44 animate-pulse rounded-2xl" />
        ))}
      </ul>
    </div>
  );
}
