import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Background3D from "@/components/Background3D";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Dashboard · ProposalForge" };

// Temporary dashboard. It proves login works; we'll fill it with real stats in Step 7.
export default async function DashboardPage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in? Back to the login page.
  if (!user) redirect("/login");

  const name = user.user_metadata.full_name ?? user.email;

  return (
    <>
      <Background3D />
      <header className="border-b border-white/5 bg-[#05060f]/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <form action="/auth/signout" method="post">
            <button className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold text-white">
          Hi, <span className="gradient-text">{name}</span> 👋
        </h1>
        <p className="mt-2 text-slate-400">You&apos;re logged in. Your dashboard is coming soon.</p>
      </main>
    </>
  );
}
