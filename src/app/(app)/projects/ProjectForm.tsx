"use client";

import { startTransition, useActionState, useState } from "react";
import { addProject } from "./actions";
import { LIMITS, PLATFORMS, PROJECT_STATUSES } from "@/lib/rules";
import type { FormState } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

// Form to add a past or current project. `today` comes from the server.
export default function ProjectForm({ today }: { today: string }) {
  const [state, formAction, saving] = useActionState(addProject, initialState);
  const error = (field: string) => state.errors?.[field];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // keep what you typed if there's an error
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    // A new `key` after each successful save makes React rebuild the form, which empties it
    <form key={state.savedAt ?? 0} onSubmit={handleSubmit} className="space-y-4">
      <Field label="Project title" error={error("title")}>
        <input name="title" className="field" maxLength={LIMITS.projectTitleMax} required placeholder="Landing page for a SaaS launch" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client" error={error("client_name")}>
          <input name="client_name" className="field" maxLength={LIMITS.clientNameMax} placeholder="Client or company name" />
        </Field>
        <Field label="Platform" error={error("platform")}>
          <select name="platform" className="field" defaultValue="upwork">
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value} className="bg-slate-900">
                {p.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <StatusFields today={today} error={error} />

      <Field label="Notes (optional)" error={error("description")}>
        <textarea
          name="description"
          rows={2}
          maxLength={LIMITS.projectDescriptionMax}
          className="field resize-y"
          placeholder="What you did and the result"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={saving} className="btn-glow rounded-xl px-6 py-2.5 font-semibold text-white">
          {saving ? "Saving..." : "Add project"}
        </button>
        {state.message && (
          <p className={`text-sm ${state.ok ? "text-emerald-300" : "text-red-300"}`} role="status">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

// Status, amount and dates. The "Completed / paid on" date only shows for completed projects.
function StatusFields({ today, error }: { today: string; error: (field: string) => string | undefined }) {
  const [status, setStatus] = useState("completed");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" error={error("status")}>
          <select name="status" className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value} className="bg-slate-900">
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={status === "completed" ? "Amount earned (USD)" : "Project value (USD)"} error={error("amount")}>
          <input name="amount" type="number" min={0} max={LIMITS.projectAmountMax} step="0.01" className="field" placeholder="800" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" error={error("started_on")}>
          <input name="started_on" type="date" max={today} className="field [color-scheme:dark]" />
        </Field>
        {status === "completed" && (
          <Field label="Completed / paid on" error={error("completed_on")}>
            <input name="completed_on" type="date" max={today} defaultValue={today} required className="field [color-scheme:dark]" />
          </Field>
        )}
      </div>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-slate-300">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-300">{error}</span>}
    </label>
  );
}
