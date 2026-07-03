import { useEffect, useState } from "react";

import { getWinTier } from "@/hooks/use-game-audio";
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

  const tier = getWinTier(payout);
  const coinCount = tier === "big" ? 18 : tier === "medium" ? 12 : 8;
  const title =
    tier === "big"
      ? "Vault Jackpot"
      : tier === "medium"
        ? "Major Win"
        : "Nice Win";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-30 grid place-items-center",
        tier === "big" && "bg-accent/5 backdrop-blur-[1px]",
      )}
      aria-live="assertive"
      data-ocid="win.celebration"
    >
      {/* Falling coins */}
      {Array.from({ length: coinCount }).map((_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: static coin array, index is stable
          key={`coin-${i}`}
          className="absolute text-2xl animate-coin-drop"
          style={{
            left: `${5 + (i * 89) / Math.max(coinCount - 1, 1)}%`,
            top: `${-10 + (i % 3) * 4}%`,
            animationDelay: `${(i % 9) * 75}ms`,
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
          tier === "medium" && "ring-4 ring-accent/15",
          tier === "big" && "animate-jackpot-burst ring-8 ring-accent/20",
        )}
      >
        <p className="font-display text-sm uppercase tracking-[0.3em] text-accent">
          {title}
        </p>
        <p className="mt-1 font-display text-4xl font-bold text-glow-gold sm:text-5xl">
          +{formatIcp(payout)} ICP
        </p>
      </div>
    </div>
  );
}
