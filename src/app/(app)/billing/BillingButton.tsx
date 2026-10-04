"use client";

import { useState, useTransition } from "react";
import { openCustomerPortal, startCheckout } from "./actions";

// "Upgrade to Pro" or "Manage subscription". On success the action leaves this site.
export default function BillingButton({ kind }: { kind: "upgrade" | "manage" }) {
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState("");

  function go() {
    setError("");
    startTransition(async () => {
      const result = kind === "upgrade" ? await startCheckout() : await openCustomerPortal();
      // Only reached if something went wrong
      if (result && !result.ok) setError(result.message);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={`${kind === "upgrade" ? "btn-glow" : "btn-soft"} w-full rounded-xl px-6 py-3 font-semibold text-white`}
      >
        {busy ? "Opening..." : kind === "upgrade" ? "Upgrade to Pro for $12/month" : "Manage subscription"}
      </button>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
