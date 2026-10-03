"use client";

import { useTransition } from "react";
import { addSampleProjects } from "./actions";

// Fills an empty account with example projects (great for the demo video).
export default function SampleDataButton() {
  const [busy, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() =>
        startTransition(async () => {
          const result = await addSampleProjects();
          if (!result.ok) alert(result.message);
        })
      }
      className="btn-soft rounded-xl px-5 py-2.5 text-sm font-medium text-white"
    >
      {busy ? "Adding..." : "Add sample projects"}
    </button>
  );
}
