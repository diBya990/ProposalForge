import CopyButton from "@/components/CopyButton";
import { formatMoney } from "@/lib/format";
import type { ContractAdvice, FitAdvice, RateAdvice } from "@/lib/advisors";

// ---------------------------------------------------------------------
// 1. Should I apply?
// ---------------------------------------------------------------------
const VERDICTS = {
  apply: { label: "Apply", icon: "✅", style: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" },
  caution: { label: "Apply with care", icon: "⚠️", style: "border-amber-400/30 bg-amber-500/10 text-amber-200" },
  skip: { label: "Skip this one", icon: "⛔", style: "border-red-400/30 bg-red-500/10 text-red-200" },
};

export function FitAnswer({ advice }: { advice: FitAdvice }) {
  const verdict = VERDICTS[advice.verdict];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-white">{advice.fit_score}%</p>
          <p className="text-xs text-slate-500">fit score</p>
        </div>
        <span className={`rounded-full border px-4 py-1.5 font-semibold ${verdict.style}`}>
          {verdict.icon} {verdict.label}
        </span>
      </div>
      <p className="text-slate-200">{advice.summary}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <List title="Why you fit" items={advice.strengths} marker="✓" markerClass="text-emerald-300" />
        <List title="What you're missing" items={advice.missing_skills} marker="•" markerClass="text-amber-300" empty="Nothing important. 👍" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300">🚩 Red flags</h3>
        {advice.red_flags.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">None found. The post looks normal.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {advice.red_flags.map((f) => (
              <li key={f.flag} className="rounded-xl border border-red-400/20 bg-red-500/5 p-3 text-sm">
                <p className="font-medium text-red-200">{f.flag}</p>
                <p className="mt-0.5 text-slate-400">{f.why}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-300">❓ Ask the client before accepting</h3>
          <CopyButton text={advice.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")} label="Copy questions" />
        </div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-200">
          {advice.questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 2. Rate & income coach
// ---------------------------------------------------------------------
export function RateAnswer({ advice }: { advice: RateAdvice }) {
  const hourly = advice.pricing_type === "hourly";
  const unit = hourly ? " / hour" : "";
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
          {hourly ? "Ask for this hourly rate" : "Quote this price"}
        </p>
        <p className="mt-1 text-4xl font-bold text-white">
          {formatMoney(advice.recommended)}
          <span className="text-lg font-normal text-emerald-100">{unit}</span>
        </p>
        <p className="mt-1 text-sm text-emerald-100">
          Fair range: {formatMoney(advice.low)} – {formatMoney(advice.high)}
          {unit}
          {advice.estimated_hours > 0 && ` · about ${advice.estimated_hours} hours${hourly ? " per week" : " of work"}`}
        </p>
      </div>
      <p className="text-slate-200">{advice.summary}</p>
      <dl className="grid gap-4 sm:grid-cols-3">
        <Info title="📊 Compared with your usual work" text={advice.comparison} />
        <Info title="🎯 Your monthly goal" text={advice.goal_impact} />
        <Info title="🤝 Negotiation tip" text={advice.negotiation_tip} />
      </dl>
    </div>
  );
}

// ---------------------------------------------------------------------
// 3. Payment & contract assistant
// ---------------------------------------------------------------------
// Milestone bar colors, in a fixed order
const MILESTONE_COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500"]; // checked for color-blind safety on dark

export function ContractAnswer({ advice }: { advice: ContractAdvice }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <List title="✅ Included" items={advice.included} marker="✓" markerClass="text-emerald-300" />
        <List title="🚫 Not included (say this upfront)" items={advice.excluded} marker="✕" markerClass="text-red-300" />
      </div>

      {advice.milestones.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300">💳 Payment milestones</h3>
          {/* One bar split by milestone size (a 2px gap between parts) */}
          <div className="mt-3 flex h-3 gap-[2px] overflow-hidden rounded-full" aria-hidden>
            {advice.milestones.map((m, i) => (
              <div key={m.name} style={{ width: `${m.percent}%`, background: MILESTONE_COLORS[i % MILESTONE_COLORS.length] }} />
            ))}
          </div>
          <ol className="mt-3 space-y-2">
            {advice.milestones.map((m, i) => (
              <li key={m.name} className="flex gap-3 text-sm">
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                  style={{ background: MILESTONE_COLORS[i % MILESTONE_COLORS.length] }}
                  aria-hidden
                />
                <span>
                  <b className="text-white">
                    {m.percent}% · {m.name}
                  </b>
                  <span className="block text-slate-400">{m.deliverable}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <List title="📄 Payment terms" items={advice.payment_terms} marker="•" markerClass="text-indigo-300" />
        <List title="🛡️ Protect yourself" items={advice.protections} marker="•" markerClass="text-cyan-300" />
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-300">✉️ Message to propose these terms</h3>
          <CopyButton text={advice.client_message} label="Copy message" />
        </div>
        <p className="mt-2 whitespace-pre-wrap rounded-xl bg-white/[0.04] p-4 text-sm leading-relaxed text-slate-200">
          {advice.client_message}
        </p>
      </div>
      <p className="text-xs text-slate-500">This is practical guidance, not legal advice.</p>
    </div>
  );
}

// ---------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------
function List({
  title,
  items,
  marker,
  markerClass,
  empty = "—",
}: {
  title: string;
  items: string[];
  marker: string;
  markerClass: string;
  empty?: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className={markerClass} aria-hidden>
                {marker}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-4">
      <dt className="text-xs font-semibold text-slate-400">{title}</dt>
      <dd className="mt-1 text-sm text-slate-200">{text}</dd>
    </div>
  );
}
