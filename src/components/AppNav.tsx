"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Work & earnings" },
  { href: "/profile", label: "Profile" },
];

// Top bar for logged-in pages. The current page's link is highlighted.
export default function AppNav({ name, plan }: { name: string; plan: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#05060f]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-slate-400 sm:inline">{name}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              plan === "pro" ? "bg-violet-500/20 text-violet-200" : "bg-white/10 text-slate-300"
            }`}
          >
            {plan === "pro" ? "Pro" : "Free"}
          </span>
          <form action="/auth/signout" method="post">
            <button className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
              Log out
            </button>
          </form>
        </div>
      </div>

      {/* Page links (scrolls sideways on small phones) */}
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 transition ${
                active ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
