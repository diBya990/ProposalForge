// =====================================================================
// The job feed: real remote jobs from free public job boards,
// matched to the freelancer's skills.
//
// Sources (all free, no key needed). Their rules: credit them by name
// and send people to the original job page to apply, so we always do that.
//   - Himalayas  (himalayas.app)  -> searched by the user's skills
//   - Remote OK  (remoteok.com)   -> latest remote jobs
//   - Remotive   (remotive.com)   -> latest remote jobs
//
// Each source is cached for 1 hour, so we don't call them on every page load.
// =====================================================================

import { LIMITS } from "./rules";

export type JobType = "contract" | "full_time" | "part_time" | "other";

export type Job = {
  id: string; // e.g. "remoteok-1137420"
  source: "Himalayas" | "Remote OK" | "Remotive";
  title: string;
  company: string;
  url: string; // the original job page (apply there)
  type: JobType;
  salary: string; // "" when unknown
  location: string;
  tags: string[];
  description: string; // plain text, no HTML
  publishedAt: string; // ISO date
};

export type MatchedJob = Job & {
  matchedSkills: string[];
  matchPercent: number;
};

const CACHE_SECONDS = 3600;
const HEADERS = { "User-Agent": "ProposalForge/1.0 (hackathon project)" };

// How many of the user's skills we search Himalayas for (keeps it fast and polite)
const SKILLS_TO_SEARCH = 4;

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  contract: "Freelance / contract",
  full_time: "Full-time",
  part_time: "Part-time",
  other: "Other",
};

// ---------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------

// Job descriptions come as HTML. We turn them into plain text (and never show raw HTML).
export function htmlToText(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<(br|\/p|\/div|\/h\d|\/ul|\/ol)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function toJobType(text: string): JobType {
  const t = text.toLowerCase();
  if (/contract|freelanc/.test(t)) return "contract";
  if (/full/.test(t)) return "full_time";
  if (/part/.test(t)) return "part_time";
  return "other";
}

function formatSalary(min?: number | null, max?: number | null, currency = "USD", period = "") {
  if (!min && !max) return "";
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const range = min && max && min !== max ? `${fmt(min)} – ${fmt(max)}` : fmt((min || max)!);
  return period ? `${range} / ${period}` : range;
}

// A short, stable id made from any text (used for Himalayas jobs, which have no number id)
function shortHash(text: string) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

async function getJson(url: string) {
  try {
    const response = await fetch(url, { headers: HEADERS, next: { revalidate: CACHE_SECONDS } });
    if (!response.ok) {
      console.warn(`[jobs] ${url} answered ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    // One job board being down should never break the page
    console.warn(`[jobs] ${url} failed`, error);
    return null;
  }
}

// ---------------------------------------------------------------------
// The three sources. Each one turns its own format into our Job shape.
// ---------------------------------------------------------------------

type HimalayasJob = {
  guid: string;
  title: string;
  companyName: string;
  applicationLink: string;
  employmentType: string;
  minSalary: number | null;
  maxSalary: number | null;
  currency: string | null;
  salaryPeriod: string | null;
  locationRestrictions: string[] | null;
  categories: string[] | null;
  description: string;
  pubDate: number;
};

async function fromHimalayas(skill: string): Promise<Job[]> {
  const data = await getJson(`https://himalayas.app/jobs/api/search?q=${encodeURIComponent(skill)}`);
  return ((data?.jobs ?? []) as HimalayasJob[]).map((j) => ({
    id: `himalayas-${shortHash(j.guid || j.applicationLink)}`,
    source: "Himalayas",
    title: j.title,
    company: j.companyName,
    url: j.applicationLink,
    type: toJobType(j.employmentType ?? ""),
    salary: formatSalary(j.minSalary, j.maxSalary, j.currency || "USD", j.salaryPeriod ?? ""),
    location: j.locationRestrictions?.length ? j.locationRestrictions.join(", ") : "Worldwide",
    tags: (j.categories ?? []).map((c) => c.replace(/-/g, " ")),
    description: htmlToText(j.description ?? ""),
    publishedAt: new Date(j.pubDate * 1000).toISOString(),
  }));
}

type RemoteOkJob = {
  id: string;
  date: string;
  company: string;
  position: string;
  tags: string[];
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  url: string;
};

async function fromRemoteOk(): Promise<Job[]> {
  const data = await getJson("https://remoteok.com/api");
  // The first item is a legal notice, not a job
  const jobs = Array.isArray(data) ? (data.slice(1) as RemoteOkJob[]) : [];
  return jobs.map((j) => ({
    id: `remoteok-${j.id}`,
    source: "Remote OK",
    title: j.position,
    company: j.company,
    url: j.url,
    type: toJobType(j.tags.join(" ")),
    salary: formatSalary(j.salary_min, j.salary_max, "USD", "year"),
    location: j.location || "Worldwide",
    tags: j.tags,
    description: htmlToText(j.description ?? ""),
    publishedAt: j.date,
  }));
}

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
};

async function fromRemotive(): Promise<Job[]> {
  const data = await getJson("https://remotive.com/api/remote-jobs");
  return ((data?.jobs ?? []) as RemotiveJob[]).map((j) => ({
    id: `remotive-${j.id}`,
    source: "Remotive",
    title: j.title,
    company: j.company_name,
    url: j.url,
    type: toJobType(j.job_type ?? ""),
    salary: j.salary ?? "",
    location: j.candidate_required_location || "Worldwide",
    tags: [j.category, ...(j.tags ?? [])],
    description: htmlToText(j.description ?? ""),
    publishedAt: j.publication_date,
  }));
}

// ---------------------------------------------------------------------
// Matching: how well does a job fit the freelancer's skills?
// No AI here: it's instant, free, and saves the AI for when it matters.
// ---------------------------------------------------------------------

// "Next.js" should also match "nextjs" and "next js"
function skillPattern(skill: string) {
  const s = skill.toLowerCase().trim();
  const variants = new Set([s, s.replace(/\./g, ""), s.replace(/\./g, " ")]);
  const escaped = [...variants].map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // Not part of a longer word: "Java" must not match "JavaScript"
  return new RegExp(`(?<![a-z0-9])(${escaped.join("|")})(?![a-z0-9])`, "i");
}

// Which of the skills appear in a piece of text (used for feed jobs and pasted jobs)
export function matchSkills(skills: string[], text: string) {
  const matchedSkills = skills.filter((skill) => skillPattern(skill).test(text));
  // Matching about half your skills already makes a strong fit, so we scale up and cap at 100
  const matchPercent = skills.length ? Math.min(100, Math.round((matchedSkills.length / Math.min(skills.length, 6)) * 100)) : 0;
  return { matchedSkills, matchPercent };
}

function matchJob(job: Job, skills: string[]): MatchedJob {
  return { ...job, ...matchSkills(skills, `${job.title}\n${job.tags.join(" ")}\n${job.description}`) };
}

// ---------------------------------------------------------------------
// The one function pages use
// ---------------------------------------------------------------------

export async function getMatchedJobs(skills: string[]): Promise<MatchedJob[]> {
  const searches = skills.slice(0, SKILLS_TO_SEARCH).map((skill) => fromHimalayas(skill));
  const results = await Promise.all([...searches, fromRemoteOk(), fromRemotive()]);

  // Remove duplicates (the same job can appear in several searches)
  const unique = new Map<string, Job>();
  for (const job of results.flat()) {
    if (job.title && job.url && !unique.has(job.id)) {
      unique.set(job.id, { ...job, description: job.description.slice(0, LIMITS.jobPostMax - 500) });
    }
  }

  return [...unique.values()]
    .map((job) => matchJob(job, skills))
    .filter((job) => job.matchedSkills.length > 0) // only jobs that use at least one of your skills
    .sort(
      (a, b) =>
        b.matchedSkills.length - a.matchedSkills.length || // best skill match first
        Number(b.type === "contract") - Number(a.type === "contract") || // then freelance/contract
        b.publishedAt.localeCompare(a.publishedAt) // then newest
    );
}

export async function findJob(skills: string[], id: string) {
  const jobs = await getMatchedJobs(skills);
  return jobs.find((job) => job.id === id) ?? null;
}

// Turns a job into the text we give the AI (same as a pasted job post)
export function jobToPostText(job: Job) {
  const lines = [job.title, `Company: ${job.company}`, `Type: ${JOB_TYPE_LABELS[job.type]}`];
  if (job.salary) lines.push(`Salary / budget: ${job.salary}`);
  lines.push(`Location: ${job.location}`, "", job.description);
  return lines.join("\n");
}
