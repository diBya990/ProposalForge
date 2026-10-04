"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { generateProposal } from "./actions";
import { LIMITS } from "@/lib/rules";
import type { FormState } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

// A realistic job post, so anyone can try the app in one click
const EXAMPLE_JOB_POST = `Next.js developer needed for a yoga studio booking website

Hi! I run a small yoga studio in Austin and need a simple website where clients can see our weekly class schedule and book a spot online.

What I need:
- A clean, calm design that works well on phones
- Weekly class schedule (about 15 classes per week)
- Online booking with a limit of 12 spots per class
- Email confirmation after booking
- A simple admin page so I can add or cancel classes

Nice to have: Stripe payments for class packs.

Budget: $1,000 to $1,500. I'd like it live within a month.
Please share similar work you've done. Thanks, Sarah`;

// Messages shown one after another while the AI works
const LOADING_STEPS = [
  "Reading the job post...",
  "Matching it with your skills...",
  "Writing your proposal...",
  "Estimating a fair price...",
  "Planning your follow-ups...",
];

export default function NewProposalForm({ blockedReason, initialJobPost = "" }: { blockedReason?: string; initialJobPost?: string }) {
  const [state, formAction, generating] = useActionState(generateProposal, initialState);
  const [jobPost, setJobPost] = useState(initialJobPost);
  const [step, setStep] = useState(0);

  // While generating, move to the next loading message every 2.5 seconds
  useEffect(() => {
    if (!generating) return;
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 2500);
    return () => {
      clearInterval(timer);
      setStep(0);
    };
  }, [generating]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // keeps the pasted text if there's an error
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const fieldError = state.errors?.job_post;
  const disabled = generating || !!blockedReason;

  return (
    <form onSubmit={handleSubmit} className="glass space-y-4 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="job_post" className="font-semibold text-white">
          Paste the job post
        </label>
        <button
          type="button"
          onClick={() => setJobPost(EXAMPLE_JOB_POST)}
          disabled={generating}
          className="rounded-lg px-3 py-1.5 text-sm text-indigo-300 transition hover:bg-white/5 hover:text-white"
        >
          Try an example
        </button>
      </div>

      <textarea
        id="job_post"
        name="job_post"
        rows={14}
        value={jobPost}
        onChange={(e) => setJobPost(e.target.value)}
        maxLength={LIMITS.jobPostMax}
        disabled={generating}
        placeholder="Copy the whole job post from Upwork, Fiverr, LinkedIn or anywhere else and paste it here. Include the budget and any details the client gives."
        className="field resize-y"
      />

      <div className="flex justify-between text-xs">
        <span className={fieldError ? "text-red-300" : "text-slate-500"}>
          {fieldError ?? `At least ${LIMITS.jobPostMin} characters`}
        </span>
        <span className="text-slate-500">
          {jobPost.length.toLocaleString()}/{LIMITS.jobPostMax.toLocaleString()}
        </span>
      </div>

      {state.message && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={disabled} className="btn-glow w-full rounded-xl px-6 py-3 font-semibold text-white">
        {generating ? (
          <span className="flex items-center justify-center gap-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
            {LOADING_STEPS[step]}
          </span>
        ) : (
          "✨ Generate proposal, price & follow-ups"
        )}
      </button>
      {generating && <p className="text-center text-xs text-slate-500">This usually takes 10 to 20 seconds.</p>}
    </form>
  );
}
