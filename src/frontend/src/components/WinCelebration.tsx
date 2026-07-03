import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { formatIcp } from "@/types";
import type { Tokens } from "@/types";

interface WinCelebrationProps {
  /** Payout in e8s; when > 0 the celebration plays. */
  payout: Tokens;
  /** Key that changes per win so the animation re-triggers. */
  trigger: number;
}

/**
 * Full-cabinet overlay shown briefly when a spin wins. Plays a coin-drop
 * animation and flashes the win amount in gold.
 */
export function WinCelebration({ payout, trigger }: WinCelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0 || payout <= 0n) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 2600);
    return () => window.clearTimeout(t);
  }, [trigger, payout]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 grid place-items-center"
      aria-live="assertive"
      data-ocid="win.celebration"
    >
      {/* Falling coins */}
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: static coin array, index is stable
          key={`coin-${i}`}
          className="absolute text-2xl animate-coin-drop"
          style={{
            left: `${10 + i * 11}%`,
            top: `${-10 + (i % 3) * 4}%`,
            animationDelay: `${i * 90}ms`,
          }}
          aria-hidden="true"
        >
          🪙
        </span>
      ))}

      <div
        className={cn(
          "rounded-2xl border-2 border-accent bg-card/90 px-8 py-6 text-center shadow-gold-lg backdrop-blur-sm",
          "animate-coin-drop",
        )}
      >
        <p className="font-display text-sm uppercase tracking-[0.3em] text-accent">
          You Win
        </p>
        <p className="mt-1 font-display text-4xl font-bold text-glow-gold sm:text-5xl">
          +{formatIcp(payout)} ICP
        </p>
      </div>
    </div>
  );
}
