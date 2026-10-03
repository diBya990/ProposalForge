import Link from "next/link";
import { profileCompleteness } from "@/lib/rules";
import type { Profile } from "@/lib/types";

// Shows how complete the profile is, with a checklist of what's missing.
export default function CompletenessCard({ profile, showLink = false }: { profile: Profile | null; showLink?: boolean }) {
  const { items, percent, readyForAI } = profileCompleteness(profile);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-white">Profile strength</h2>
        <span className="text-2xl font-bold text-white">{percent}%</span>
      </div>

      {/* Progress bar */}
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completeness"
      >
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${percent}%` }} />
      </div>

      <p className={`mt-3 text-sm ${readyForAI ? "text-emerald-300" : "text-amber-300"}`}>
        {readyForAI ? "✓ Ready for AI proposals" : "⚠ Finish the required items to unlock AI proposals"}
      </p>

      <ul className="mt-4 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.label} className={`flex items-start gap-2 ${item.done ? "text-slate-500 line-through" : "text-slate-200"}`}>
            <span aria-hidden>{item.done ? "✓" : "○"}</span>
            <span>
              {item.label}
              {item.requiredForAI && !item.done && <span className="ml-1 text-xs text-amber-300 no-underline">(required)</span>}
            </span>
          </li>
        ))}
      </ul>

      {showLink && percent < 100 && (
        <Link href="/profile" className="btn-soft mt-5 block rounded-xl px-4 py-2 text-center text-sm font-medium text-white">
          Complete my profile
        </Link>
      )}
    </div>
  );
}
