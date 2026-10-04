import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import type { FollowUp } from "@/lib/ai";

export const metadata: Metadata = { title: "Proposal · ProposalForge" };

type ProposalRow = {
  id: string;
  job_title: string;
  job_post: string;
  proposal: string;
  price_min: number | null;
  price_max: number | null;
  timeline: string | null;
  price_reasoning: string | null;
  follow_ups: FollowUp[];
  status: string;
  created_at: string;
};

// Adds `days` to a date and returns "YYYY-MM-DD"
function addDays(date: string, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Shows one generated proposal: the text, the price card and the follow-up plan
export default async function ProposalPage(props: PageProps<"/proposals/[id]">) {
  const { id } = await props.params;
  const { supabase } = await requireUser();

  // Row Level Security makes sure users can only open their own proposals
  const { data: p } = await supabase.from("proposals").select("*").eq("id", id).maybeSingle<ProposalRow>();
  if (!p) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Created {formatDate(p.created_at)}</p>
          <h1 className="text-3xl font-bold text-white">{p.job_title}</h1>
        </div>
        <Link href="/jobs" className="btn-glow rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
          ＋ New proposal
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* The proposal */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">✍️ Your proposal</h2>
          <div className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-100">{p.proposal}</div>
        </section>

        <aside className="space-y-6">
          {/* Price estimate */}
          <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-300">💰 Suggested price</h2>
            <p className="mt-2 text-3xl font-bold text-white">
              {p.price_min !== null && p.price_max !== null
                ? p.price_min === p.price_max
                  ? formatMoney(Number(p.price_min))
                  : `${formatMoney(Number(p.price_min))} – ${formatMoney(Number(p.price_max))}`
                : "—"}
            </p>
            {p.timeline && <p className="mt-1 text-emerald-100">⏱ {p.timeline}</p>}
            {p.price_reasoning && <p className="mt-4 text-sm leading-relaxed text-slate-300">{p.price_reasoning}</p>}
          </section>

          {/* The original job post */}
          <details className="glass rounded-2xl p-6 text-sm">
            <summary className="cursor-pointer font-semibold text-slate-300 hover:text-white">Original job post</summary>
            <p className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap text-slate-400">{p.job_post}</p>
          </details>
        </aside>
      </div>

      {/* Follow-up schedule */}
      <section className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">📅 Follow-up schedule</h2>
        <p className="mt-1 text-sm text-slate-500">
          If the client hasn&apos;t replied, send these. Dates assume you send the proposal today.
        </p>
        <ol className="mt-6 space-y-6 border-l border-white/10 pl-6">
          {p.follow_ups.map((f) => (
            <li key={f.day} className="relative">
              <span className="absolute -left-[33px] top-0.5 grid h-4 w-4 place-items-center rounded-full bg-amber-400 ring-4 ring-[#05060f]" aria-hidden />
              <p className="font-semibold text-white">
                Day {f.day} <span className="font-normal text-slate-500">· {formatDate(addDays(new Date().toISOString(), f.day))}</span>
              </p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl bg-white/[0.04] p-4 text-sm leading-relaxed text-slate-200">{f.message}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
