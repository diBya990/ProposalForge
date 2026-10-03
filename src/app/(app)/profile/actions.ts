"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { LIMITS, WRITING_TONES } from "@/lib/rules";
import type { FormState } from "@/lib/types";

// Turns "React, next.js,  react" into ["React", "next.js"] (no blanks, no duplicates)
function parseSkills(text: string) {
  const seen = new Set<string>();
  const skills: string[] = [];
  for (const raw of text.split(",")) {
    const skill = raw.trim();
    if (skill && !seen.has(skill.toLowerCase())) {
      seen.add(skill.toLowerCase());
      skills.push(skill);
    }
  }
  return skills;
}

// One link per line. Adds https:// if missing and checks it's a real web address.
function parseLinks(text: string) {
  const links: string[] = [];
  const invalid: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const withProtocol = /^https?:\/\//i.test(line) ? line : `https://${line}`;
    try {
      const url = new URL(withProtocol);
      if (!url.hostname.includes(".")) throw new Error("no domain");
      links.push(url.toString());
    } catch {
      invalid.push(line);
    }
  }
  return { links, invalid };
}

// Called when the profile form is submitted
export async function saveProfile(_previous: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();

  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const number = (name: string) => Number(text(name) || 0);

  const fullName = text("full_name");
  const headline = text("headline");
  const location = text("location");
  const bio = text("bio");
  const skills = parseSkills(text("skills"));
  const yearsExperience = number("years_experience");
  const hourlyRate = number("hourly_rate");
  const monthlyGoal = number("monthly_goal");
  const { links, invalid } = parseLinks(text("portfolio_links"));
  const writingTone = text("writing_tone");

  // ----- Check every rule and collect the errors -----
  const errors: Record<string, string> = {};

  if (!fullName) errors.full_name = "Please enter your name.";
  else if (fullName.length > LIMITS.nameMax) errors.full_name = `Keep it under ${LIMITS.nameMax} characters.`;

  if (headline.length > LIMITS.headlineMax) errors.headline = `Keep it under ${LIMITS.headlineMax} characters.`;
  if (location.length > LIMITS.locationMax) errors.location = `Keep it under ${LIMITS.locationMax} characters.`;
  if (bio.length > LIMITS.bioMax) errors.bio = `Keep it under ${LIMITS.bioMax} characters.`;

  if (skills.length > LIMITS.skillsMax) errors.skills = `You can list up to ${LIMITS.skillsMax} skills.`;
  else if (skills.some((s) => s.length > LIMITS.skillMaxLength))
    errors.skills = `Each skill must be under ${LIMITS.skillMaxLength} characters.`;

  if (!Number.isInteger(yearsExperience) || yearsExperience < 0 || yearsExperience > LIMITS.yearsMax)
    errors.years_experience = `Enter a whole number from 0 to ${LIMITS.yearsMax}.`;

  if (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > LIMITS.hourlyRateMax)
    errors.hourly_rate = `Enter a rate from $0 to $${LIMITS.hourlyRateMax}.`;

  if (!Number.isFinite(monthlyGoal) || monthlyGoal < 0 || monthlyGoal > LIMITS.monthlyGoalMax)
    errors.monthly_goal = "Enter a positive amount.";

  if (invalid.length) errors.portfolio_links = `These don't look like web links: ${invalid.join(", ")}`;
  else if (links.length > LIMITS.portfolioMax) errors.portfolio_links = `You can add up to ${LIMITS.portfolioMax} links.`;

  if (!WRITING_TONES.some((t) => t.value === writingTone)) errors.writing_tone = "Pick a writing tone.";

  if (Object.keys(errors).length) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  // ----- Save (insert the row if it's missing, otherwise update it) -----
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    headline,
    location,
    bio,
    skills,
    years_experience: yearsExperience,
    hourly_rate: hourlyRate,
    monthly_goal: monthlyGoal,
    portfolio_links: links,
    writing_tone: writingTone,
  });

  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };

  // Refresh pages that show profile info
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved ✓" };
}
