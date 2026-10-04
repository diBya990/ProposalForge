import type { Metadata } from "next";
import Link from "next/link";
import PasteJobForm from "./PasteJobForm";

export const metadata: Metadata = { title: "Paste a job · ProposalForge" };

export default function PasteJobPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/jobs" className="text-sm text-slate-400 hover:text-white">
        ← Back to jobs for you
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-white">Paste a job post</h1>
      <p className="mt-1 text-slate-400">
        Found a job on Upwork, Fiverr or LinkedIn? Paste it here to get the 3 AI advisors and a tailored proposal.
      </p>
      <div className="mt-6">
        <PasteJobForm />
      </div>
    </div>
  );
}
