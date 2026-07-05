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
 * Classic slot-machine horseshoe: open U with inward-curving tips and nail holes.
 * SVG is used because no horseshoe emoji renders consistently across devices.
 */
function HorseshoeIcon({ className }: { className?: string }) {
  const armStroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 3.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("horseshoe-icon symbol-glow shrink-0", className)}
      aria-hidden="true"
    >
      <path
        className="horseshoe-body"
        d="M9.2 26.4
           C8.4 14.8, 10.2 6.8, 13.4 4.4
           C14.5 3.6, 15.2 5.1, 14.4 6.8
           C13.8 8.1, 12.6 8.8, 11.4 8.4"
        {...armStroke}
      />
      <path
        className="horseshoe-body"
        d="M22.8 26.4
           C23.6 14.8, 21.8 6.8, 18.6 4.4
           C17.5 3.6, 16.8 5.1, 17.6 6.8
           C18.2 8.1, 19.4 8.8, 20.6 8.4"
        {...armStroke}
      />
      <circle
        cx="11.1"
        cy="5.8"
        r="1.35"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle
        cx="20.9"
        cy="5.8"
        r="1.35"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
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
