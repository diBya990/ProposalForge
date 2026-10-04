import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdvisorCard from "./AdvisorCard";
import WriteProposalButton from "./WriteProposalButton";
import { ContractAnswer, FitAnswer, RateAnswer } from "./AdvisorAnswers";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { JOB_TYPE_LABELS } from "@/lib/jobs";
import { jobUsage, profileCompleteness } from "@/lib/rules";
import type { ContractAdvice, FitAdvice, RateAdvice } from "@/lib/advisors";
import type { Profile, SavedJob } from "@/lib/types";

export const metadata: Metadata = { title: "Job · ProposalForge" };

// The job page: job details, the 3 AI advisors, and "Write my proposal"
export default async function JobPage(props: PageProps<"/jobs/[id]">) {
  const { id } = await props.params;
  const { supabase, user } = await requireUser();

  const [{ data: job }, { data: profile }, { data: proposals }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", id).maybeSingle<SavedJob>(),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>(),
    supabase.from("proposals").select("id, created_at").eq("job_id", id).order("created_at", { ascending: false }),
  ]);
  if (!job) notFound();

  const ready = profile ? profileCompleteness(profile).readyForAI : false;
  const usage = jobUsage(profile ?? { plan: "free", usage_month: "", usage_count: 0 });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/jobs" className="text-sm text-slate-400 hover:text-white">
        ← Back to jobs
      </Link>

      {/* ----- The job ----- */}
      <section className="glass rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white md:text-3xl">{job.title}</h1>
            <p className="mt-1 text-slate-400">
              {[job.company, job.location].filter(Boolean).join(" · ") || "Pasted job post"}
            </p>
          </div>
          {job.matched_skills.length > 0 && (
            <span className="shrink-0 rounded-full bg-indigo-500/15 px-3 py-1 text-sm font-semibold text-indigo-200">
              {job.match_percent}% skill match
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-slate-300">{JOB_TYPE_LABELS[job.job_type]}</span>
          {job.salary && <span className="rounded-full bg-white/10 px-2.5 py-1 text-slate-300">💰 {job.salary}</span>}
          {job.matched_skills.map((skill) => (
            <span key={skill} className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-indigo-200">
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <details className="min-w-0 flex-1">
            <summary className="cursor-pointer text-slate-400 hover:text-white">Read the full job post</summary>
            <p className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white/[0.03] p-4 text-slate-300">
              {job.description}
            </p>
          </details>
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener" className="text-indigo-300 hover:text-white">
              Apply on {job.source} ↗
            </a>
          )}
        </div>
      </section>

      {/* ----- Credit info (business rule: 5 jobs / month on Free) ----- */}
      {!ready ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-amber-100">
          <b>Finish your profile first</b> so the AI can give advice about you: name, 3+ skills, experience summary and hourly rate.
          <Link href="/profile" className="btn-glow mt-3 block w-fit rounded-xl px-4 py-2 text-sm font-semibold text-white">
            Complete profile
          </Link>
        </div>
      ) : (
        <p className="text-center text-sm text-slate-400">
          {job.counted
            ? "✓ All AI help for this job is included. Ask as much as you like."
            : usage.limit === null
              ? "Unlimited AI help with Pro ✨"
              : usage.reachedLimit
                ? (
                    <>
                      You&apos;ve used your 5 free jobs this month.{" "}
                      <Link href="/billing" className="font-semibold text-indigo-300 underline hover:text-white">
                        Upgrade to Pro
                      </Link>{" "}
                      to keep going.
                    </>
                  )
                : `Your first question about this job uses 1 of your ${usage.remaining} free jobs left this month. After that, everything for this job is included.`}
        </p>
      )}

      {/* ----- The 3 advisors ----- */}
      <AdvisorCard
        jobId={job.id}
        kind="fit"
        icon="🚩"
        title="Should I apply?"
        description="Your fit score, red flags, and questions to ask the client."
        hasAnswer={!!job.fit}
      >
        {!!job.fit && <FitAnswer advice={job.fit as FitAdvice} />}
      </AdvisorCard>

      <AdvisorCard
        jobId={job.id}
        kind="rate"
        icon="💰"
        title="Rate & income coach"
        description="What to charge for this job, based on your rate and earnings history."
        hasAnswer={!!job.rate}
      >
        {!!job.rate && <RateAnswer advice={job.rate as RateAdvice} />}
      </AdvisorCard>

      <AdvisorCard
        jobId={job.id}
        kind="contract"
        icon="📄"
        title="Payment & contract assistant"
        description="Scope, payment milestones and terms that protect you."
        hasAnswer={!!job.contract}
      >
        {!!job.contract && <ContractAnswer advice={job.contract as ContractAdvice} />}
      </AdvisorCard>

      {/* ----- Write the proposal ----- */}
      <section className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-6">
        <h2 className="text-lg font-semibold text-white">✍️ Ready to apply?</h2>
        <p className="mb-4 text-sm text-slate-300">Get a tailored proposal, a price estimate and a follow-up plan.</p>
        {proposals && proposals.length > 0 && (
          <ul className="mb-4 space-y-1 text-sm">
            {proposals.map((p, i) => (
              <li key={p.id}>
                <Link href={`/proposals/${p.id}`} className="text-indigo-200 hover:text-white">
                  📄 Your proposal{proposals.length > 1 ? ` #${proposals.length - i}` : ""} · {formatDate(p.created_at)} →
                </Link>
              </li>
            ))}
          </ul>
        )}
        <WriteProposalButton jobId={job.id} label={proposals?.length ? "Write a new version" : "✍️ Write my proposal"} />
      </section>
    </div>
  );
}
