"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { FOLLOW_UP_DAYS } from "@/lib/ai";
import { PROPOSAL_STATUSES } from "@/lib/followups";
import { todayISO } from "@/lib/format";
import type { Proposal, ProposalStatus } from "@/lib/types";

type ActionResult = { ok: boolean; message: string };

const PROPOSAL_MAX = 10000;

// A missing column means supabase/schema.sql needs to be run again
function dbProblem(message: string) {
  return message.includes("does not exist")
    ? "The database needs updating: in Supabase, open SQL Editor and run the file supabase/schema.sql again."
    : message;
}

// Pages that show proposal info and need refreshing after a change
function refresh(id: string) {
  revalidatePath(`/proposals/${id}`);
  revalidatePath("/proposals");
  revalidatePath("/dashboard");
}

// ----- Save an edited proposal -----
export async function updateProposalText(id: string, text: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const proposal = text.trim();

  if (!proposal) return { ok: false, message: "The proposal can't be empty." };
  if (proposal.length > PROPOSAL_MAX) return { ok: false, message: `Keep it under ${PROPOSAL_MAX.toLocaleString()} characters.` };

  const { error } = await supabase.from("proposals").update({ proposal }).eq("id", id);
  if (error) return { ok: false, message: dbProblem(error.message) };
  refresh(id);
  return { ok: true, message: "Saved ✓" };
}

// ----- Change the status (Draft / Sent / Replied / Won / Lost) -----
export async function setProposalStatus(id: string, status: ProposalStatus): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!PROPOSAL_STATUSES.some((s) => s.value === status)) return { ok: false, message: "Unknown status." };

  const { data: current, error: readError } = await supabase.from("proposals").select("sent_at").eq("id", id).maybeSingle();
  if (readError) return { ok: false, message: dbProblem(readError.message) };
  if (!current) return { ok: false, message: "Proposal not found." };

  // Business rule: follow-up dates count from when it was sent.
  // Back to Draft clears the date; any other status keeps it (or sets it to now).
  const sentAt = status === "draft" ? null : (current.sent_at ?? new Date().toISOString());

  const { error } = await supabase.from("proposals").update({ status, sent_at: sentAt }).eq("id", id);
  if (error) return { ok: false, message: dbProblem(error.message) };
  refresh(id);
  return { ok: true, message: "Updated" };
}

// ----- Tick a follow-up as sent (or untick it) -----
export async function markFollowUp(id: string, day: number, done: boolean): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!FOLLOW_UP_DAYS.includes(day)) return { ok: false, message: "Unknown follow-up." };

  const { data: current, error: readError } = await supabase.from("proposals").select("followups_sent").eq("id", id).maybeSingle();
  if (readError) return { ok: false, message: dbProblem(readError.message) };
  if (!current) return { ok: false, message: "Proposal not found." };

  const sent = new Set<number>(current.followups_sent ?? []);
  if (done) sent.add(day);
  else sent.delete(day);

  const { error } = await supabase
    .from("proposals")
    .update({ followups_sent: [...sent].sort((a, b) => a - b) })
    .eq("id", id);
  if (error) return { ok: false, message: dbProblem(error.message) };
  refresh(id);
  return { ok: true, message: "Updated" };
}

// ----- Won the job? Add it to Work & earnings as an active project -----
export async function addWonProposalToEarnings(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();

  const { data: p } = await supabase
    .from("proposals")
    .select("id, job_id, project_id, job_title, price_min, price_max, status")
    .eq("id", id)
    .maybeSingle<Pick<Proposal, "id" | "job_id" | "project_id" | "job_title" | "price_min" | "price_max" | "status">>();

  if (!p) return { ok: false, message: "Proposal not found." };
  // Business rules: only won proposals, and only once
  if (p.status !== "won") return { ok: false, message: "Mark the proposal as Won first." };
  if (p.project_id) return { ok: false, message: "This job is already in Work & earnings." };

  // Use the client's company name if we know it
  const { data: job } = p.job_id
    ? await supabase.from("jobs").select("company").eq("id", p.job_id).maybeSingle()
    : { data: null };

  // Project value: the top of the suggested price range (you can change it later when it's paid)
  const amount = Number(p.price_max ?? p.price_min ?? 0);

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      title: p.job_title.slice(0, 120) || "Won job",
      client_name: (job?.company ?? "").slice(0, 80),
      platform: "other",
      status: "in_progress",
      amount,
      started_on: todayISO(),
      description: "Added from a won proposal",
    })
    .select("id")
    .single();
  if (error || !project) return { ok: false, message: error?.message ?? "Couldn't add the project." };

  await supabase.from("proposals").update({ project_id: project.id }).eq("id", id);

  refresh(id);
  revalidatePath("/projects");
  return { ok: true, message: "Added to Work & earnings ✓" };
}
