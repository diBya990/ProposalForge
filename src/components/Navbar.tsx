import Link from "next/link";
import Logo from "./Logo";

// The top bar shown on public pages (landing, login, sign up).
export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#05060f]/60 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Logo />

        <div className="flex items-center gap-1 text-sm">
          <Link href="/#features" className="hidden px-3 py-2 text-slate-400 hover:text-white sm:block">
            Features
          </Link>
          <Link href="/#pricing" className="hidden px-3 py-2 text-slate-400 hover:text-white sm:block">
            Pricing
          </Link>
          <Link href="/login" className="px-3 py-2 text-slate-300 hover:text-white">
            Log in
          </Link>
          <Link href="/signup" className="btn-glow ml-1 rounded-lg px-4 py-2 font-medium text-white">
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}
