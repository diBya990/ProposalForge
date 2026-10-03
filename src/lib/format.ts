// Small helpers to display money and dates nicely.

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const moneyShort = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

// 1234.5 -> "$1,235"
export function formatMoney(value: number) {
  return money.format(value);
}

// 12500 -> "$12.5K" (for chart axes)
export function formatMoneyShort(value: number) {
  return moneyShort.format(value);
}

// "2026-10-03" -> "Oct 3, 2026"
export function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Today as "2026-10-03" (used as the default date in forms)
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
