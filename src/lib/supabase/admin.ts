import "server-only"; // the build fails if this file is ever imported into browser code
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

// A Supabase client with FULL access (it skips Row Level Security).
// Only for trusted server code that has no logged-in user, like the payment webhook.
// The key is secret: it lives in .env.local / Vercel, never in the browser or GitHub.
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local and to Vercel.");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
