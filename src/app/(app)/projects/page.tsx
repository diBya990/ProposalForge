import type { Metadata } from "next";
import ProjectForm from "./ProjectForm";
import ProjectActions from "./ProjectActions";
import SampleDataButton from "./SampleDataButton";
import StatCard from "@/components/StatCard";
import SetupNotice from "@/components/SetupNotice";
import { isMissingTableError, requireUser } from "@/lib/auth";
import { earningsByYear, earningsSummary } from "@/lib/earnings";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import { platformLabel } from "@/lib/rules";
import type { Project } from "@/lib/types";

export const metadata: Metadata = { title: "Work & earnings · ProposalForge" };

export default async function ProjectsPage() {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("completed_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (isMissingTableError(error)) return <SetupNotice />;

  const projects = (data ?? []) as Project[];
  const summary = earningsSummary(projects);
  const years = earningsByYear(projects);

  const completed = projects.filter((p) => p.status === "completed");
  const inProgress = projects.filter((p) => p.status === "in_progress");
  const cancelled = projects.filter((p) => p.status === "cancelled");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Work & earnings</h1>
          <p className="mt-1 text-slate-400">Your past and current projects. Completed projects count as income.</p>
        </div>
        {projects.length === 0 && <SampleDataButton />}
      </div>

      {/* Summary numbers */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total earned" value={formatMoney(summary.totalEarned)} note={`${summary.completedCount} completed projects`} />
        <StatCard label="Earned this year" value={formatMoney(summary.earnedThisYear)} />
        <StatCard label="In progress" value={formatMoney(summary.pipelineValue)} note={`${summary.inProgressCount} active projects`} />
        <StatCard label="Average project" value={formatMoney(summary.averageProjectValue)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Add a project (opened automatically when there are none yet) */}
          <details open={projects.length === 0} className="glass group rounded-2xl p-6">
            <summary className="cursor-pointer list-none font-semibold text-white">
              <span className="mr-2 inline-block transition group-open:rotate-45">＋</span>
              Add a project
            </summary>
            <div className="mt-5">
              <ProjectForm today={todayISO()} />
            </div>
          </details>

          <ProjectList title="In progress" projects={inProgress} empty="No active projects." dateLabel="Started" />
          <ProjectList
            title="Earnings history"
            projects={completed}
            empty="No completed projects yet. Add one above, or load sample projects to try things out."
            dateLabel="Paid"
          />
          {cancelled.length > 0 && <ProjectList title="Cancelled" projects={cancelled} empty="" dateLabel="Started" />}
        </div>

        {/* Earnings by year */}
        <aside className="glass h-fit rounded-2xl p-6">
          <h2 className="font-semibold text-white">Earnings by year</h2>
          {years.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Nothing yet.</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="pb-2 font-normal">Year</th>
                  <th className="pb-2 text-right font-normal">Projects</th>
                  <th className="pb-2 text-right font-normal">Earned</th>
                </tr>
              </thead>
              <tbody>
                {years.map((y) => (
                  <tr key={y.year} className="border-t border-white/5">
                    <td className="py-2 text-white">{y.year}</td>
                    <td className="py-2 text-right text-slate-300">{y.count}</td>
                    <td className="py-2 text-right font-medium text-white">{formatMoney(y.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </aside>
      </div>
    </div>
  );
}

// A titled list of projects with their amount, date and controls
function ProjectList({
  title,
  projects,
  empty,
  dateLabel,
}: {
  title: string;
  projects: Project[];
  empty: string;
  dateLabel: string;
}) {
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="font-semibold text-white">
        {title} <span className="text-sm font-normal text-slate-500">({projects.length})</span>
      </h2>

      {projects.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/5">
          {projects.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{p.title}</p>
                <p className="text-sm text-slate-400">
                  {[p.client_name, platformLabel(p.platform), `${dateLabel} ${formatDate(p.completed_on ?? p.started_on)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-semibold ${p.status === "cancelled" ? "text-slate-500 line-through" : "text-white"}`}>
                  {formatMoney(Number(p.amount))}
                </span>
                <ProjectActions id={p.id} status={p.status} title={p.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
