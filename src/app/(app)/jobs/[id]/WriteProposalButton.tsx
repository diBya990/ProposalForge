"use client";

import { useState, useTransition } from "react";
import { writeProposal } from "../actions";

// "Write my proposal" for this job. On success the action opens the proposal page.
export default function WriteProposalButton({ jobId, label }: { jobId: string; label: string }) {
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState("");

  function write() {
    setError("");
    startTransition(async () => {
      const result = await writeProposal(jobId);
      // Only reached if something went wrong (success moves to the proposal page)
      if (result && !result.ok) setError(result.message);
    });
  }

  return (
    <div>
      <button type="button" onClick={write} disabled={busy} className="btn-glow w-full rounded-xl px-6 py-3 font-semibold text-white">
        {busy ? (
          <span className="flex items-center justify-center gap-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
            Writing your proposal, price and follow-ups...
          </span>
        ) : (
          label
        )}
      </button>
      {error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
