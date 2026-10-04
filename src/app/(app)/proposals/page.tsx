import type { Metadata } from "next";
import Link from "next/link";
import SetupNotice from "@/components/SetupNotice";
import { isMissingTableError, requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { followUpSchedule, PROPOSAL_STATUSES, statusInfo } from "@/lib/followups";
import { winRate } from "@/lib/rules";
import type { Proposal, ProposalStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Proposals · ProposalForge" };

// All proposals, filterable by status (?status=sent)
export default async function ProposalsPage(props: PageProps<"/proposals">) {
  const { status: statusParam } = await props.searchParams;
  const { supabase } = await requireUser();

  const { data, error } = await supabase.from("proposals").select("*").order("created_at", { ascending: false });
  if (isMissingTableError(error)) return <SetupNotice />;

  const all = ((data ?? []) as Proposal[]).map((p) => ({ ...p, followups_sent: p.followups_sent ?? [] }));
  const filter = PROPOSAL_STATUSES.some((s) => s.value === statusParam) ? (statusParam as ProposalStatus) : null;
  const shown = filter ? all.filter((p) => p.status === filter) : all;
  const wins = winRate(all);

  const countOf = (status: ProposalStatus) => all.filter((p) => p.status === status).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Your proposals</h1>
          <p className="mt-1 text-slate-400">
            {wins.sent === 0
              ? "Mark proposals as Sent to start tracking your win rate."
              : `Win rate ${wins.percent}% · ${wins.won} won of ${wins.sent} sent`}
          </p>
        </div>
        <Link href="/jobs" className="btn-glow rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
          ✨ New proposal
        </Link>
      </div>

      {/* Status filter */}
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter by status">
        <FilterLink href="/proposals" active={!filter} label={`All (${all.length})`} />
        {PROPOSAL_STATUSES.map((s) => (
          <FilterLink
            key={s.value}
            href={`/proposals?status=${s.value}`}
            active={filter === s.value}
            label={`${s.icon} ${s.label} (${countOf(s.value)})`}
          />
        ))}
      </nav>

      {shown.length === 0 ? (
        <div className="glass mt-6 rounded-2xl p-8 text-center text-slate-400">
          {all.length === 0 ? (
            <>
              <p>No proposals yet.</p>
              <Link href="/jobs" className="btn-glow mt-4 inline-block rounded-xl px-5 py-2 text-sm font-semibold text-white">
                Find a job and write your first one
              </Link>
            </>
          ) : (
            <p>No proposals with this status.</p>
          )}
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((p) => {
            const status = statusInfo(p.status);
            const next = followUpSchedule(p).find((f) => ["overdue", "due", "upcoming"].includes(f.state));
            return (
              <li key={p.id}>
                <Link
                  href={`/proposals/${p.id}`}
                  className="glass block rounded-2xl p-5 transition hover:border-violet-400/40 hover:bg-white/[0.06]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{p.job_title}</p>
                      <p className="mt-0.5 text-sm text-slate-400">
                        Created {formatDate(p.created_at)}
                        {p.sent_at && ` · Sent ${formatDate(p.sent_at)}`}
                        {p.price_max !== null && ` · ${formatMoney(Number(p.price_min))} – ${formatMoney(Number(p.price_max))}`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${status.style}`}>
                      <span aria-hidden>{status.icon}</span> {status.label}
                    </span>
                  </div>
                  {next && (
                    <p className={`mt-3 text-sm ${next.state === "upcoming" ? "text-slate-400" : "text-amber-300"}`}>
                      📅 Day {next.day} follow-up:{" "}
                      {next.state === "overdue" ? `overdue since ${formatDate(next.dueDate)}` : next.state === "due" ? "send today" : formatDate(next.dueDate)}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        active ? "border-white/30 bg-white/10 font-medium text-white" : "border-white/10 text-slate-400 hover:border-violet-400/50 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
