import type { Metadata } from "next";
import Link from "next/link";
import CompletenessCard from "@/components/CompletenessCard";
import EarningsChart from "@/components/EarningsChart";
import SetupNotice from "@/components/SetupNotice";
import StatCard from "@/components/StatCard";
import { isMissingTableError, requireUser } from "@/lib/auth";
import { earningsByPlatform, earningsSummary, monthlyEarnings } from "@/lib/earnings";
import { formatDate, formatMoney } from "@/lib/format";
import { upcomingFollowUps } from "@/lib/followups";
import { PLANS, platformLabel, jobUsage, profileCompleteness, winRate } from "@/lib/rules";
import type { Profile, Project, Proposal } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard · ProposalForge" };

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  // Load everything the dashboard needs at the same time
  const [profileResult, projectsResult, proposalsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("projects").select("*").order("completed_on", { ascending: false, nullsFirst: false }),
    supabase.from("proposals").select("id, status, created_at, job_title, sent_at, follow_ups, followups_sent"),
  ]);

  if (
    isMissingTableError(profileResult.error) ||
    isMissingTableError(projectsResult.error) ||
    isMissingTableError(proposalsResult.error)
  ) {
    return <SetupNotice />;
  }

  const profile = profileResult.data as Profile | null;
  const projects = (projectsResult.data ?? []) as Project[];
  const proposals = ((proposalsResult.data ?? []) as Proposal[]).map((p) => ({ ...p, followups_sent: p.followups_sent ?? [] }));

  // ----- Numbers -----
  const summary = earningsSummary(projects);
  const months = monthlyEarnings(projects);
  const platforms = earningsByPlatform(projects);
  const usage = jobUsage(profile ?? { plan: "free", usage_month: "", usage_count: 0 });
  const wins = winRate(proposals);
  const followUps = upcomingFollowUps(proposals).slice(0, 5);
  const { readyForAI } = profileCompleteness(profile);

  const plan = profile?.plan ?? "free";
  const goal = Number(profile?.monthly_goal ?? 0);
  const goalPercent = goal > 0 ? Math.min(100, Math.round((summary.earnedThisMonth / goal) * 100)) : 0;
  const firstName = (profile?.full_name || user.user_metadata.full_name || "there").split(" ")[0];

  // The usage counter resets on the 1st of next month
  const now = new Date();
  const resetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

  const recent = projects.slice(0, 5);
  const topPlatformTotal = platforms[0]?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Hi, <span className="gradient-text">{firstName}</span> 👋
          </h1>
          <p className="mt-1 text-slate-400">Here&apos;s how your freelance business is doing.</p>
        </div>
        <Link href="/jobs" className="btn-glow rounded-xl px-5 py-2.5 font-semibold text-white">
          ✨ New proposal
        </Link>
      </div>

      {/* Reminder to finish the profile */}
      {!readyForAI && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5">
          <p className="text-amber-100">
            <b>Finish your profile</b> so the AI can write proposals that sound like you.
          </p>
          <Link href="/profile" className="btn-glow rounded-xl px-5 py-2 text-sm font-semibold text-white">
            Complete profile
          </Link>
        </div>
      )}

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Earned this month"
          value={formatMoney(summary.earnedThisMonth)}
          note={goal > 0 ? `${goalPercent}% of your ${formatMoney(goal)} goal` : "Set a monthly goal in your profile"}
        >
          {goal > 0 && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${goalPercent}%` }} />
            </div>
          )}
        </StatCard>
        <StatCard label="Total earned" value={formatMoney(summary.totalEarned)} note={`${formatMoney(summary.earnedThisYear)} this year`} />
        <StatCard
          label="Projects completed"
          value={String(summary.completedCount)}
          note={`${summary.inProgressCount} in progress (${formatMoney(summary.pipelineValue)})`}
        />
        <StatCard label="Average project" value={formatMoney(summary.averageProjectValue)} note="Completed projects only" />
      </div>

      {/* Graph + plan/win rate */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <EarningsChart months={months} />

        <div className="space-y-6">
          {/* Plan & usage (business rule: Free = 5 jobs / month) */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">{PLANS[plan].name} plan</h2>
              <span className="text-sm text-slate-400">
                {PLANS[plan].priceMonthly ? `$${PLANS[plan].priceMonthly}/mo` : "$0"}
              </span>
            </div>

            {usage.limit === null ? (
              <p className="mt-3 text-slate-300">Unlimited jobs ✨</p>
            ) : (
              <>
                <p className="mt-3 text-sm text-slate-400">Jobs analyzed this month</p>
                <p className="text-2xl font-bold text-white">
                  {usage.used} <span className="text-base font-normal text-slate-400">of {usage.limit}</span>
                </p>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-valuenow={usage.used}
                  aria-valuemin={0}
                  aria-valuemax={usage.limit}
                  aria-label="Jobs used this month"
                >
                  <div
                    className={`h-full rounded-full ${usage.reachedLimit ? "bg-red-400" : "bg-indigo-400"}`}
                    style={{ width: `${(usage.used / usage.limit) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {usage.reachedLimit ? "Limit reached. " : `${usage.remaining} left. `}
                  Resets {formatDate(resetDate)}.
                </p>
                <Link href="/#pricing" className="btn-glow mt-4 block rounded-xl px-4 py-2 text-center text-sm font-semibold text-white">
                  Upgrade to Pro: unlimited
                </Link>
              </>
            )}
          </div>

          {/* Win rate (business rule: won ÷ sent, drafts don't count) */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white">Win rate</h2>
            <p className="mt-2 text-3xl font-bold text-white">{wins.percent === null ? "—" : `${wins.percent}%`}</p>
            <p className="mt-1 text-sm text-slate-400">
              {wins.sent === 0
                ? "Send your first proposal to start tracking."
                : `${wins.won} won · ${wins.replied} replied · ${wins.sent} sent`}
            </p>
            <Link href="/proposals" className="mt-3 inline-block text-sm text-indigo-300 hover:text-white">
              All proposals →
            </Link>
          </div>

          {/* Follow-ups to send in the next 7 days (or overdue) */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white">📅 Upcoming follow-ups</h2>
            {followUps.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">Nothing to send this week. Mark proposals as Sent to get reminders.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {followUps.map((f) => (
                  <li key={`${f.proposalId}-${f.day}`}>
                    <Link href={`/proposals/${f.proposalId}`} className="block rounded-lg px-2 py-1.5 text-sm transition hover:bg-white/5">
                      <span className="block truncate text-white">{f.jobTitle}</span>
                      <span className={f.state === "upcoming" ? "text-slate-400" : "text-amber-300"}>
                        Day {f.day} ·{" "}
                        {f.state === "overdue" ? `overdue since ${formatDate(f.dueDate)}` : f.state === "due" ? "send today" : formatDate(f.dueDate)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Income by platform + recent projects + profile */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-white">Income by platform</h2>
          {platforms.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No completed projects yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {platforms.map((p) => (
                <li key={p.platform}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{platformLabel(p.platform)}</span>
                    <span className="font-medium text-white">{formatMoney(p.total)}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-white/5">
                    <div className="h-full rounded-[4px]" style={{ width: `${(p.total / topPlatformTotal) * 100}%`, background: "#7c83f6" }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-white">Recent projects</h2>
            <Link href="/projects" className="text-sm text-indigo-300 hover:text-white">
              See all →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="mt-3 text-sm text-slate-400">
              <p>Add your past projects to see your earnings here.</p>
              <Link href="/projects" className="btn-soft mt-4 inline-block rounded-xl px-4 py-2 font-medium text-white">
                Add projects
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-white/5">
              {recent.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{p.title}</p>
                    <p className="text-xs text-slate-500">
                      {p.status === "completed" ? formatDate(p.completed_on) : p.status === "in_progress" ? "In progress" : "Cancelled"}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${p.status === "cancelled" ? "text-slate-500 line-through" : "text-white"}`}>
                    {formatMoney(Number(p.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <CompletenessCard profile={profile} showLink />
      </div>
    </div>
  );
}
