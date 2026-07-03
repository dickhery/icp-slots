import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { SlotSymbol } from "@/types";
import { SYMBOL_META } from "@/types";

/** Ordered list of all symbols used to build the spinning strip. */
const ALL_SYMBOLS = Object.keys(SYMBOL_META) as SlotSymbol[];

/** Number of symbol cells rendered in the spinning strip (must exceed viewport). */
const STRIP_LENGTH = 30;

interface ReelProps {
  /** Final symbols to land on: [top, middle, bottom]. */
  targets: [SlotSymbol, SlotSymbol, SlotSymbol];
  spinning: boolean;
  index: number;
  durationMs?: number;
}

function buildStrip(
  targets: [SlotSymbol, SlotSymbol, SlotSymbol],
): SlotSymbol[] {
  const strip: SlotSymbol[] = [];
  for (let i = 0; i < STRIP_LENGTH - 3; i++) {
    strip.push(ALL_SYMBOLS[i % ALL_SYMBOLS.length]);
  }
  strip.push(...targets);
  return strip;
}

/** A single vertical reel showing three rows with a spinning animation. */
export function Reel({
  targets,
  spinning,
  index,
  durationMs = 900,
}: ReelProps) {
  const [strip, setStrip] = useState<SlotSymbol[]>(() => buildStrip(targets));
  const [phase, setPhase] = useState<"rest" | "spin" | "land">("rest");
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spinning) {
      setStrip(buildStrip(targets));
      setPhase("spin");
      const landDelay = durationMs + index * 180;
      const t = window.setTimeout(() => setPhase("land"), landDelay);
      return () => window.clearTimeout(t);
    }
    setPhase("rest");
  }, [spinning, targets, index, durationMs]);

  const cellPx = 80;
  const visibleRows = 3;
  const stripHeight = strip.length * cellPx;
  const restOffset = stripHeight - visibleRows * cellPx;

  return (
    <div
      className="relative h-[15rem] w-20 overflow-hidden rounded-lg reel-edge ring-1 ring-border/60 sm:h-[17.5rem] sm:w-24"
      aria-label={`Reel ${index + 1}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-background/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-background/80 to-transparent" />

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
          const isFinal = i >= strip.length - 3;
          return (
            <div
              key={`${sym}-${strip.length - i}`}
              className={cn(
                "grid h-20 w-20 place-items-center sm:h-[5.833rem] sm:w-24",
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

  const isText =
    symbol === "seven" || symbol === "bar" || symbol === "horseshoe";

  return (
    <span
      className={cn(
        "font-display font-bold leading-none",
        isText ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl",
        accentText,
      )}
      aria-label={meta.label}
      role="img"
    >
      {meta.glyph}
    </span>
  );
}
