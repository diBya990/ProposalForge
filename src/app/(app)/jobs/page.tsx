import type { Metadata } from "next";
import Link from "next/link";
import JobFeed, { type JobCard } from "./JobFeed";
import SetupNotice from "@/components/SetupNotice";
import { isMissingTableError, requireUser } from "@/lib/auth";
import { getMatchedJobs, JOB_TYPE_LABELS, type MatchedJob } from "@/lib/jobs";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Find jobs · ProposalForge" };

// "2026-10-01T..." -> "3 days ago"
function timeAgo(date: string, now: number) {
  const days = Math.floor((now - new Date(date).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export default async function JobsPage() {
  const { supabase, user } = await requireUser();
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  if (isMissingTableError(error)) return <SetupNotice />;

  const skills = profile?.skills ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Jobs for you</h1>
          <p className="mt-1 text-slate-400">Real remote jobs, matched to the skills in your profile.</p>
        </div>
        <Link href="/proposals/new" className="btn-soft rounded-xl px-5 py-2.5 text-sm font-medium text-white">
          📋 Paste a job post instead
        </Link>
      </div>

      {skills.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-amber-100">
          <b>Add your skills first.</b> We use them to find jobs that fit you.
          <Link href="/profile" className="btn-glow mt-3 block w-fit rounded-xl px-4 py-2 text-sm font-semibold text-white">
            Add skills to my profile
          </Link>
        </div>
      ) : (
        <JobList skills={skills} />
      )}

      <p className="mt-10 text-center text-xs text-slate-500">
        Jobs from{" "}
        <a href="https://himalayas.app" target="_blank" rel="noopener" className="underline hover:text-white">
          Himalayas
        </a>
        ,{" "}
        <a href="https://remoteok.com" target="_blank" rel="noopener" className="underline hover:text-white">
          Remote OK
        </a>{" "}
        and{" "}
        <a href="https://remotive.com" target="_blank" rel="noopener" className="underline hover:text-white">
          Remotive
        </a>
        . Always apply on the original job page.
      </p>
    </div>
  );
}

// Turns full jobs into the small cards the browser needs (keeps the page light)
function toCards(jobs: MatchedJob[]): JobCard[] {
  const now = Date.now();
  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    typeLabel: JOB_TYPE_LABELS[job.type],
    salary: job.salary,
    source: job.source,
    url: job.url,
    matchedSkills: job.matchedSkills,
    matchPercent: job.matchPercent,
    excerpt: job.description.slice(0, 300),
    posted: timeAgo(job.publishedAt, now),
  }));
}

async function JobList({ skills }: { skills: string[] }) {
  const jobs = await getMatchedJobs(skills);
  const cards = toCards(jobs);

  return (
    <div className="mt-8">
      <p className="mb-4 text-sm text-slate-400">
        Matching with: {skills.slice(0, 8).join(", ")}
        {skills.length > 8 && ` and ${skills.length - 8} more`} ·{" "}
        <Link href="/profile" className="text-indigo-300 hover:text-white">
          edit skills
        </Link>
      </p>
      {cards.length === 0 ? (
        <p className="glass rounded-2xl p-6 text-slate-400">
          No jobs match your skills right now. Try adding more skills, or paste a job post you found elsewhere.
        </p>
      ) : (
        <JobFeed jobs={cards} />
      )}
    </div>
  );
}
