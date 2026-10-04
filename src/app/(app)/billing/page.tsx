import type { Metadata } from "next";
import Link from "next/link";
import BillingButton from "./BillingButton";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { jobUsage, PLANS } from "@/lib/rules";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Billing · ProposalForge" };

const PRO_FEATURES = [
  "Unlimited jobs with all 3 AI advisors",
  "Unlimited proposals, prices and follow-up plans",
  "Follow-up reminders on your dashboard",
  "Win-rate and earnings analytics",
];

// Words for each Lemon Squeezy subscription status
const STATUS_TEXT: Record<string, string> = {
  active: "Active",
  on_trial: "Free trial",
  past_due: "Payment failed, retrying",
  cancelled: "Cancelled (Pro until the end date)",
  expired: "Expired",
  unpaid: "Unpaid",
  paused: "Paused",
};

export default async function BillingPage(props: PageProps<"/billing">) {
  const { success } = await props.searchParams;
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<
    Profile & {
      ls_subscription_id: string | null;
      subscription_status: string | null;
      subscription_renews_at: string | null;
      subscription_ends_at: string | null;
    }
  >();

  const plan = profile?.plan ?? "free";
  const usage = jobUsage(profile ?? { plan: "free", usage_month: "", usage_count: 0 });
  const isPro = plan === "pro";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-white">Billing</h1>

      {/* Back from checkout: the webhook may take a few seconds to switch the plan */}
      {success && !isPro && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-emerald-100">
          <b>Payment received, thank you!</b> Your account switches to Pro in a few seconds.{" "}
          <Link href="/billing" className="underline hover:text-white">
            Refresh
          </Link>
        </div>
      )}
      {success && isPro && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-emerald-100">
          🎉 <b>Welcome to Pro!</b> Everything is unlimited now.
        </div>
      )}

      {/* Current plan */}
      <section className="glass rounded-2xl p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-white">Current plan: {PLANS[plan].name}</h2>
          <span className="text-slate-400">{isPro ? "$12 / month" : "$0"}</span>
        </div>

        {isPro ? (
          <dl className="mt-4 space-y-2 text-sm">
            {profile?.subscription_status && (
              <Row label="Status" value={STATUS_TEXT[profile.subscription_status] ?? profile.subscription_status} />
            )}
            {profile?.subscription_status === "cancelled" && profile.subscription_ends_at ? (
              <Row label="Pro until" value={formatDate(profile.subscription_ends_at)} />
            ) : (
              profile?.subscription_renews_at && <Row label="Renews on" value={formatDate(profile.subscription_renews_at)} />
            )}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            {usage.used} of {usage.limit} free jobs used this month.
          </p>
        )}
      </section>

      {/* Upgrade or manage */}
      {isPro ? (
        <section className="glass space-y-3 rounded-2xl p-6">
          <p className="text-sm text-slate-400">Change your card, download invoices or cancel any time.</p>
          {profile?.ls_subscription_id ? (
            <BillingButton kind="manage" />
          ) : (
            <p className="text-sm text-slate-500">Pro was given to this account manually, so there&apos;s nothing to manage.</p>
          )}
        </section>
      ) : (
        <section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 shadow-2xl shadow-violet-600/40">
          <h2 className="text-2xl font-bold text-white">ProposalForge Pro</h2>
          <p className="mt-1 text-indigo-100">One won job pays for years of Pro.</p>
          <ul className="mt-5 space-y-2 text-white">
            {PRO_FEATURES.map((f) => (
              <li key={f}>✓ {f}</li>
            ))}
          </ul>
          <div className="mt-6">
            <BillingButton kind="upgrade" />
          </div>
          <p className="mt-3 text-center text-xs text-indigo-100">
            Secure checkout by Lemon Squeezy · Cancel any time
          </p>
        </section>
      )}

      <p className="text-center text-xs text-slate-500">
        Test mode: use card 4242 4242 4242 4242, any future date and any CVC. No real money is charged.
      </p>
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
