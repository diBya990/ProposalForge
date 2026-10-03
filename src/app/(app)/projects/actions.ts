"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { LIMITS, PLATFORMS, PROJECT_STATUSES } from "@/lib/rules";
import { todayISO } from "@/lib/format";
import type { FormState, ProjectStatus } from "@/lib/types";

const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

// Pages that show project numbers and need refreshing after a change
function refresh() {
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
}

// ----- Add a project from the form -----
export async function addProject(_previous: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const text = (name: string) => String(formData.get(name) ?? "").trim();

  const title = text("title");
  const clientName = text("client_name");
  const platform = text("platform");
  const status = text("status") as ProjectStatus;
  const amount = Number(text("amount") || 0);
  const startedOn = text("started_on");
  const completedOn = text("completed_on");
  const description = text("description");

  const errors: Record<string, string> = {};

  if (!title) errors.title = "Give the project a title.";
  else if (title.length > LIMITS.projectTitleMax) errors.title = `Keep it under ${LIMITS.projectTitleMax} characters.`;
  if (clientName.length > LIMITS.clientNameMax) errors.client_name = `Keep it under ${LIMITS.clientNameMax} characters.`;
  if (!PLATFORMS.some((p) => p.value === platform)) errors.platform = "Pick a platform.";
  if (!PROJECT_STATUSES.some((s) => s.value === status)) errors.status = "Pick a status.";
  if (!Number.isFinite(amount) || amount < 0 || amount > LIMITS.projectAmountMax)
    errors.amount = "Enter an amount from $0 to $1,000,000.";
  if (startedOn && !isDate(startedOn)) errors.started_on = "Pick a valid date.";
  if (completedOn && !isDate(completedOn)) errors.completed_on = "Pick a valid date.";

  // Business rule: completed projects need the date you got paid
  if (status === "completed" && !completedOn) errors.completed_on = "Completed projects need a completion date.";
  // Business rule: can't finish before starting
  if (startedOn && completedOn && completedOn < startedOn) errors.completed_on = "Can't be before the start date.";
  // Business rule: earnings can't be in the future
  if (completedOn && completedOn > todayISO()) errors.completed_on = "Can't be in the future.";
  if (description.length > LIMITS.projectDescriptionMax) errors.description = "Keep it under 1,000 characters.";

  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  const { error } = await supabase.from("projects").insert({
    title,
    client_name: clientName,
    platform,
    status,
    amount,
    started_on: startedOn || null,
    // Only completed projects keep a completion date
    completed_on: status === "completed" ? completedOn : null,
    description,
  });

  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };
  refresh();
  return { ok: true, message: "Project added ✓", savedAt: Date.now() };
}

// ----- Change a project's status (e.g. In progress -> Completed) -----
export async function updateProjectStatus(id: string, status: ProjectStatus) {
  const { supabase } = await requireUser();
  if (!PROJECT_STATUSES.some((s) => s.value === status)) return { ok: false, message: "Unknown status." };

  // Business rule: marking as completed records today as the payment date
  // (unless it already has one). Other statuses clear it, so it stops counting as income.
  const { data: project } = await supabase.from("projects").select("completed_on").eq("id", id).single();
  const completedOn = status === "completed" ? (project?.completed_on ?? todayISO()) : null;

  const { error } = await supabase.from("projects").update({ status, completed_on: completedOn }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  refresh();
  return { ok: true, message: "Updated" };
}

// ----- Delete a project -----
export async function deleteProject(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  refresh();
  return { ok: true, message: "Deleted" };
}

// ----- Sample data for demos -----
// Fills an empty account with realistic projects across the last 12 months,
// so the dashboard and graph have something to show.
export async function addSampleProjects() {
  const { supabase } = await requireUser();

  // Business rule: only for empty accounts, so it never mixes with real data
  const { count } = await supabase.from("projects").select("id", { count: "exact", head: true });
  if (count) return { ok: false, message: "Sample data can only be added to an empty account." };

  // Date that is `monthsAgo` months back, on a given day
  const date = (monthsAgo: number, day: number) => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, day));
    const iso = d.toISOString().slice(0, 10);
    return iso > todayISO() ? todayISO() : iso; // never in the future
  };

  const samples = [
    { title: "Portfolio website redesign", client_name: "Maya Studio", platform: "upwork", amount: 450, months: 11, day: 14 },
    { title: "Landing page for SaaS launch", client_name: "Launchly", platform: "upwork", amount: 800, months: 10, day: 6 },
    { title: "Shopify store setup", client_name: "Green Leaf Co.", platform: "fiverr", amount: 350, months: 9, day: 20 },
    { title: "React dashboard for analytics", client_name: "DataNest", platform: "linkedin", amount: 1600, months: 8, day: 11 },
    { title: "Bug fixes for booking app", client_name: "YogaFlow", platform: "upwork", amount: 300, months: 7, day: 3 },
    { title: "Company website (5 pages)", client_name: "Rahman Traders", platform: "direct", amount: 1200, months: 6, day: 25 },
    { title: "API integration with Stripe", client_name: "PayPilot", platform: "upwork", amount: 950, months: 5, day: 9 },
    { title: "Mobile-friendly blog theme", client_name: "WriteWell", platform: "fiverr", amount: 280, months: 4, day: 17 },
    { title: "Next.js e-commerce MVP", client_name: "ShopSprint", platform: "direct", amount: 2400, months: 3, day: 28 },
    { title: "Admin panel improvements", client_name: "DataNest", platform: "linkedin", amount: 1100, months: 2, day: 12 },
    { title: "Landing page A/B variants", client_name: "Launchly", platform: "upwork", amount: 650, months: 1, day: 5 },
    { title: "Performance audit", client_name: "QuickCart", platform: "upwork", amount: 400, months: 0, day: 2 },
  ].map(({ months, day, ...p }) => ({
    ...p,
    status: "completed",
    started_on: date(months, Math.max(1, day - 10)),
    completed_on: date(months, day),
    description: "Sample project",
  }));

  const inProgress = [
    { title: "SaaS onboarding flow", client_name: "Launchly", platform: "upwork", amount: 1500, status: "in_progress", started_on: date(0, 1), completed_on: null, description: "Sample project" },
    { title: "Logo and brand kit", client_name: "Nori Café", platform: "fiverr", amount: 200, status: "cancelled", started_on: date(2, 1), completed_on: null, description: "Sample project" },
  ];

  const { error } = await supabase.from("projects").insert([...samples, ...inProgress]);
  if (error) return { ok: false, message: error.message };
  refresh();
  return { ok: true, message: "Sample projects added" };
}
