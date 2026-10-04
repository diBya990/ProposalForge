"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addWonProposalToEarnings, markFollowUp, setProposalStatus, updateProposalText } from "../actions";
import CopyButton from "@/components/CopyButton";
import { PROPOSAL_STATUSES } from "@/lib/followups";
import type { ProposalStatus } from "@/lib/types";

// ---------------------------------------------------------------------
// The proposal text: read, copy, or edit it
// ---------------------------------------------------------------------
export function ProposalEditor({ id, text }: { id: string; text: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [message, setMessage] = useState("");
  const [saving, startTransition] = useTransition();

  function save() {
    setMessage("");
    startTransition(async () => {
      const result = await updateProposalText(id, draft);
      setMessage(result.message);
      if (result.ok) setEditing(false);
    });
  }

  function cancel() {
    setDraft(text); // throw away the changes
    setEditing(false);
    setMessage("");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">✍️ Your proposal</h2>
        {!editing && (
          <div className="flex gap-2">
            <CopyButton text={text} label="Copy proposal" />
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-violet-400/60 hover:bg-white/5"
            >
              ✏️ Edit
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={16}
            maxLength={10000}
            aria-label="Edit your proposal"
            className="field resize-y leading-relaxed"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="btn-glow rounded-xl px-5 py-2 text-sm font-semibold text-white">
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button type="button" onClick={cancel} disabled={saving} className="btn-soft rounded-xl px-5 py-2 text-sm font-medium text-white">
              Cancel
            </button>
            <span className="text-xs text-slate-500">{draft.length.toLocaleString()}/10,000</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-100">{text}</div>
      )}

      {message && <p className="mt-3 text-sm text-emerald-300" role="status">{message}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------
// Status buttons: Draft / Sent / Replied / Won / Lost
// ---------------------------------------------------------------------
export function StatusPicker({ id, status }: { id: string; status: ProposalStatus }) {
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState("");

  function choose(newStatus: ProposalStatus) {
    if (newStatus === status) return;
    setError("");
    startTransition(async () => {
      const result = await setProposalStatus(id, newStatus);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div>
      <div className={`flex flex-wrap gap-2 ${busy ? "opacity-60" : ""}`} role="group" aria-label="Proposal status">
        {PROPOSAL_STATUSES.map((s) => {
          const active = s.value === status;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => choose(s.value)}
              disabled={busy}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                active
                  ? `${s.style} border-white/30 font-semibold`
                  : "border-white/10 text-slate-400 hover:border-violet-400/50 hover:text-white"
              }`}
            >
              <span aria-hidden>{s.icon}</span> {s.label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------
// One follow-up's controls: copy it, and tick it off when sent
// ---------------------------------------------------------------------
export function FollowUpControls({
  id,
  day,
  message,
  done,
  canMark,
}: {
  id: string;
  day: number;
  message: string;
  done: boolean;
  canMark: boolean; // only after the proposal is sent
}) {
  const [busy, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await markFollowUp(id, day, !done);
      if (!result.ok) alert(result.message);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CopyButton text={message} label="Copy" />
      {canMark && (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            done
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
              : "border-white/10 text-slate-200 hover:border-emerald-400/60 hover:bg-white/5"
          }`}
        >
          {busy ? "..." : done ? "✓ Sent" : "Mark as sent"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Won the job? Add it to Work & earnings
// ---------------------------------------------------------------------
export function AddToEarningsButton({ id, alreadyAdded }: { id: string; alreadyAdded: boolean }) {
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (alreadyAdded) {
    return (
      <p className="text-sm text-emerald-200">
        ✓ This job is in{" "}
        <Link href="/projects" className="underline hover:text-white">
          Work &amp; earnings
        </Link>
        . Mark it Completed there when you get paid.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          startTransition(async () => {
            const result = await addWonProposalToEarnings(id);
            if (!result.ok) setError(result.message);
          })
        }
        className="btn-glow rounded-xl px-5 py-2 text-sm font-semibold text-white"
      >
        {busy ? "Adding..." : "＋ Add to Work & earnings"}
      </button>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
