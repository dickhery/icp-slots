import { useEffect, useRef, useState } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { SlotSymbol } from "@/types";
import { SYMBOL_META } from "@/types";

/** Ordered list of all symbols used to build the spinning strip. */
const ALL_SYMBOLS = Object.keys(SYMBOL_META) as SlotSymbol[];

const ROW_KEYS = ["top", "middle", "bottom"] as const;
const ROW_COUNT = 3;

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
      const viewportHeight = viewport.getBoundingClientRect().height;
      if (viewportHeight <= 0) return;
      const cellHeight = viewportHeight / ROW_COUNT;
      viewport.style.setProperty("--reel-cell-h", `${cellHeight}px`);
      setRestOffset((strip.length - 3) * cellHeight);
    };

    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [strip.length]);

  const cellClass =
    "reel-cell grid min-h-0 w-full shrink-0 place-items-center [height:var(--reel-cell-h)]";

  const reelShellClass =
    "relative aspect-[19/60] w-full min-w-0 max-h-[15rem] overflow-hidden rounded-lg reel-edge ring-1 ring-border/60 sm:max-h-[17.5rem] sm:aspect-[24/70]";

  const symbolSizeClass = "text-[clamp(1.15rem,5.2vw,2.5rem)]";
  const textSymbolSizeClass = "text-[clamp(0.6rem,2.8vw,1.15rem)]";

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
        <div className="flex h-full flex-col">
          {targets.map((sym, i) => {
            const meta = SYMBOL_META[sym];
            return (
              <div
                key={`rest-${ROW_KEYS[i]}-${sym}`}
                ref={i === 0 ? cellRef : undefined}
                className={cellClass}
              >
                <SymbolCell
                  symbol={sym}
                  meta={meta}
                  sizeClass={symbolSizeClass}
                  textSizeClass={textSymbolSizeClass}
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
                cellClass,
                isFinal && phase === "land" && "animate-win-flash",
              )}
            >
              <SymbolCell
                symbol={sym}
                meta={meta}
                sizeClass={symbolSizeClass}
                textSizeClass={textSymbolSizeClass}
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
  textSizeClass,
}: {
  symbol: SlotSymbol;
  meta: { glyph: string; label: string; accent: string };
  sizeClass: string;
  textSizeClass: string;
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
        isText ? textSizeClass : sizeClass,
        accentText,
      )}
      aria-label={meta.label}
      role="img"
    >
      {meta.glyph}
    </span>
  );
}
