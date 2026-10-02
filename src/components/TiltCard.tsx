"use client";

import { useRef, type ReactNode } from "react";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  // How far the card can tilt, in degrees. Use 0 for "glow only, no tilt".
  maxTilt?: number;
};

// A card that tilts in 3D toward your mouse and lights up where the cursor is.
// It only updates CSS variables (--rx, --ry, --mx, --my); globals.css does the drawing.
export default function TiltCard({ children, className = "", maxTilt = 10 }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;

    // Mouse position inside the card, from 0 (left/top) to 1 (right/bottom)
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    card.style.setProperty("--rx", `${(0.5 - y) * maxTilt * 2}deg`);
    card.style.setProperty("--ry", `${(x - 0.5) * maxTilt * 2}deg`);
    card.style.setProperty("--mx", `${x * 100}%`);
    card.style.setProperty("--my", `${y * 100}%`);
  }

  function handleMouseLeave() {
    // Smoothly return to flat when the mouse leaves
    cardRef.current?.style.setProperty("--rx", "0deg");
    cardRef.current?.style.setProperty("--ry", "0deg");
  }

  return (
    <div style={{ perspective: "1000px" }} className="h-full">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`tilt-card h-full ${className}`}
      >
        {children}
        <span className="tilt-glow" />
        <span className="tilt-border" />
      </div>
    </div>
  );
}
