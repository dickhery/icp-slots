import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { SlotSymbol } from "@/types";
import { SYMBOL_META } from "@/types";

/** Ordered list of all symbols used to build the spinning strip. */
const ALL_SYMBOLS = Object.keys(SYMBOL_META) as SlotSymbol[];

/** Number of symbol cells rendered in the spinning strip (must exceed viewport). */
const STRIP_LENGTH = 24;

interface ReelProps {
  /** Final symbol to land on after the spin completes. */
  target: SlotSymbol;
  /** When true, the reel spins; when false, it rests on `target`. */
  spinning: boolean;
  /** Stagger index (0-based) so reels stop sequentially. */
  index: number;
  /** Base spin duration in ms before applying the per-reel stagger. */
  durationMs?: number;
}

/**
 * Build a strip that ends on `target` at the visible cell.
 * The visible (resting) cell is the last item in the strip; the strip
 * translates upward until that final cell is in view.
 */
function buildStrip(target: SlotSymbol): SlotSymbol[] {
  const strip: SlotSymbol[] = [];
  for (let i = 0; i < STRIP_LENGTH - 1; i++) {
    strip.push(ALL_SYMBOLS[i % ALL_SYMBOLS.length]);
  }
  strip.push(target);
  return strip;
}

/** A single vertical reel with a spinning animation that lands on `target`. */
export function Reel({ target, spinning, index, durationMs = 900 }: ReelProps) {
  const [strip, setStrip] = useState<SlotSymbol[]>(() => buildStrip(target));
  const [phase, setPhase] = useState<"rest" | "spin" | "land">("rest");
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spinning) {
      // Rebuild the strip with a fresh random-ish sequence ending on target.
      setStrip(buildStrip(target));
      setPhase("spin");
      const landDelay = durationMs + index * 180;
      const t = window.setTimeout(() => setPhase("land"), landDelay);
      return () => window.clearTimeout(t);
    }
    setPhase("rest");
  }, [spinning, target, index, durationMs]);

  const cellPx = 96; // h-24
  const stripHeight = strip.length * cellPx;
  // Translate so the final cell lands in the single visible row.
  const restOffset = stripHeight - cellPx;

  return (
    <div
      className="relative h-24 w-24 overflow-hidden rounded-lg reel-edge ring-1 ring-border/60 sm:h-28 sm:w-28"
      aria-label={`Reel ${index + 1}`}
    >
      {/* Top + bottom fade for depth */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-background/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-background/80 to-transparent" />

      <div
        ref={stripRef}
        className={cn(
          "flex flex-col will-change-transform",
          phase === "spin" && "animate-reel-spin",
        )}
        style={
          phase === "land" || phase === "rest"
            ? {
                transform: `translateY(-${restOffset}px)`,
                transition:
                  phase === "land"
                    ? `transform ${durationMs + index * 180}ms cubic-bezier(0.16, 1, 0.3, 1)`
                    : "none",
              }
            : undefined
        }
      >
        {strip.map((sym, i) => {
          const meta = SYMBOL_META[sym];
          const isFinal = i === strip.length - 1;
          return (
            <div
              key={sym}
              className={cn(
                "grid h-24 w-24 place-items-center sm:h-28 sm:w-28",
                isFinal && phase === "land" && "animate-win-flash",
              )}
            >
              <SymbolCell symbol={sym} meta={meta} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SymbolCell({
  symbol,
  meta,
}: {
  symbol: SlotSymbol;
  meta: { glyph: string; label: string; accent: string };
}) {
  const accentText =
    meta.accent === "accent"
      ? "text-accent"
      : meta.accent === "success"
        ? "text-success"
        : meta.accent === "warning"
          ? "text-warning"
          : "text-primary";

  // "7" and "BAR" render as bold text glyphs; emoji symbols render large.
  const isText = symbol === "seven" || symbol === "bar";

  return (
    <span
      className={cn(
        "font-display font-bold leading-none",
        isText ? "text-3xl sm:text-4xl" : "text-5xl sm:text-6xl",
        accentText,
      )}
      aria-label={meta.label}
      role="img"
    >
      {meta.glyph}
    </span>
  );
}
