import { NextResponse, type NextRequest } from "next/server";
import { isValidSignature, planFromStatus } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/admin";

// Lemon Squeezy calls this address whenever a subscription starts, changes or ends.
// Address to put in Lemon Squeezy: https://<your-site>/api/webhooks/lemonsqueezy
export async function POST(request: NextRequest) {
  // 1. Read the raw body and check the signature (reject anything not from Lemon Squeezy)
  const rawBody = await request.text();
  if (!isValidSignature(rawBody, request.headers.get("x-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventName: string = event.meta?.event_name ?? "";
  const data = event.data;

  // We only care about subscription events (created, updated, cancelled, expired, ...)
  if (!eventName.startsWith("subscription_") || data?.type !== "subscriptions") {
    return NextResponse.json({ received: true, ignored: eventName });
  }

  const attributes = data.attributes ?? {};
  const status: string = attributes.status ?? "";
  const subscriptionId = String(data.id);
  const admin = createAdminClient();

  // 2. Find which user this is: the user_id we attached at checkout,
  //    or (for later events) the user who already has this subscription
  let userId: string | undefined = event.meta?.custom_data?.user_id;
  if (!userId) {
    const { data: profile } = await admin.from("profiles").select("id").eq("ls_subscription_id", subscriptionId).maybeSingle();
    userId = profile?.id;
  }
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    console.error("[webhook] no user for subscription", subscriptionId);
    return NextResponse.json({ received: true, warning: "No matching user" });
  }

  // 3. Save the subscription and switch the plan (business rule in planFromStatus)
  const { error } = await admin
    .from("profiles")
    .update({
      plan: planFromStatus(status),
      ls_customer_id: attributes.customer_id ? String(attributes.customer_id) : null,
      ls_subscription_id: subscriptionId,
      subscription_status: status,
      subscription_renews_at: attributes.renews_at ?? null,
      subscription_ends_at: attributes.ends_at ?? null,
    })
    .eq("id", userId);

  if (error) {
    console.error("[webhook] could not update profile", error);
    // A 500 makes Lemon Squeezy retry later
    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
  }

  console.log(`[webhook] ${eventName}: user ${userId} -> ${planFromStatus(status)} (${status})`);
  return NextResponse.json({ received: true });
}
