"use client";

import Link from "next/link";
import { useState } from "react";
import type { JobType } from "@/lib/jobs";

// The small version of a job that the page sends to the browser (no long description)
export type JobCard = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  typeLabel: string;
  salary: string;
  source: string;
  url: string;
  matchedSkills: string[];
  matchPercent: number;
  excerpt: string;
  posted: string; // "3 days ago"
};

const PAGE_SIZE = 15;

const TYPE_FILTERS: { value: "all" | JobType; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "contract", label: "Freelance / contract" },
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
];

// The list of matched jobs, with search and filters
export default function JobFeed({ jobs }: { jobs: JobCard[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | JobType>("all");
  const [strongOnly, setStrongOnly] = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);

  const query = search.trim().toLowerCase();
  const filtered = jobs.filter(
    (job) =>
      (type === "all" || job.type === type) &&
      (!strongOnly || job.matchPercent >= 50) &&
      (!query || `${job.title} ${job.company} ${job.matchedSkills.join(" ")}`.toLowerCase().includes(query))
  );

  // Any filter change starts the list from the top again
  function resetPaging() {
    setShown(PAGE_SIZE);
  }

  return (
    <div>
      {/* Filters */}
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPaging();
          }}
          placeholder="Search title, company or skill"
          aria-label="Search jobs"
          className="field min-w-0 flex-1 basis-56"
        />
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as "all" | JobType);
            resetPaging();
          }}
          aria-label="Job type"
          className="field w-auto"
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value} className="bg-slate-900">
              {f.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={strongOnly}
            onChange={(e) => {
              setStrongOnly(e.target.checked);
              resetPaging();
            }}
            className="h-4 w-4 accent-indigo-500"
          />
          Strong matches only (50%+)
        </label>
      </div>

      <p className="mt-4 text-sm text-slate-400">
        {filtered.length} job{filtered.length === 1 ? "" : "s"} match your skills
      </p>

      {/* Job cards */}
      <ul className="mt-3 space-y-4">
        {filtered.slice(0, shown).map((job) => (
          <li key={job.id} className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-white">{job.title}</h2>
                <p className="mt-0.5 truncate text-sm text-slate-400">
                  {job.company} · {job.location}
                </p>
              </div>
              <MatchBadge percent={job.matchPercent} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span
                className={`rounded-full px-2.5 py-1 font-medium ${
                  job.type === "contract" ? "bg-emerald-500/15 text-emerald-200" : "bg-white/10 text-slate-300"
                }`}
              >
                {job.typeLabel}
              </span>
              {job.salary && <span className="rounded-full bg-white/10 px-2.5 py-1 text-slate-300">💰 {job.salary}</span>}
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-slate-400">{job.posted}</span>
            </div>

            <p className="mt-3 line-clamp-2 text-sm text-slate-400">{job.excerpt}</p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500">Your matching skills:</span>
              {job.matchedSkills.map((skill) => (
                <span key={skill} className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs text-indigo-200">
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
              {/* Credit the job board and link to the original post (their rule) */}
              <a
                href={job.url}
                target="_blank"
                rel="noopener"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                View original on {job.source} ↗
              </a>
              <Link
                href={`/proposals/new?job=${encodeURIComponent(job.id)}`}
                className="btn-glow rounded-xl px-5 py-2 text-sm font-semibold text-white"
              >
                ✍️ Write proposal
              </Link>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="glass mt-3 rounded-2xl p-6 text-slate-400">No jobs match these filters. Try clearing the search.</p>
      )}

      {shown < filtered.length && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE_SIZE)}
          className="btn-soft mt-6 w-full rounded-xl px-5 py-3 text-sm font-medium text-white"
        >
          Show more jobs ({filtered.length - shown} more)
        </button>
      )}
    </div>
  );
}

// "85% match" pill: green for strong, indigo for medium, grey for weak
function MatchBadge({ percent }: { percent: number }) {
  const style =
    percent >= 70 ? "bg-emerald-500/15 text-emerald-200" : percent >= 40 ? "bg-indigo-500/15 text-indigo-200" : "bg-white/10 text-slate-300";
  return <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${style}`}>{percent}% match</span>;
}
