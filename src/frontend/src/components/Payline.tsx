import { cn } from "@/lib/utils";

interface PaylineProps {
  /** When true, the payline glows to celebrate a winning spin. */
  active: boolean;
}

/**
 * Horizontal highlight band drawn across the middle row of all five reels.
 * Rests as a subtle gold rule; pulses gold when a spin wins.
 */
export function Payline({ active }: PaylineProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-1/2 z-20 h-24 -translate-y-1/2 sm:h-28",
        "rounded-lg border-y-2 transition-smooth",
        active
          ? "border-accent shadow-gold-lg animate-pulse-glow"
          : "border-accent/30",
      )}
      aria-hidden="true"
    >
      {/* Edge tick marks for a casino feel */}
      <span className="absolute -left-1 top-1/2 size-3 -translate-y-1/2 rotate-45 bg-accent/70" />
      <span className="absolute -right-1 top-1/2 size-3 -translate-y-1/2 rotate-45 bg-accent/70" />
    </div>
  );
}
