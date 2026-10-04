import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToEarningsButton, FollowUpControls, ProposalEditor, StatusPicker } from "./ProposalControls";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { followUpSchedule, type FollowUpState } from "@/lib/followups";
import type { Proposal } from "@/lib/types";

export const metadata: Metadata = { title: "Proposal · ProposalForge" };

// How each follow-up state looks on the timeline
const FOLLOW_UP_LOOK: Record<FollowUpState, { dot: string; label: (date: string | null) => string }> = {
  waiting: { dot: "bg-slate-500", label: () => "Dates start when you mark the proposal as Sent" },
  upcoming: { dot: "bg-indigo-400", label: (d) => `Send on ${formatDate(d)}` },
  due: { dot: "bg-amber-400", label: () => "Send today" },
  overdue: { dot: "bg-red-400", label: (d) => `Overdue: was due ${formatDate(d)}` },
  done: { dot: "bg-emerald-400", label: () => "Sent ✓" },
  stopped: { dot: "bg-slate-600", label: () => "Not needed: the client already answered" },
};

// One saved proposal: edit/copy it, set its status, and track follow-ups
export default async function ProposalPage(props: PageProps<"/proposals/[id]">) {
  const { id } = await props.params;
  const { supabase } = await requireUser();

  // Row Level Security makes sure users can only open their own proposals
  const { data: p } = await supabase.from("proposals").select("*").eq("id", id).maybeSingle<Proposal>();
  if (!p) notFound();

  const schedule = followUpSchedule({ ...p, followups_sent: p.followups_sent ?? [] });
  const priceText =
    p.price_min !== null && p.price_max !== null
      ? p.price_min === p.price_max
        ? formatMoney(Number(p.price_min))
        : `${formatMoney(Number(p.price_min))} – ${formatMoney(Number(p.price_max))}`
      : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href={p.job_id ? `/jobs/${p.job_id}` : "/proposals"} className="text-slate-400 hover:text-white">
          ← {p.job_id ? "Back to the job and AI advice" : "Back to proposals"}
        </Link>
        <Link href="/proposals" className="text-slate-400 hover:text-white">
          All proposals →
        </Link>
      </div>

      <div>
        <p className="text-sm text-slate-500">
          Created {formatDate(p.created_at)}
          {p.sent_at && ` · Sent ${formatDate(p.sent_at)}`}
        </p>
        <h1 className="text-3xl font-bold text-white">{p.job_title}</h1>
      </div>

      {/* Status */}
      <section className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">Status</h2>
            <p className="text-sm text-slate-400">
              {p.status === "draft"
                ? "Copy the proposal, send it on the job site, then mark it as Sent."
                : "Keep this updated. It powers your win rate and follow-up reminders."}
            </p>
          </div>
          <StatusPicker id={p.id} status={p.status} />
        </div>
        {p.status === "won" && (
          <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4">
            <p className="mb-3 font-semibold text-emerald-100">🎉 Congratulations on winning this job!</p>
            <AddToEarningsButton id={p.id} alreadyAdded={!!p.project_id} />
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* The proposal: copy or edit */}
        <section className="glass rounded-2xl p-6">
          <ProposalEditor id={p.id} text={p.proposal} />
        </section>

        <aside className="space-y-6">
          {/* Price estimate */}
          <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-300">💰 Suggested price</h2>
            <p className="mt-2 text-3xl font-bold text-white">{priceText}</p>
            {p.timeline && <p className="mt-1 text-emerald-100">⏱ {p.timeline}</p>}
            {p.price_reasoning && <p className="mt-4 text-sm leading-relaxed text-slate-300">{p.price_reasoning}</p>}
          </section>

          <details className="glass rounded-2xl p-6 text-sm">
            <summary className="cursor-pointer font-semibold text-slate-300 hover:text-white">Original job post</summary>
            <p className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap text-slate-400">{p.job_post}</p>
          </details>
        </aside>
      </div>

      {/* Follow-up schedule */}
      <section className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">📅 Follow-up schedule</h2>
        <p className="mt-1 text-sm text-slate-500">If the client hasn&apos;t replied, send these on the dates shown.</p>
        <ol className="mt-6 space-y-6 border-l border-white/10 pl-6">
          {schedule.map((f) => {
            const look = FOLLOW_UP_LOOK[f.state];
            return (
              <li key={f.day} className="relative">
                <span className={`absolute -left-[33px] top-0.5 h-4 w-4 rounded-full ring-4 ring-[#05060f] ${look.dot}`} aria-hidden />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">
                    Day {f.day} <span className="font-normal text-slate-400">· {look.label(f.dueDate)}</span>
                  </p>
                  <FollowUpControls
                    id={p.id}
                    day={f.day}
                    message={f.message}
                    done={f.done}
                    canMark={p.status !== "draft"}
                  />
                </div>
                <p
                  className={`mt-2 whitespace-pre-wrap rounded-xl bg-white/[0.04] p-4 text-sm leading-relaxed ${
                    f.state === "done" || f.state === "stopped" ? "text-slate-500" : "text-slate-200"
                  }`}
                >
                  {f.message}
                </p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
