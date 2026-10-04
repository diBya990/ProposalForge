"use client";

import { useState, useTransition } from "react";
import { runAdvisor } from "../actions";
import type { AdvisorKind } from "@/lib/advisors";

const LOADING_TEXT: Record<AdvisorKind, string> = {
  fit: "Checking your fit and looking for red flags...",
  rate: "Working out what you should charge...",
  contract: "Drafting scope, milestones and payment terms...",
};

// One advisor box: a title, an "Ask" button, and the AI's answer (passed in as children)
export default function AdvisorCard({
  jobId,
  kind,
  icon,
  title,
  description,
  hasAnswer,
  children,
}: {
  jobId: string;
  kind: AdvisorKind;
  icon: string;
  title: string;
  description: string;
  hasAnswer: boolean;
  children?: React.ReactNode;
}) {
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState("");

  function ask() {
    setError("");
    startTransition(async () => {
      const result = await runAdvisor(jobId, kind);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            <span aria-hidden>{icon}</span> {title}
          </h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={ask}
          disabled={busy}
          className={`${hasAnswer ? "btn-soft" : "btn-glow"} rounded-xl px-5 py-2 text-sm font-semibold text-white`}
        >
          {busy ? "Thinking..." : hasAnswer ? "Ask again" : "Ask the AI"}
        </button>
      </div>

      {busy && (
        <p className="mt-4 flex items-center gap-3 text-sm text-slate-300" role="status">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
          {LOADING_TEXT[kind]} (usually 10 to 30 seconds)
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      {hasAnswer && !busy && <div className="mt-5">{children}</div>}
    </section>
  );
}
