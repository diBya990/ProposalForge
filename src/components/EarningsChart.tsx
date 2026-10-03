import { formatMoney, formatMoneyShort } from "@/lib/format";

type Month = { key: string; label: string; total: number; projects: number };

// Bar color: checked for contrast on the dark card background
const BAR_COLOR = "#7c83f6";

// Rounds the top of the scale to a "nice" number (e.g. 1,730 -> 2,000)
function niceMax(value: number) {
  if (value <= 0) return 100;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value)!;
  return step * power;
}

// Monthly earnings bar chart. Hover (or tab to) a bar to see the exact amount.
// Built from plain divs, so there's no chart library to learn.
export default function EarningsChart({ months }: { months: Month[] }) {
  const max = niceMax(Math.max(...months.map((m) => m.total)));
  const best = months.reduce((a, b) => (b.total > a.total ? b : a), months[0]);
  const yearTotal = months.reduce((sum, m) => sum + m.total, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f1220] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-white">Earnings, last 12 months</h2>
        <p className="text-sm text-slate-400">
          Total <span className="font-semibold text-white">{formatMoney(yearTotal)}</span>
        </p>
      </div>

      {/* Chart area: y-axis labels on the left, bars on the right */}
      <div className="mt-6 flex gap-3">
        <div className="relative h-48 w-12 shrink-0 text-right text-xs text-slate-500" aria-hidden>
          <span className="absolute right-0 top-0 -translate-y-1/2">{formatMoneyShort(max)}</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2">{formatMoneyShort(max / 2)}</span>
          <span className="absolute bottom-0 right-0 translate-y-1/2">{formatMoneyShort(0)}</span>
        </div>

        <div className="relative flex-1">
          {/* Faint horizontal grid lines */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48" aria-hidden>
            <div className="absolute inset-x-0 top-0 border-t border-white/5" />
            <div className="absolute inset-x-0 top-1/2 border-t border-white/5" />
            <div className="absolute inset-x-0 bottom-0 border-t border-white/15" />
          </div>

          {/* One column per month */}
          <div className="relative flex h-48 items-end gap-[2px]">
            {months.map((m) => {
              const height = (m.total / max) * 100;
              const tooltip = `${m.label}: ${formatMoney(m.total)} from ${m.projects} project${m.projects === 1 ? "" : "s"}`;
              return (
                <div
                  key={m.key}
                  tabIndex={0}
                  aria-label={tooltip}
                  className="group relative flex h-full flex-1 items-end justify-center outline-none"
                >
                  {/* The bar itself (4px rounded top, anchored to the baseline) */}
                  {m.total > 0 && (
                    <div
                      className="w-full max-w-9 rounded-t-[4px] transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
                      style={{ height: `${height}%`, background: BAR_COLOR }}
                    />
                  )}

                  {/* Label the best month directly */}
                  {m.key === best.key && m.total > 0 && (
                    <span
                      className="absolute text-xs font-medium text-slate-200 group-hover:invisible"
                      style={{ bottom: `calc(${height}% + 4px)` }}
                    >
                      {formatMoneyShort(m.total)}
                    </span>
                  )}

                  {/* Tooltip */}
                  <div className="pointer-events-none invisible absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200 shadow-xl group-hover:visible group-focus-visible:visible">
                    <p className="font-semibold text-white">{formatMoney(m.total)}</p>
                    <p className="text-slate-400">
                      {m.label} · {m.projects} project{m.projects === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month labels */}
          <div className="mt-2 flex gap-[2px] text-center text-[11px] text-slate-500" aria-hidden>
            {months.map((m, i) => (
              <span key={m.key} className={`flex-1 ${i % 2 === 1 ? "hidden sm:block" : ""}`}>
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* The same numbers as a table (for screen readers and anyone who prefers it) */}
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-slate-400 hover:text-white">Show as table</summary>
        <table className="mt-3 w-full text-left">
          <thead className="text-slate-500">
            <tr>
              <th className="py-1 font-normal">Month</th>
              <th className="py-1 text-right font-normal">Projects</th>
              <th className="py-1 text-right font-normal">Earned</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {months.map((m) => (
              <tr key={m.key} className="border-t border-white/5">
                <td className="py-1">{m.key}</td>
                <td className="py-1 text-right">{m.projects}</td>
                <td className="py-1 text-right">{formatMoney(m.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
