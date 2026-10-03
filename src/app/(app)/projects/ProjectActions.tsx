"use client";

import { useTransition } from "react";
import { deleteProject, updateProjectStatus } from "./actions";
import { PROJECT_STATUSES } from "@/lib/rules";
import type { ProjectStatus } from "@/lib/types";

// The status dropdown and delete button on each project row.
export default function ProjectActions({ id, status, title }: { id: string; status: ProjectStatus; title: string }) {
  const [busy, startTransition] = useTransition();

  function changeStatus(newStatus: ProjectStatus) {
    startTransition(async () => {
      const result = await updateProjectStatus(id, newStatus);
      if (!result.ok) alert(result.message);
    });
  }

  function remove() {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    startTransition(async () => {
      const result = await deleteProject(id);
      if (!result.ok) alert(result.message);
    });
  }

  return (
    <div className={`flex items-center gap-2 ${busy ? "opacity-50" : ""}`}>
      <select
        aria-label="Project status"
        value={status}
        disabled={busy}
        onChange={(e) => changeStatus(e.target.value as ProjectStatus)}
        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 transition hover:border-violet-400/50 focus:border-indigo-400 focus:outline-none"
      >
        {PROJECT_STATUSES.map((s) => (
          <option key={s.value} value={s.value} className="bg-slate-900">
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        aria-label={`Delete ${title}`}
        className="rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-red-500/15 hover:text-red-300"
      >
        Delete
      </button>
    </div>
  );
}
