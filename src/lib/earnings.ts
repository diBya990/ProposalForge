// Turns the list of projects into earnings numbers for the dashboard.
// Business rule: money counts as EARNED only when a project is "completed",
// on its completion date. In-progress work is "pipeline" (expected money).
// Cancelled projects never count.

import type { Platform, Project } from "./types";

// "2026-10-03" -> "2026-10"
function monthKey(date: string) {
  return date.slice(0, 7);
}

function completedOnly(projects: Project[]) {
  return projects.filter((p) => p.status === "completed" && p.completed_on);
}

// Earnings for each of the last `count` months, oldest first (for the graph)
export function monthlyEarnings(projects: Project[], count = 12, today = new Date()) {
  const months: { key: string; label: string; total: number; projects: number }[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    months.push({
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
      total: 0,
      projects: 0,
    });
  }

  for (const project of completedOnly(projects)) {
    const month = months.find((m) => m.key === monthKey(project.completed_on!));
    if (month) {
      month.total += Number(project.amount);
      month.projects += 1;
    }
  }
  return months;
}

// The headline numbers on the dashboard
export function earningsSummary(projects: Project[], today = new Date()) {
  const completed = completedOnly(projects);
  const thisMonth = today.toISOString().slice(0, 7);
  const thisYear = today.toISOString().slice(0, 4);

  const sum = (list: Project[]) => list.reduce((total, p) => total + Number(p.amount), 0);
  const totalEarned = sum(completed);
  const inProgress = projects.filter((p) => p.status === "in_progress");

  return {
    totalEarned,
    earnedThisMonth: sum(completed.filter((p) => monthKey(p.completed_on!) === thisMonth)),
    earnedThisYear: sum(completed.filter((p) => p.completed_on!.startsWith(thisYear))),
    completedCount: completed.length,
    inProgressCount: inProgress.length,
    pipelineValue: sum(inProgress),
    averageProjectValue: completed.length ? totalEarned / completed.length : 0,
  };
}

// Earnings grouped by platform, biggest first
export function earningsByPlatform(projects: Project[]) {
  const totals = new Map<Platform, number>();
  for (const p of completedOnly(projects)) {
    totals.set(p.platform, (totals.get(p.platform) ?? 0) + Number(p.amount));
  }
  return [...totals.entries()]
    .map(([platform, total]) => ({ platform, total }))
    .sort((a, b) => b.total - a.total);
}

// Earnings grouped by year, newest first (for the earnings history page)
export function earningsByYear(projects: Project[]) {
  const totals = new Map<string, { total: number; count: number }>();
  for (const p of completedOnly(projects)) {
    const year = p.completed_on!.slice(0, 4);
    const entry = totals.get(year) ?? { total: 0, count: 0 };
    entry.total += Number(p.amount);
    entry.count += 1;
    totals.set(year, entry);
  }
  return [...totals.entries()]
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => b.year.localeCompare(a.year));
}
