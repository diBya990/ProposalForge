import Link from "next/link";

// The ProposalForge logo: a glowing gradient "P" plus the name. Links home.
export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-white">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-white shadow-lg shadow-violet-500/40">
        P
      </span>
      ProposalForge
    </Link>
  );
}
