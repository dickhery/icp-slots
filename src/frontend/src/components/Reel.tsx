import { useEffect, useRef, useState } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { SlotSymbol } from "@/types";
import { SYMBOL_META } from "@/types";

/** Ordered list of all symbols used to build the spinning strip. */
const ALL_SYMBOLS = Object.keys(SYMBOL_META) as SlotSymbol[];

const ROW_KEYS = ["top", "middle", "bottom"] as const;

const DESKTOP_STRIP_LENGTH = 24;
const MOBILE_STRIP_LENGTH = 16;

interface ReelProps {
  /** Final symbols to land on: [top, middle, bottom]. */
  targets: [SlotSymbol, SlotSymbol, SlotSymbol];
  spinning: boolean;
  index: number;
  durationMs?: number;
}

function buildStrip(
  targets: [SlotSymbol, SlotSymbol, SlotSymbol],
  stripLength: number,
): SlotSymbol[] {
  const strip: SlotSymbol[] = [];
  for (let i = 0; i < stripLength - 3; i++) {
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
  const isMobile = useIsMobile();
  const stripLength = isMobile ? MOBILE_STRIP_LENGTH : DESKTOP_STRIP_LENGTH;
  const landStaggerMs = isMobile ? 140 : 180;

  const [strip, setStrip] = useState<SlotSymbol[]>(() =>
    buildStrip(targets, stripLength),
  );
  const [phase, setPhase] = useState<"rest" | "spin" | "land">("rest");
  const [restOffset, setRestOffset] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLDivElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: animate once when spinning flips true; targets are already set
  useEffect(() => {
    if (!spinning) {
      setPhase("rest");
      return;
    }

    setStrip(buildStrip(targets, stripLength));
    setPhase("spin");
    const landDelay = durationMs + index * landStaggerMs;
    const landTimer = window.setTimeout(() => setPhase("land"), landDelay);
    return () => window.clearTimeout(landTimer);
  }, [spinning, durationMs, index, landStaggerMs, stripLength]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const cell = cellRef.current;
    if (!viewport || !cell) return;

    const updateOffset = () => {
      const cellHeight = cell.getBoundingClientRect().height;
      if (cellHeight <= 0) return;
      viewport.style.setProperty("--reel-cell-h", `${cellHeight}px`);
      setRestOffset((strip.length - 3) * cellHeight);
    };

    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(cell);
    return () => observer.disconnect();
  }, [strip.length]);

  const reelShellClass =
    "relative h-[15rem] w-[4.75rem] overflow-hidden rounded-lg reel-edge ring-1 ring-border/60 sm:h-[17.5rem] sm:w-24";

  const symbolSizeClass = isMobile
    ? "text-3xl sm:text-4xl"
    : "text-4xl sm:text-5xl";

  if (!spinning) {
    return (
      <div
        ref={viewportRef}
        data-reel-col={index}
        className={reelShellClass}
        aria-label={`Reel ${index + 1}`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-background/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="flex flex-col">
          {targets.map((sym, i) => {
            const meta = SYMBOL_META[sym];
            return (
              <div
                key={`rest-${ROW_KEYS[i]}-${sym}`}
                ref={i === 0 ? cellRef : undefined}
                className="reel-cell grid h-20 w-full place-items-center sm:h-[5.833rem]"
              >
                <SymbolCell
                  symbol={sym}
                  meta={meta}
                  sizeClass={symbolSizeClass}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      data-reel-col={index}
      className={reelShellClass}
      aria-label={`Reel ${index + 1}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-background/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-background/80 to-transparent" />

      <div
        className={cn(
          "reel-strip flex flex-col will-change-transform",
          phase === "spin" &&
            (isMobile ? "animate-reel-spin-mobile" : "animate-reel-spin"),
        )}
        style={
          phase === "land"
            ? {
                transform: `translate3d(0, -${restOffset}px, 0)`,
                transition: `transform ${durationMs + index * landStaggerMs}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              }
            : undefined
        }
      >
        {strip.map((sym, i) => {
          const meta = SYMBOL_META[sym];
          const isFinal = i >= strip.length - 3;
          return (
            <div
              key={`spin-${sym}-${strip.length - i}`}
              ref={i === 0 ? cellRef : undefined}
              className={cn(
                "reel-cell grid h-20 w-full place-items-center sm:h-[5.833rem]",
                isFinal && phase === "land" && "animate-win-flash",
              )}
            >
              <SymbolCell
                symbol={sym}
                meta={meta}
                sizeClass={symbolSizeClass}
              />
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
  sizeClass,
}: {
  symbol: SlotSymbol;
  meta: { glyph: string; label: string; accent: string };
  sizeClass: string;
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
        isText ? "text-2xl sm:text-3xl" : sizeClass,
        accentText,
      )}
      aria-label={meta.label}
      role="img"
    >
      {meta.glyph}
    </span>
  );
}
