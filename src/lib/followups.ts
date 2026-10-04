// =====================================================================
// Proposal statuses and the follow-up schedule.
//
// Business rules:
// - A proposal moves Draft -> Sent -> Replied -> Won / Lost.
// - Follow-up dates count from the day you SENT the proposal (day 2, 5, 10).
// - Once the client replies (or it's won/lost), follow-ups stop.
// =====================================================================

import type { Proposal, ProposalStatus } from "./types";

export const PROPOSAL_STATUSES: { value: ProposalStatus; label: string; icon: string; style: string }[] = [
  { value: "draft", label: "Draft", icon: "📝", style: "bg-white/10 text-slate-300" },
  { value: "sent", label: "Sent", icon: "📤", style: "bg-indigo-500/15 text-indigo-200" },
  { value: "replied", label: "Replied", icon: "💬", style: "bg-cyan-500/15 text-cyan-200" },
  { value: "won", label: "Won", icon: "🏆", style: "bg-emerald-500/15 text-emerald-200" },
  { value: "lost", label: "Lost", icon: "✕", style: "bg-red-500/15 text-red-200" },
];

export function statusInfo(status: ProposalStatus) {
  return PROPOSAL_STATUSES.find((s) => s.value === status) ?? PROPOSAL_STATUSES[0];
}

export type FollowUpState = "waiting" | "upcoming" | "due" | "overdue" | "done" | "stopped";

// "2026-10-04" for a date `days` after `from`
function addDays(from: string, days: number) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Each follow-up with its due date and state, for one proposal
export function followUpSchedule(
  proposal: Pick<Proposal, "status" | "sent_at" | "follow_ups" | "followups_sent">,
  today = new Date().toISOString().slice(0, 10)
) {
  return proposal.follow_ups.map((f) => {
    const done = proposal.followups_sent.includes(f.day);
    const dueDate = proposal.sent_at ? addDays(proposal.sent_at, f.day) : null;

    let state: FollowUpState;
    if (done) state = "done";
    else if (proposal.status === "draft" || !dueDate) state = "waiting"; // not sent yet
    else if (proposal.status !== "sent") state = "stopped"; // replied, won or lost
    else if (dueDate < today) state = "overdue";
    else if (dueDate === today) state = "due";
    else state = "upcoming";

    return { ...f, dueDate, done, state };
  });
}

// Follow-ups to send soon, across all proposals (for the dashboard)
export function upcomingFollowUps(
  proposals: Pick<Proposal, "id" | "job_title" | "status" | "sent_at" | "follow_ups" | "followups_sent">[],
  today = new Date().toISOString().slice(0, 10),
  withinDays = 7
) {
  const limit = addDays(today, withinDays);
  return proposals
    .flatMap((p) =>
      followUpSchedule(p, today)
        .filter((f) => ["overdue", "due", "upcoming"].includes(f.state) && f.dueDate! <= limit)
        .map((f) => ({ proposalId: p.id, jobTitle: p.job_title, day: f.day, dueDate: f.dueDate!, state: f.state }))
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
