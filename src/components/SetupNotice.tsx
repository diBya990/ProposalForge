// Shown when the database tables don't exist yet.
export default function SetupNotice() {
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-amber-100">
      <h2 className="text-lg font-semibold">One more setup step: create the database tables</h2>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-amber-100/90">
        <li>Open your Supabase project, then click <b>SQL Editor</b> in the left sidebar.</li>
        <li>Click <b>New query</b>.</li>
        <li>
          Copy everything in the file <code className="rounded bg-black/30 px-1">supabase/schema.sql</code> and paste it in.
        </li>
        <li>Click <b>Run</b>, then refresh this page.</li>
      </ol>
    </div>
  );
}
