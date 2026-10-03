import type { Metadata } from "next";
import ProfileForm from "./ProfileForm";
import CompletenessCard from "@/components/CompletenessCard";
import SetupNotice from "@/components/SetupNotice";
import { isMissingTableError, requireUser } from "@/lib/auth";
import { earningsByPlatform, earningsSummary } from "@/lib/earnings";
import { formatDate, formatMoney } from "@/lib/format";
import { platformLabel } from "@/lib/rules";
import type { Profile, Project } from "@/lib/types";

export const metadata: Metadata = { title: "Profile · ProposalForge" };

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();

  const [profileResult, projectsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("projects").select("*"),
  ]);

  if (isMissingTableError(profileResult.error)) return <SetupNotice />;

  // If the profile row is missing for some reason, start from empty values
  const profile: Profile = profileResult.data ?? {
    id: user.id,
    full_name: user.user_metadata.full_name ?? "",
    headline: "",
    location: "",
    bio: "",
    skills: [],
    years_experience: 0,
    hourly_rate: 0,
    monthly_goal: 0,
    portfolio_links: [],
    writing_tone: "professional",
    plan: "free",
    usage_month: "",
    usage_count: 0,
    created_at: user.created_at,
  };

  const projects = (projectsResult.data ?? []) as Project[];
  const summary = earningsSummary(projects);
  const topPlatform = earningsByPlatform(projects)[0];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Your profile</h1>
      <p className="mt-1 text-slate-400">Your career info. The AI uses it to write proposals in your voice.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <ProfileForm profile={profile} />

        <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
          <CompletenessCard profile={profileResult.data} />

          {/* Career snapshot, calculated from Work & earnings */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white">Career snapshot</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Member since" value={formatDate(profile.created_at)} />
              <Row label="Experience" value={`${profile.years_experience} year${profile.years_experience === 1 ? "" : "s"}`} />
              <Row label="Projects completed" value={String(summary.completedCount)} />
              <Row label="Total earned" value={formatMoney(summary.totalEarned)} />
              <Row label="Average project" value={formatMoney(summary.averageProjectValue)} />
              <Row label="Top platform" value={topPlatform ? platformLabel(topPlatform.platform) : "—"} />
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  );
}
