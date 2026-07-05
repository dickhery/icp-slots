import { cn } from "@/lib/utils";
import type { SlotSymbol } from "@/types";
import { SYMBOL_META } from "@/types";

type SymbolGlyphVariant = "reel" | "compact" | "hero";

const VARIANT_CLASSES: Record<
  SymbolGlyphVariant,
  { emoji: string; seven: string; bar: string; horseshoe: string }
> = {
  reel: {
    emoji: "text-[clamp(1.15rem,5.2vw,2.5rem)]",
    seven: "text-[clamp(1.4rem,6vw,2.85rem)]",
    bar: "text-[clamp(0.55rem,2.4vw,1rem)]",
    horseshoe: "size-[clamp(1.2rem,5.4vw,2.55rem)]",
  },
  compact: {
    emoji: "text-xs sm:text-sm",
    seven: "text-sm sm:text-base",
    bar: "text-[8px] sm:text-[9px]",
    horseshoe: "size-4 sm:size-5",
  },
  hero: {
    emoji: "text-2xl sm:text-4xl",
    seven: "text-3xl sm:text-5xl",
    bar: "text-sm sm:text-2xl",
    horseshoe: "size-8 sm:size-12",
  },
};

function accentClass(accent: (typeof SYMBOL_META)[SlotSymbol]["accent"]) {
  return accent === "accent"
    ? "text-accent"
    : accent === "success"
      ? "text-success"
      : accent === "warning"
        ? "text-warning"
        : "text-primary";
}

/** Classic slot-machine horseshoe (no widely supported horseshoe emoji exists). */
function HorseshoeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("symbol-glow shrink-0", className)}
      aria-hidden="true"
    >
      <path
        d="M8 11c0-4.5 3.6-7.5 8-7.5s8 3 8 7.5v4.5c0 4.8-3.2 8.2-8 9.8-4.8-1.6-8-5-8-9.8V11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11.5" cy="10" r="1.35" fill="currentColor" />
      <circle cx="20.5" cy="10" r="1.35" fill="currentColor" />
    </svg>
  );
}

interface SymbolGlyphProps {
  symbol: SlotSymbol;
  variant?: SymbolGlyphVariant;
  className?: string;
  moving?: boolean;
}

/** Renders a slot symbol with sizing tuned for reels, history tiles, or hero cards. */
export function SymbolGlyph({
  symbol,
  variant = "reel",
  className,
  moving = false,
}: SymbolGlyphProps) {
  const meta = SYMBOL_META[symbol];
  const sizes = VARIANT_CLASSES[variant];
  const accent = accentClass(meta.accent);
  const motion = moving ? "reel-symbol-moving" : undefined;

  if (symbol === "horseshoe") {
    return (
      <HorseshoeIcon
        className={cn(sizes.horseshoe, accent, motion, className)}
      />
    );
  }

  if (symbol === "seven") {
    return (
      <span
        className={cn(
          "symbol-glow slot-seven font-display font-black leading-none",
          sizes.seven,
          motion,
          className,
        )}
        aria-label={meta.label}
        role="img"
      >
        7
      </span>
    );
  }

  if (symbol === "bar") {
    return (
      <span
        className={cn(
          "symbol-glow font-display font-bold leading-none tracking-tight",
          sizes.bar,
          accent,
          motion,
          className,
        )}
        aria-label={meta.label}
        role="img"
      >
        BAR
      </span>
    );
  }

  return (
    <span
      className={cn(
        "symbol-glow font-display font-bold leading-none",
        sizes.emoji,
        accent,
        motion,
        className,
      )}
      aria-label={meta.label}
      role="img"
    >
      {meta.glyph}
    </span>
  );
}
