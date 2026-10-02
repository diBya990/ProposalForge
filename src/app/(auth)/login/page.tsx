import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Log in · ProposalForge" };

// If Google login fails, /auth/callback sends the user back here with ?error=...
export default async function LoginPage(props: PageProps<"/login">) {
  const { error } = await props.searchParams;
  return <AuthForm mode="login" initialError={typeof error === "string" ? error : undefined} />;
}
