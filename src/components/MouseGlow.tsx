"use client";

import { useEffect, useRef } from "react";

// A big, soft light that follows the mouse around the whole page.
export default function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMove(event: MouseEvent) {
      // Move the glow so its center sits under the cursor
      glowRef.current?.style.setProperty(
        "transform",
        `translate(${event.clientX - 300}px, ${event.clientY - 300}px)`
      );
    }
    window.addEventListener("mousemove", handleMove);
    // Clean up when the component is removed
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 -z-10 h-[600px] w-[600px] rounded-full transition-transform duration-300 ease-out"
      style={{
        background: "radial-gradient(circle, rgba(99,102,241,0.18), transparent 65%)",
        transform: "translate(-1000px, -1000px)",
      }}
    />
  );
}
