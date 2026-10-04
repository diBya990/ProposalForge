// =====================================================================
// Payments with Lemon Squeezy (test mode for the hackathon).
// Lemon Squeezy works for sellers in Bangladesh (Stripe doesn't).
//
// How upgrading works:
//   1. The user clicks "Upgrade to Pro" -> we create a checkout -> they pay.
//   2. Lemon Squeezy sends our webhook a signed message about the subscription.
//   3. The webhook switches their plan to Pro (or back to Free when it ends).
// =====================================================================

import "server-only";
import crypto from "node:crypto";

const API = "https://api.lemonsqueezy.com/v1";

const config = {
  apiKey: process.env.LEMONSQUEEZY_API_KEY ?? "",
  storeId: process.env.LEMONSQUEEZY_STORE_ID ?? "",
  variantId: process.env.LEMONSQUEEZY_VARIANT_ID ?? "",
  webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "",
  // Test mode unless you deliberately set LEMONSQUEEZY_TEST_MODE=false
  testMode: process.env.LEMONSQUEEZY_TEST_MODE !== "false",
};

export const isBillingConfigured = Boolean(config.apiKey && config.storeId && config.variantId);

function headers() {
  return {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${config.apiKey}`,
  };
}

// ----- Business rule: which subscription statuses mean "Pro" -----
// active / on_trial = paying; past_due = payment is being retried (keep access meanwhile);
// cancelled = they cancelled but already paid until the end date.
// expired / unpaid / paused = back to Free.
const PRO_STATUSES = ["active", "on_trial", "past_due", "cancelled"];

export function planFromStatus(status: string): "pro" | "free" {
  return PRO_STATUSES.includes(status) ? "pro" : "free";
}

// ----- 1. Create a checkout page for this user -----
export async function createCheckoutUrl(user: { id: string; email?: string }, redirectUrl: string) {
  const response = await fetch(`${API}/checkouts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          test_mode: config.testMode,
          product_options: { redirect_url: redirectUrl },
          checkout_data: {
            email: user.email,
            // Sent back to our webhook, so we know which user paid
            custom: { user_id: user.id },
          },
        },
        relationships: {
          store: { data: { type: "stores", id: config.storeId } },
          variant: { data: { type: "variants", id: config.variantId } },
        },
      },
    }),
  });

  if (!response.ok) {
    console.error("[billing] checkout failed", response.status, await response.text());
    return null;
  }
  const json = await response.json();
  return (json.data?.attributes?.url as string) ?? null;
}

// ----- 2. Link to manage or cancel the subscription (Lemon Squeezy's customer portal) -----
export async function getCustomerPortalUrl(subscriptionId: string) {
  const response = await fetch(`${API}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: headers(),
    cache: "no-store", // the link is signed and expires, so always get a fresh one
  });
  if (!response.ok) {
    console.error("[billing] portal link failed", response.status);
    return null;
  }
  const json = await response.json();
  return (json.data?.attributes?.urls?.customer_portal as string) ?? null;
}

// ----- 3. Check a webhook really came from Lemon Squeezy -----
// They sign the raw body with our secret (HMAC SHA-256, hex) in the X-Signature header.
export function isValidSignature(rawBody: string, signature: string | null) {
  if (!config.webhookSecret || !signature) return false;
  const expected = Buffer.from(crypto.createHmac("sha256", config.webhookSecret).update(rawBody).digest("hex"), "utf8");
  const received = Buffer.from(signature, "utf8");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
