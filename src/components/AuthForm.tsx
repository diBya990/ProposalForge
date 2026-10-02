"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import TiltCard from "./TiltCard";

type AuthFormProps = {
  mode: "login" | "signup";
  initialError?: string;
};

// One form used by both /login and /signup.
export default function AuthForm({ mode, initialError }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";

  // Form state: what the user typed + loading/error/success messages
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [message, setMessage] = useState("");

  // After login (email or Google), Supabase sends the user to this page
  function callbackUrl() {
    return `${window.location.origin}/auth/callback?next=/dashboard`;
  }

  function checkConfigured() {
    if (!isSupabaseConfigured) {
      setError("Supabase isn't connected yet. Add your keys to .env.local and restart the app.");
      return false;
    }
    return true;
  }

  // Email + password sign up or login
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // stop the browser from reloading the page
    setError("");
    setMessage("");
    if (!checkConfigured()) return;

    setLoading(true);
    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }, // saved on the user, we'll use it in the profile
          emailRedirectTo: callbackUrl(),
        },
      });
      setLoading(false);
      if (error) return setError(error.message);

      // If email confirmation is ON in Supabase, there's no session yet
      if (!data.session) {
        return setMessage("Almost there! Check your email and click the link to confirm your account.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
    }

    // Logged in: go to the dashboard
    router.push("/dashboard");
    router.refresh();
  }

  // "Continue with Google": Supabase sends the user to Google and back
  async function handleGoogle() {
    setError("");
    if (!checkConfigured()) return;

    setLoading(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setLoading(false);
      setError(error.message);
    }
    // On success the browser leaves this page, so nothing else to do here
  }

  return (
    <TiltCard maxTilt={0} className="glass rounded-3xl p-8 shadow-2xl shadow-indigo-950/50">
      <div className="relative z-10">
        <h1 className="text-2xl font-bold text-white">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {isSignup ? "Start with 5 free proposals every month." : "Log in to keep winning jobs."}
        </p>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 font-medium text-slate-800 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10 disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* "or" divider */}
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          or with email
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <label className="block">
              <span className="mb-1.5 block text-sm text-slate-300">Full name</span>
              <input
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                required
                autoComplete="name"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-300">Email</span>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-300">Password</span>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "At least 6 characters" : "Your password"}
              minLength={6}
              required
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-glow w-full rounded-xl px-4 py-3 font-semibold text-white"
          >
            {loading ? "Please wait..." : isSignup ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isSignup ? "Already have an account? " : "New to ProposalForge? "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-medium text-indigo-300 hover:text-white"
          >
            {isSignup ? "Log in" : "Create a free account"}
          </Link>
        </p>
      </div>
    </TiltCard>
  );
}

// The colorful Google "G" logo
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
