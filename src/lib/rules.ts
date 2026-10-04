// =====================================================================
// ProposalForge business rules, all in one place.
// The database (supabase/schema.sql) enforces the same limits, so these
// can't be bypassed. Here they power the UI and friendly error messages.
// =====================================================================

import type { Plan, Platform, Profile, ProjectStatus, ProposalSummary, WritingTone } from "./types";

// ----- Plans & pricing -----
export const PLANS: Record<Plan, { name: string; priceMonthly: number; proposalsPerMonth: number | null }> = {
  free: { name: "Free", priceMonthly: 0, proposalsPerMonth: 5 },
  pro: { name: "Pro", priceMonthly: 12, proposalsPerMonth: null }, // null = unlimited
};

// ----- Field limits (same numbers as the database checks) -----
export const LIMITS = {
  nameMax: 80,
  headlineMax: 120,
  locationMax: 80,
  bioMax: 2000,
  bioMin: 50, // a short bio gives the AI too little to work with
  skillsMax: 20,
  skillMaxLength: 40,
  skillsMinForAI: 3,
  portfolioMax: 5,
  yearsMax: 60,
  hourlyRateMax: 1000,
  monthlyGoalMax: 1_000_000,
  projectTitleMax: 120,
  clientNameMax: 80,
  projectDescriptionMax: 1000,
  projectAmountMax: 1_000_000,
  jobPostMin: 80, // shorter posts don't give the AI enough to work with
  jobPostMax: 15000,
};

// ----- Choices shown in forms -----
export const WRITING_TONES: { value: WritingTone; label: string; description: string; example: string }[] = [
  { value: "professional", label: "Professional", description: "Clear, polished and formal", example: "I would be glad to help you deliver this project." },
  { value: "friendly", label: "Friendly", description: "Warm and conversational", example: "Hey! This sounds like a really fun project." },
  { value: "confident", label: "Confident", description: "Bold and results-first", example: "I've solved this exact problem for 3 clients." },
  { value: "concise", label: "Concise", description: "Short and to the point", example: "Done this before. Can start Monday." },
];

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "upwork", label: "Upwork" },
  { value: "fiverr", label: "Fiverr" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "direct", label: "Direct client" },
  { value: "other", label: "Other" },
];

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In progress" },
  { value: "cancelled", label: "Cancelled" },
];

export function platformLabel(value: Platform) {
  return PLATFORMS.find((p) => p.value === value)?.label ?? value;
}

// ----- Rule: proposal usage this month -----
// The Free plan gets 5 proposals per calendar month; Pro is unlimited.
// The counter resets automatically when a new month starts.
export function proposalUsage(profile: Pick<Profile, "plan" | "usage_month" | "usage_count">, today = new Date()) {
  const thisMonth = today.toISOString().slice(0, 7); // "2026-10"
  const used = profile.usage_month?.slice(0, 7) === thisMonth ? profile.usage_count : 0;
  const limit = PLANS[profile.plan].proposalsPerMonth;
  return {
    used,
    limit, // null = unlimited
    remaining: limit === null ? null : Math.max(0, limit - used),
    reachedLimit: limit !== null && used >= limit,
  };
}

// ----- Rule: profile completeness -----
// Each item adds to the percentage. Items marked requiredForAI must be done
// before the AI can write proposals (it needs them to sound like you).
export function profileChecklist(profile: Profile | null) {
  const p = profile;
  return [
    { label: "Add your full name", done: !!p?.full_name.trim(), requiredForAI: true },
    { label: `List at least ${LIMITS.skillsMinForAI} skills`, done: (p?.skills.length ?? 0) >= LIMITS.skillsMinForAI, requiredForAI: true },
    { label: "Write your experience summary", done: (p?.bio.trim().length ?? 0) >= LIMITS.bioMin, requiredForAI: true },
    { label: "Set your hourly rate", done: (p?.hourly_rate ?? 0) > 0, requiredForAI: true },
    { label: "Add a professional headline", done: !!p?.headline.trim(), requiredForAI: false },
    { label: "Add a portfolio link", done: (p?.portfolio_links.length ?? 0) > 0, requiredForAI: false },
    { label: "Set a monthly income goal", done: (p?.monthly_goal ?? 0) > 0, requiredForAI: false },
  ];
}

export function profileCompleteness(profile: Profile | null) {
  const items = profileChecklist(profile);
  const done = items.filter((item) => item.done).length;
  return {
    items,
    percent: Math.round((done / items.length) * 100),
    readyForAI: items.filter((item) => item.requiredForAI).every((item) => item.done),
  };
}

// ----- Rule: win rate -----
// Win rate = proposals won ÷ proposals actually sent (drafts don't count).
export function winRate(proposals: ProposalSummary[]) {
  const sent = proposals.filter((p) => p.status !== "draft");
  const won = sent.filter((p) => p.status === "won").length;
  return {
    sent: sent.length,
    won,
    replied: sent.filter((p) => p.status === "replied").length,
    percent: sent.length ? Math.round((won / sent.length) * 100) : null, // null = no data yet
  };
}
