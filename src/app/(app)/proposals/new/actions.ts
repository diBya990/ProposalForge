"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AIError, generateProposalPlan } from "@/lib/ai";
import { LIMITS, profileCompleteness, proposalUsage } from "@/lib/rules";
import type { FormState, Profile } from "@/lib/types";

// Runs when the user clicks "Generate"
export async function generateProposal(_previous: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const jobPost = String(formData.get("job_post") ?? "").trim();

  // Rule: the job post must be a sensible length
  if (jobPost.length < LIMITS.jobPostMin) {
    return {
      ok: false,
      message: "",
      errors: { job_post: `Paste the full job post (at least ${LIMITS.jobPostMin} characters) so the AI has enough detail.` },
    };
  }
  if (jobPost.length > LIMITS.jobPostMax) {
    return { ok: false, message: "", errors: { job_post: `That's too long. Keep it under ${LIMITS.jobPostMax.toLocaleString()} characters.` } };
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();

  // Rule: the profile must have the basics so the proposal sounds like you
  if (!profile || !profileCompleteness(profile).readyForAI) {
    return { ok: false, message: "Finish the required items in your profile first, so the AI knows your skills and rate." };
  }

  // Rule: Free plan = 5 proposals per month. Checked here first to avoid a wasted AI call;
  // the database checks it again when saving, so it can't be bypassed.
  if (proposalUsage(profile).reachedLimit) {
    return { ok: false, message: "You've used all 5 free proposals this month. Upgrade to Pro for unlimited proposals." };
  }

  // Ask the AI
  let plan;
  try {
    plan = await generateProposalPlan(profile, jobPost);
  } catch (error) {
    const message = error instanceof AIError ? error.message : "Something went wrong. Please try again.";
    if (!(error instanceof AIError)) console.error("[generateProposal]", error);
    return { ok: false, message };
  }

  // Save it (as a draft, until the user marks it as sent)
  const { data: saved, error } = await supabase
    .from("proposals")
    .insert({ job_post: jobPost, status: "draft", ...plan })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("FREE_LIMIT_REACHED")) {
      return { ok: false, message: "You've used all 5 free proposals this month. Upgrade to Pro for unlimited proposals." };
    }
    return { ok: false, message: `Couldn't save the proposal: ${error.message}` };
  }

  revalidatePath("/dashboard");
  redirect(`/proposals/${saved.id}`);
}
