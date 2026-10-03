// The shapes of our database rows (see supabase/schema.sql).

export type Plan = "free" | "pro";
export type WritingTone = "professional" | "friendly" | "confident" | "concise";
export type Platform = "upwork" | "fiverr" | "linkedin" | "direct" | "other";
export type ProjectStatus = "in_progress" | "completed" | "cancelled";
export type ProposalStatus = "draft" | "sent" | "replied" | "won" | "lost";

export type Profile = {
  id: string;
  full_name: string;
  headline: string;
  location: string;
  bio: string;
  skills: string[];
  years_experience: number;
  hourly_rate: number;
  monthly_goal: number;
  portfolio_links: string[];
  writing_tone: WritingTone;
  plan: Plan;
  usage_month: string; // "2026-10-01"
  usage_count: number;
  created_at: string;
};

export type Project = {
  id: string;
  title: string;
  client_name: string;
  platform: Platform;
  status: ProjectStatus;
  amount: number;
  started_on: string | null; // "2026-10-03"
  completed_on: string | null;
  description: string;
  created_at: string;
};

export type ProposalSummary = {
  id: string;
  status: ProposalStatus;
  created_at: string;
};

// What a server action sends back to a form
export type FormState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>; // field name -> error text
  savedAt?: number; // set on success, lets a form know it can clear itself
};
