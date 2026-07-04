import { type RefObject, useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { PAYLINE_DEFS } from "@/types";

interface PaylineProps {
  /** Reel grid wrapper used to measure symbol cell centers. */
  containerRef: RefObject<HTMLElement | null>;
  /** Re-measure when reel DOM or line count changes. */
  spinPhase: string;
  /** Number of paylines the player is betting on (1, 3, 5, or 9). */
  activeLines: number;
  /** Indices of paylines that won on the latest spin. */
  winningLines: number[];
  /** When true, winning paylines pulse gold. */
  celebrating: boolean;
}

const REEL_COUNT = 5;
const ROW_COUNT = 3;

type Point = { x: number; y: number };

type PaylineLayout = {
  width: number;
  height: number;
  anchors: Point[][];
};

function measureLayout(container: HTMLElement): PaylineLayout | null {
  const containerRect = container.getBoundingClientRect();
  if (containerRect.width <= 0 || containerRect.height <= 0) {
    return null;
  }

  const anchors: Point[][] = [];
  for (let col = 0; col < REEL_COUNT; col++) {
    const reel = container.querySelector<HTMLElement>(
      `[data-reel-col="${col}"]`,
    );
    if (!reel) return null;

    const reelRect = reel.getBoundingClientRect();
    const colPoints: Point[] = [];
    for (let row = 0; row < ROW_COUNT; row++) {
      colPoints.push({
        x: reelRect.left - containerRect.left + reelRect.width / 2,
        y:
          reelRect.top -
          containerRect.top +
          ((row + 0.5) / ROW_COUNT) * reelRect.height,
      });
    }
    anchors.push(colPoints);
  }

  return {
    width: containerRect.width,
    height: containerRect.height,
    anchors,
  };
}

/**
 * SVG overlay tracing active paylines across the 5×3 reel grid.
 * Anchors are measured from live reel viewports so lines stay aligned on resize.
 */
export function Payline({
  containerRef,
  spinPhase,
  activeLines,
  winningLines,
  celebrating,
}: PaylineProps) {
  const [layout, setLayout] = useState<PaylineLayout | null>(null);

  const updateLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const next = measureLayout(container);
    if (next) setLayout(next);
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateLayout();

    const observer = new ResizeObserver(() => {
      updateLayout();
    });
    observer.observe(container);

    const reels = container.querySelectorAll("[data-reel-col]");
    for (const reel of reels) {
      observer.observe(reel);
    }

    window.addEventListener("resize", updateLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, [containerRef, updateLayout]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure after reel DOM swaps on spin
  useEffect(() => {
    const frame = window.requestAnimationFrame(updateLayout);
    return () => window.cancelAnimationFrame(frame);
  }, [spinPhase, activeLines, updateLayout]);

  if (!layout) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      aria-hidden="true"
    >
      {PAYLINE_DEFS.slice(0, activeLines).map((def, lineIdx) => {
        const won = winningLines.includes(lineIdx);
        const points = def
          .map((row, col) => {
            const anchor = layout.anchors[col]?.[row];
            if (!anchor) return null;
            return `${anchor.x},${anchor.y}`;
          })
          .filter((value): value is string => value !== null)
          .join(" ");

        if (!points) return null;

        return (
          <polyline
            key={def.join("-")}
            points={points}
            fill="none"
            strokeWidth={won && celebrating ? 2.8 : 1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={cn(
              "transition-smooth",
              won && celebrating
                ? "stroke-accent drop-shadow-[0_0_6px_oklch(0.82_0.16_80)]"
                : won
                  ? "stroke-accent/70"
                  : "stroke-accent/25",
            )}
          />
        );
      })}
    </svg>
  );
}
