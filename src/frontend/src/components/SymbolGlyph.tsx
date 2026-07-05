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
    horseshoe: "size-[clamp(1.35rem,6vw,2.85rem)]",
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

/**
 * Classic slot-machine horseshoe with a solid cast-metal silhouette and nail holes.
 * SVG keeps the symbol recognizable at every reel size and across platforms.
 */
function HorseshoeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("horseshoe-icon symbol-glow shrink-0", className)}
      aria-label="Horseshoe"
      role="img"
      focusable="false"
    >
      <path
        className="horseshoe-body"
        d="M7 5 17 7v12c0 7.7 3 12.5 7 14.5 4-2 7-6.8 7-14.5V7l10-2v14c0 13.5-7.5 22-17 24C14.5 41 7 32.5 7 19Z"
      />
      <path
        className="horseshoe-highlight"
        d="M12 8v11c0 10.4 5.3 17.1 12 19.2C30.7 36.1 36 29.4 36 19V8"
      />
      <circle className="horseshoe-nail" cx="12" cy="13" r="1.75" />
      <circle className="horseshoe-nail" cx="12.5" cy="22" r="1.75" />
      <circle className="horseshoe-nail" cx="36" cy="13" r="1.75" />
      <circle className="horseshoe-nail" cx="35.5" cy="22" r="1.75" />
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
