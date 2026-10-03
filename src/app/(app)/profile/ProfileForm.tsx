"use client";

import { startTransition, useActionState, useState } from "react";
import { saveProfile } from "./actions";
import { LIMITS, WRITING_TONES } from "@/lib/rules";
import type { FormState, Profile } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, saving] = useActionState(saveProfile, initialState);

  // Only these two are "live" so we can show the skill tags and character count as you type
  const [skillsText, setSkillsText] = useState(profile.skills.join(", "));
  const [bio, setBio] = useState(profile.bio);

  const skillTags = skillsText.split(",").map((s) => s.trim()).filter(Boolean);
  const error = (field: string) => state.errors?.[field];

  // We submit with onSubmit (instead of <form action>) so the fields keep
  // what you typed if there's an error. React would clear them otherwise.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ----- Basics ----- */}
      <Section title="Basics" hint="How clients will see you.">
        <Field label="Full name" error={error("full_name")}>
          <input name="full_name" className="field" defaultValue={profile.full_name} maxLength={LIMITS.nameMax} required />
        </Field>
        <Field label="Professional headline" error={error("headline")} help="e.g. Full-stack developer for SaaS startups">
          <input
            name="headline"
            className="field"
            defaultValue={profile.headline}
            maxLength={LIMITS.headlineMax}
            placeholder="What you do, in one line"
          />
        </Field>
        <Field label="Location" error={error("location")}>
          <input
            name="location"
            className="field"
            defaultValue={profile.location}
            maxLength={LIMITS.locationMax}
            placeholder="Dhaka, Bangladesh"
          />
        </Field>
      </Section>

      {/* ----- Experience ----- */}
      <Section title="Experience" hint="The AI uses this to write proposals that sound like you.">
        <Field label="Years of experience" error={error("years_experience")}>
          <input
            name="years_experience"
            type="number"
            min={0}
            max={LIMITS.yearsMax}
            step={1}
            className="field"
            defaultValue={profile.years_experience}
          />
        </Field>
        <Field
          label="Experience summary"
          error={error("bio")}
          help={`${bio.length}/${LIMITS.bioMax} characters${bio.trim().length < LIMITS.bioMin ? ` · at least ${LIMITS.bioMin} needed for AI proposals` : ""}`}
        >
          <textarea
            name="bio"
            rows={6}
            className="field resize-y"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={LIMITS.bioMax}
            placeholder="Your background, notable projects and results. e.g. 4 years building web apps for startups. Shipped 20+ projects, including a booking system used by 5,000 people."
          />
        </Field>
        <Field
          label="Skills"
          error={error("skills")}
          help={`Separate with commas · ${skillTags.length}/${LIMITS.skillsMax}`}
        >
          <input
            name="skills"
            className="field"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="React, Next.js, Tailwind CSS, Figma"
          />
          {skillTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {skillTags.map((skill, index) => (
                <span key={index} className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs text-indigo-200">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </Field>
      </Section>

      {/* ----- Rates & goals ----- */}
      <Section title="Rates & goals" hint="Used for price estimates and your income goal on the dashboard.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hourly rate (USD)" error={error("hourly_rate")}>
            <input
              name="hourly_rate"
              type="number"
              min={0}
              max={LIMITS.hourlyRateMax}
              step="0.01"
              className="field"
              defaultValue={profile.hourly_rate || ""}
              placeholder="35"
            />
          </Field>
          <Field label="Monthly income goal (USD)" error={error("monthly_goal")}>
            <input
              name="monthly_goal"
              type="number"
              min={0}
              max={LIMITS.monthlyGoalMax}
              step="1"
              className="field"
              defaultValue={profile.monthly_goal || ""}
              placeholder="3000"
            />
          </Field>
        </div>
      </Section>

      {/* ----- Portfolio ----- */}
      <Section title="Portfolio" hint={`Up to ${LIMITS.portfolioMax} links. The AI picks the most relevant one for each job.`}>
        <Field label="Portfolio links (one per line)" error={error("portfolio_links")}>
          <textarea
            name="portfolio_links"
            rows={4}
            className="field resize-y"
            defaultValue={profile.portfolio_links.join("\n")}
            placeholder={"github.com/yourname\nbehance.net/yourname\nyourwebsite.com"}
          />
        </Field>
      </Section>

      {/* ----- Writing tone ----- */}
      <Section title="Writing tone" hint="How your proposals should sound.">
        <div className="grid gap-3 sm:grid-cols-2">
          {WRITING_TONES.map((tone) => (
            <label key={tone.value}>
              <input
                type="radio"
                name="writing_tone"
                value={tone.value}
                defaultChecked={profile.writing_tone === tone.value}
                className="peer sr-only"
              />
              <span className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-400/50 hover:bg-white/[0.06] peer-checked:border-indigo-400 peer-checked:bg-indigo-500/15 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400">
                <span className="font-medium text-white">{tone.label}</span>
                <span className="block text-sm text-slate-400">{tone.description}</span>
                <span className="mt-2 block text-sm italic text-slate-500">&ldquo;{tone.example}&rdquo;</span>
              </span>
            </label>
          ))}
        </div>
        {error("writing_tone") && <p className="text-sm text-red-300">{error("writing_tone")}</p>}
      </Section>

      {/* ----- Save ----- */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-[#0b0d1a]/90 p-4 backdrop-blur">
        <button type="submit" disabled={saving} className="btn-glow rounded-xl px-6 py-2.5 font-semibold text-white">
          {saving ? "Saving..." : "Save profile"}
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

// A titled box that groups related fields
function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="glass space-y-4 rounded-2xl p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-400">{hint}</p>
      </div>
      {children}
    </section>
  );
}

// A label + input + help text / error message
function Field({
  label,
  error,
  help,
  children,
}: {
  label: string;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-slate-300">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-sm text-red-300">{error}</span>
      ) : (
        help && <span className="mt-1 block text-xs text-slate-500">{help}</span>
      )}
    </label>
  );
}
