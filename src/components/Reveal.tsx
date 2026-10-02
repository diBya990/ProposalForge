"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Fades and slides its content in when you scroll it into view.
export default function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // IntersectionObserver tells us when the element appears on screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("is-visible");
          observer.disconnect(); // only animate once
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="reveal h-full" style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
