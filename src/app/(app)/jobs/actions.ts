"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isMissingTableError, requireUser } from "@/lib/auth";
import { AIError, generateProposalPlan } from "@/lib/ai";
import { adviseContract, adviseFit, adviseRate, type AdvisorKind } from "@/lib/advisors";
import { earningsSummary } from "@/lib/earnings";
import { findJob, jobToPostText, matchSkills } from "@/lib/jobs";
import { LIMITS, platformLabel, profileCompleteness } from "@/lib/rules";
import type { FormState, Profile, Project, SavedJob } from "@/lib/types";

type ActionResult = { ok: boolean; message: string };

// Turns database errors into messages people understand
function friendlyError(message: string) {
  if (message.includes("FREE_LIMIT_REACHED")) {
    return "You've used your 5 free jobs this month. Upgrade to Pro for unlimited jobs and AI advice.";
  }
  if (message.includes("JOB_NOT_FOUND")) return "That job was not found.";
  return `Something went wrong: ${message}`;
}

// ---------------------------------------------------------------------
// Open a job from the feed: save it (once), then go to its job page
// ---------------------------------------------------------------------
export async function openFeedJob(formData: FormData) {
  const { supabase, user } = await requireUser();
  const externalId = String(formData.get("job_id") ?? "");

  // Opened this job before? Go straight to it
  const { data: existing, error: lookupError } = await supabase.from("jobs").select("id").eq("external_id", externalId).maybeSingle();
  if (isMissingTableError(lookupError)) redirect("/jobs?error=setup");
  if (existing) redirect(`/jobs/${existing.id}`);

  const { data: profile } = await supabase.from("profiles").select("skills").eq("id", user.id).maybeSingle();
  const job = await findJob(profile?.skills ?? [], externalId);
  if (!job) redirect("/jobs?error=gone");

  const { data: saved, error } = await supabase
    .from("jobs")
    .insert({
      external_id: job.id,
      source: job.source,
      title: job.title.slice(0, 200),
      company: job.company.slice(0, 200),
      url: job.url,
      job_type: job.type,
      salary: job.salary,
      location: job.location,
      description: jobToPostText(job).slice(0, LIMITS.jobPostMax),
      matched_skills: job.matchedSkills,
      match_percent: job.matchPercent,
    })
    .select("id")
    .single();

  if (error || !saved) {
    console.error("[openFeedJob]", error);
    redirect(isMissingTableError(error) ? "/jobs?error=setup" : "/jobs?error=open");
  }
  redirect(`/jobs/${saved.id}`);
}

// ---------------------------------------------------------------------
// Save a job post the user pasted (from Upwork, LinkedIn, anywhere)
// ---------------------------------------------------------------------
export async function savePastedJob(_previous: FormState, formData: FormData): Promise<FormState> {
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

  const { data: profile } = await supabase.from("profiles").select("skills").eq("id", user.id).maybeSingle();
  const { matchedSkills, matchPercent } = matchSkills(profile?.skills ?? [], jobPost);

  // Use the first line of the post as its title
  const firstLine = jobPost.split(/\r?\n/).find((line) => line.trim())?.trim() ?? "Pasted job";

  const { data: saved, error } = await supabase
    .from("jobs")
    .insert({
      source: "Pasted",
      title: firstLine.slice(0, 120),
      description: jobPost,
      matched_skills: matchedSkills,
      match_percent: matchPercent,
    })
    .select("id")
    .single();

  if (error || !saved) return { ok: false, message: friendlyError(error?.message ?? "could not save the job") };
  redirect(`/jobs/${saved.id}`);
}

// ---------------------------------------------------------------------
// Shared checks before any AI action on a job
// ---------------------------------------------------------------------
async function prepareAI(jobId: string) {
  const { supabase, user } = await requireUser();

  const [{ data: job }, { data: profile }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", jobId).maybeSingle<SavedJob>(),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>(),
  ]);

  if (!job) return { error: "That job was not found." } as const;

  // Rule: the AI needs the profile basics to give personal advice
  if (!profile || !profileCompleteness(profile).readyForAI) {
    return { error: "Finish the required items in your profile first (name, 3+ skills, experience summary, hourly rate)." } as const;
  }

  // Rule: the first AI action on a job uses 1 monthly credit (checked by the database)
  const { error } = await supabase.rpc("use_job_credit", { p_job_id: jobId });
  if (error) return { error: friendlyError(error.message) } as const;

  return { supabase, job, profile } as const;
}

// ---------------------------------------------------------------------
// Ask one of the 3 advisors about a job, and save the answer
// ---------------------------------------------------------------------
export async function runAdvisor(jobId: string, kind: AdvisorKind): Promise<ActionResult> {
  if (!["fit", "rate", "contract"].includes(kind)) return { ok: false, message: "Unknown advisor." };

  const ready = await prepareAI(jobId);
  if ("error" in ready) return { ok: false, message: ready.error ?? "" };
  const { supabase, job, profile } = ready;

  try {
    let advice: unknown;
    if (kind === "fit") {
      advice = await adviseFit(profile, job.description);
    } else if (kind === "contract") {
      advice = await adviseContract(profile, job.description);
    } else {
      // The rate coach also looks at the freelancer's earnings history
      const { data } = await supabase.from("projects").select("*").order("completed_on", { ascending: false, nullsFirst: false });
      const projects = (data ?? []) as Project[];
      const summary = earningsSummary(projects);
      advice = await adviseRate(
        profile,
        {
          totalEarned: summary.totalEarned,
          earnedThisMonth: summary.earnedThisMonth,
          monthlyGoal: Number(profile.monthly_goal),
          completedCount: summary.completedCount,
          averageProjectValue: summary.averageProjectValue,
          recentProjects: projects
            .filter((p) => p.status === "completed")
            .slice(0, 5)
            .map((p) => ({ title: p.title, amount: Number(p.amount), platform: platformLabel(p.platform) })),
        },
        job.description
      );
    }

    const { error } = await supabase.from("jobs").update({ [kind]: advice }).eq("id", jobId);
    if (error) return { ok: false, message: friendlyError(error.message) };
  } catch (error) {
    if (error instanceof AIError) return { ok: false, message: error.message };
    console.error("[runAdvisor]", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
  return { ok: true, message: "Done" };
}

// ---------------------------------------------------------------------
// Write the proposal for a job (the generator from Step 4)
// ---------------------------------------------------------------------
export async function writeProposal(jobId: string): Promise<ActionResult> {
  const ready = await prepareAI(jobId);
  if ("error" in ready) return { ok: false, message: ready.error ?? "" };
  const { supabase, job, profile } = ready;

  let plan;
  try {
    plan = await generateProposalPlan(profile, job.description);
  } catch (error) {
    if (error instanceof AIError) return { ok: false, message: error.message };
    console.error("[writeProposal]", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  const { data: saved, error } = await supabase
    .from("proposals")
    .insert({ job_id: jobId, job_post: job.description, status: "draft", ...plan })
    .select("id")
    .single();

  if (error || !saved) return { ok: false, message: friendlyError(error?.message ?? "could not save") };

  revalidatePath("/dashboard");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/proposals/${saved.id}`);
}
