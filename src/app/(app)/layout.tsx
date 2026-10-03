import Background3D from "@/components/Background3D";
import AppNav from "@/components/AppNav";
import { requireUser } from "@/lib/auth";

// Shared layout for every logged-in page (dashboard, profile, projects).
// The (app) folder groups them without changing the URL.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();

  // Show the user's name and plan in the top bar
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.full_name || user.user_metadata.full_name || user.email || "";

  return (
    <>
      <Background3D />
      <AppNav name={name} plan={profile?.plan ?? "free"} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
