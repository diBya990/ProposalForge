import type { Metadata } from "next";
import Link from "next/link";
import NewProposalForm from "./NewProposalForm";
import SetupNotice from "@/components/SetupNotice";
import { isMissingTableError, requireUser } from "@/lib/auth";
import { profileCompleteness, proposalUsage } from "@/lib/rules";
import { findJob, jobToPostText } from "@/lib/jobs";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "New proposal · ProposalForge" };

export default async function NewProposalPage(props: PageProps<"/proposals/new">) {
  const { job: jobId } = await props.searchParams;
  const { supabase, user } = await requireUser();
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();

  if (isMissingTableError(error)) return <SetupNotice />;

  // Came from the job feed? Fill in that job automatically
  const job = typeof jobId === "string" && profile ? await findJob(profile.skills, jobId) : null;

  const ready = profile ? profileCompleteness(profile).readyForAI : false;
  const usage = proposalUsage(profile ?? { plan: "free", usage_month: "", usage_count: 0 });

  // Business rules decide whether the Generate button can be used
  const blockedReason = !ready ? "profile" : usage.reachedLimit ? "limit" : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">New proposal</h1>
          <p className="mt-1 text-slate-400">
            {job ? "Check the job details below, then generate." : "Paste a job post. Get a proposal, a price and a follow-up plan."}
          </p>
        </div>
        <p className="text-sm text-slate-400">
          {usage.limit === null ? "Unlimited proposals (Pro)" : `${usage.remaining} of ${usage.limit} free proposals left this month`}
        </p>
      </div>

      {blockedReason === "profile" && (
        <Notice>
          <b>Your profile needs a few details first:</b> name, at least 3 skills, an experience summary and your hourly rate. The AI
          uses them to write in your voice and price your work.
          <Link href="/profile" className="btn-glow mt-3 inline-block rounded-xl px-4 py-2 text-sm font-semibold text-white">
            Complete profile
          </Link>
        </Notice>
      )}

      {blockedReason === "limit" && (
        <Notice>
          <b>You&apos;ve used all your free proposals this month.</b> Upgrade to Pro for unlimited proposals.
          <Link href="/#pricing" className="btn-glow mt-3 inline-block rounded-xl px-4 py-2 text-sm font-semibold text-white">
            Upgrade to Pro
          </Link>
        </Notice>
      )}

      {/* Which job this is for (when coming from the job feed) */}
      {job && (
        <div className="glass mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-slate-500">Applying to</p>
            <p className="truncate font-semibold text-white">{job.title}</p>
            <p className="text-sm text-slate-400">
              {job.company} · {job.matchPercent}% match
            </p>
          </div>
          <a href={job.url} target="_blank" rel="noopener" className="text-sm text-indigo-300 hover:text-white">
            View original on {job.source} ↗
          </a>
        </div>
      )}
      {jobId && !job && (
        <Notice>That job is no longer in your feed. You can still paste its description below.</Notice>
      )}

      <div className="mt-6">
        <NewProposalForm blockedReason={blockedReason} initialJobPost={job ? jobToPostText(job) : ""} />
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-amber-100">{children}</div>;
}
