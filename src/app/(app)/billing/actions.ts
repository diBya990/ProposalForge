"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createCheckoutUrl, getCustomerPortalUrl, isBillingConfigured } from "@/lib/billing";

type ActionResult = { ok: false; message: string };

// The site's own address (localhost while testing, the Vercel link when live)
async function siteUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

// "Upgrade to Pro": create a Lemon Squeezy checkout and send the user there
export async function startCheckout(): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!isBillingConfigured) return { ok: false, message: "Payments aren't set up yet (Lemon Squeezy keys are missing)." };

  // Business rule: no second subscription for someone who is already Pro
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  if (profile?.plan === "pro") return { ok: false, message: "You're already on Pro." };

  const url = await createCheckoutUrl({ id: user.id, email: user.email }, `${await siteUrl()}/billing?success=1`);
  if (!url) return { ok: false, message: "Couldn't start the checkout. Please try again." };
  redirect(url);
}

// "Manage subscription": open Lemon Squeezy's customer portal (cancel, change card, invoices)
export async function openCustomerPortal(): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("ls_subscription_id").eq("id", user.id).maybeSingle();
  if (!profile?.ls_subscription_id) return { ok: false, message: "No subscription found." };

  const url = await getCustomerPortalUrl(profile.ls_subscription_id);
  if (!url) return { ok: false, message: "Couldn't open the billing portal. Please try again." };
  redirect(url);
}
