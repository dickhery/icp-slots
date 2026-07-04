import { type RefObject, useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { PAYLINE_COLORS, PAYLINE_DEFS, PAYLINE_LABELS } from "@/types";

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
const PREVIEW_INTERVAL_MS = 1800;

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
 * Cycles through lines when idle so each path is easy to distinguish.
 */
export function Payline({
  containerRef,
  spinPhase,
  activeLines,
  winningLines,
  celebrating,
}: PaylineProps) {
  const [layout, setLayout] = useState<PaylineLayout | null>(null);
  const [previewLine, setPreviewLine] = useState(0);

  const idle = spinPhase === "idle";
  const previewEnabled = idle && !celebrating && activeLines > 1;

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

  useEffect(() => {
    if (!previewEnabled) return;
    setPreviewLine(0);
    const timer = window.setInterval(() => {
      setPreviewLine((line) => (line + 1) % activeLines);
    }, PREVIEW_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [previewEnabled, activeLines]);

  if (!layout) return null;

  const labelAnchor = previewEnabled
    ? layout.anchors[0]?.[PAYLINE_DEFS[previewLine]?.[0] ?? 1]
    : null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      aria-hidden={!previewEnabled && !celebrating}
      role="img"
      aria-label="Active slot paylines"
    >
      <title>Active slot paylines</title>
      {previewEnabled && labelAnchor ? (
        <g>
          <rect
            x={labelAnchor.x - 42}
            y={labelAnchor.y - 28}
            width={84}
            height={18}
            rx={9}
            className="fill-background/85 stroke-border/60"
            strokeWidth={1}
          />
          <text
            x={labelAnchor.x}
            y={labelAnchor.y - 16}
            textAnchor="middle"
            className="fill-foreground font-display text-[9px] font-semibold uppercase tracking-wide"
          >
            {PAYLINE_LABELS[previewLine]}
          </text>
        </g>
      ) : null}

      {PAYLINE_DEFS.slice(0, activeLines).map((def, lineIdx) => {
        const won = winningLines.includes(lineIdx);
        const highlighted = previewEnabled && lineIdx === previewLine;
        const color = PAYLINE_COLORS[lineIdx] ?? PAYLINE_COLORS[0];

        const points = def
          .map((row, col) => {
            const anchor = layout.anchors[col]?.[row];
            if (!anchor) return null;
            return `${anchor.x},${anchor.y}`;
          })
          .filter((value): value is string => value !== null)
          .join(" ");

        if (!points) return null;

        const firstAnchor = layout.anchors[0]?.[def[0]];
        const strokeWidth =
          won && celebrating ? 3.2 : highlighted ? 2.8 : won ? 2.4 : 1.4;
        const opacity =
          won && celebrating
            ? 1
            : won
              ? 0.9
              : highlighted
                ? 1
                : previewEnabled
                  ? 0.14
                  : idle
                    ? 0.45
                    : 0.2;

        return (
          <g key={def.join("-")}>
            <polyline
              points={points}
              fill="none"
              stroke={won && celebrating ? "oklch(0.82 0.16 80)" : color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={opacity}
              vectorEffect="non-scaling-stroke"
              className={cn(
                "transition-smooth",
                won && celebrating && "animate-payline-win",
                highlighted && "animate-payline-preview",
              )}
            />
            {(highlighted || (won && celebrating)) && firstAnchor ? (
              <>
                <circle
                  cx={firstAnchor.x}
                  cy={firstAnchor.y}
                  r={highlighted ? 9 : 8}
                  fill={won && celebrating ? "oklch(0.82 0.16 80)" : color}
                  fillOpacity={0.95}
                  className={
                    won && celebrating ? "animate-payline-win" : undefined
                  }
                />
                <text
                  x={firstAnchor.x}
                  y={firstAnchor.y + 3.5}
                  textAnchor="middle"
                  className="fill-background font-display text-[9px] font-bold"
                >
                  {lineIdx + 1}
                </text>
              </>
            ) : null}
            {won && celebrating
              ? def.map((row, col) => {
                  const anchor = layout.anchors[col]?.[row];
                  if (!anchor) return null;
                  return (
                    <circle
                      key={`win-${def.join("-")}-${row}-${col}`}
                      cx={anchor.x}
                      cy={anchor.y}
                      r={5}
                      fill="oklch(0.82 0.16 80)"
                      className="animate-payline-win"
                    />
                  );
                })
              : null}
          </g>
        );
      })}
    </svg>
  );
}
