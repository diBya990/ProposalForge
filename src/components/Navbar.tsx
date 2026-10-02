import Link from "next/link";

// The top bar shown on public pages (landing, login, sign up).
export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
            P
          </span>
          ProposalForge
        </Link>

        <div className="flex items-center gap-2 text-sm">
          <Link href="/#pricing" className="hidden px-3 py-2 text-slate-600 hover:text-slate-900 sm:block">
            Pricing
          </Link>
          <Link href="/login" className="px-3 py-2 text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}
