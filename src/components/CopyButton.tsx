"use client";

import { useState } from "react";

// Copies text to the clipboard and shows "Copied ✓" for 2 seconds
export default function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Couldn't copy. Please select the text and copy it manually.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400/60 hover:bg-white/5"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
