import type { CSSProperties, ReactNode } from "react";

import type { SlotSymbol } from "@/types";
import { SYMBOL_META } from "@/types";
import { SymbolGlyph } from "./SymbolGlyph";

/** Ordered list of symbols used to build continuous, device-independent strips. */
const ALL_SYMBOLS = Object.keys(SYMBOL_META) as SlotSymbol[];
const ROW_KEYS = ["top", "middle", "bottom"] as const;
const CRUISE_CYCLES = 4;
const LANDING_CYCLES = 4;

const CRUISE_STRIP = Array.from(
  { length: ALL_SYMBOLS.length * CRUISE_CYCLES },
  (_, index) => ALL_SYMBOLS[index % ALL_SYMBOLS.length],
);

export type ReelPhase = "idle" | "paying" | "spinning";

interface ReelProps {
  /** Final symbols to land on: [top, middle, bottom]. */
  targets: [SlotSymbol, SlotSymbol, SlotSymbol];
  phase: ReelPhase;
  index: number;
  durationMs?: number;
  staggerMs?: number;
  delayMs?: number;
  onStop?: (index: number) => void;
}

type ReelStyle = CSSProperties & Record<`--${string}`, string | number>;

function makeStripStyle(count: number): ReelStyle {
  return { "--reel-strip-count": count };
}

function buildLandingStrip(
  targets: [SlotSymbol, SlotSymbol, SlotSymbol],
  reelIndex: number,
): SlotSymbol[] {
  const filler = Array.from(
    { length: ALL_SYMBOLS.length * LANDING_CYCLES },
    (_, index) => ALL_SYMBOLS[(index + reelIndex * 2) % ALL_SYMBOLS.length],
  );
  return [...filler, ...targets];
}

/** A GPU-composited reel whose travel is relative to its own strip geometry. */
export function Reel({
  targets,
  phase,
  index,
  durationMs = 900,
  staggerMs = 140,
  delayMs = 75,
  onStop,
}: ReelProps) {
  const reelShellClass =
    "reel-edge reel-window-glass relative aspect-[19/60] w-full min-w-0 max-h-[15rem] overflow-hidden rounded-lg ring-1 ring-border/70 sm:max-h-[17.5rem] sm:aspect-[24/70]";
  const renderCell = (symbol: SlotSymbol, key: string, moving = false) => (
    <div key={key} className="reel-cell grid min-h-0 w-full place-items-center">
      <SymbolGlyph symbol={symbol} variant="reel" moving={moving} />
    </div>
  );

  let content: ReactNode;
  if (phase === "idle") {
    content = (
      <div className="grid h-full grid-rows-3">
        {targets.map((symbol, row) =>
          renderCell(symbol, `rest-${ROW_KEYS[row]}-${symbol}`),
        )}
      </div>
    );
  } else if (phase === "paying") {
    const count = CRUISE_STRIP.length;
    const cycle = ALL_SYMBOLS.length;
    content = (
      <div
        className="reel-strip animate-reel-cruise will-change-transform"
        style={
          {
            ...makeStripStyle(count),
            "--reel-cruise-from": `${-(cycle / count) * 100}%`,
            "--reel-cruise-to": `${-((cycle * 2) / count) * 100}%`,
            "--reel-cruise-duration": `${245 + index * 13}ms`,
          } as ReelStyle
        }
      >
        {CRUISE_STRIP.map((symbol, cell) =>
          renderCell(symbol, `cruise-${index}-${cell}`, true),
        )}
      </div>
    );
  } else {
    const strip = buildLandingStrip(targets, index);
    const stopPercent = -((strip.length - 3) / strip.length) * 100;
    content = (
      <div
        className="reel-strip animate-reel-land will-change-transform"
        onAnimationEnd={() => onStop?.(index)}
        style={
          {
            ...makeStripStyle(strip.length),
            "--reel-land-stop": `${stopPercent}%`,
            "--reel-land-duration": `${durationMs + index * staggerMs}ms`,
            "--reel-land-delay": `${index * delayMs}ms`,
          } as ReelStyle
        }
      >
        {strip.map((symbol, cell) =>
          renderCell(symbol, `land-${index}-${cell}`, true),
        )}
      </div>
    );
  }

  return (
    <div
      data-reel-col={index}
      data-reel-phase={phase}
      className={reelShellClass}
      aria-label={`Reel ${index + 1}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-10 bg-gradient-to-b from-background/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-10 bg-gradient-to-t from-background/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 z-20 h-px bg-accent/15 shadow-[0_0_8px_oklch(0.82_0.16_80/0.3)]" />
      <div className="pointer-events-none absolute inset-x-0 top-2/3 z-20 h-px bg-primary/20 shadow-[0_0_8px_oklch(0.72_0.24_15/0.3)]" />
      {content}
    </div>
  );
}
