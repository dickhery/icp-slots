import { cn } from "@/lib/utils";
import { PAYLINE_DEFS } from "@/types";

interface PaylineProps {
  /** Number of paylines the player is betting on (1, 3, 5, or 9). */
  activeLines: number;
  /** Indices of paylines that won on the latest spin. */
  winningLines: number[];
  /** When true, winning paylines pulse gold. */
  celebrating: boolean;
}

const REEL_COUNT = 5;
const ROW_COUNT = 3;

/**
 * SVG overlay tracing active paylines across the 5×3 reel grid.
 * Winning lines glow gold during celebration.
 */
export function Payline({
  activeLines,
  winningLines,
  celebrating,
}: PaylineProps) {
  const width = 100;
  const height = 100;
  const colWidth = width / REEL_COUNT;
  const rowHeight = height / ROW_COUNT;

  const pointFor = (col: number, row: number) => ({
    x: colWidth * col + colWidth / 2,
    y: rowHeight * row + rowHeight / 2,
  });

  return (
    <svg
      className="pointer-events-none absolute inset-3 z-20 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)]"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {PAYLINE_DEFS.slice(0, activeLines).map((def, lineIdx) => {
        const won = winningLines.includes(lineIdx);
        const points = def
          .map((row, col) => {
            const p = pointFor(col, row);
            return `${p.x},${p.y}`;
          })
          .join(" ");
        return (
          <polyline
            key={def.join("-")}
            points={points}
            fill="none"
            strokeWidth={won && celebrating ? 2.8 : 1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
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
