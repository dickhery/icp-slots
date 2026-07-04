import { cn } from "@/lib/utils";
import {
  LINE_OPTIONS,
  type LineCount,
  SPIN_COST_E8S,
  computeWager,
  formatIcp,
} from "@/types";

interface LineSelectorProps {
  value: LineCount;
  onChange: (lines: LineCount) => void;
  disabled?: boolean;
}

/** Lets the player choose how many paylines to bet on (1, 3, 5, or 9). */
export function LineSelector({ value, onChange, disabled }: LineSelectorProps) {
  return (
    <div className="space-y-2" data-ocid="slot.line_selector">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Active Paylines
          {value > 1 ? (
            <span className="normal-case tracking-normal text-muted-foreground/80">
              {" "}
              · lines cycle on reels
            </span>
          ) : null}
        </p>
        <p className="font-mono text-xs text-accent">
          {formatIcp(SPIN_COST_E8S)} ICP / line
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {LINE_OPTIONS.map((lines) => {
          const selected = value === lines;
          const wager = computeWager(lines);
          return (
            <button
              key={lines}
              type="button"
              disabled={disabled}
              onClick={() => onChange(lines)}
              data-ocid={`slot.line_option.${lines}`}
              className={cn(
                "rounded-lg border px-2 py-2.5 text-center transition-smooth",
                "disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? "border-accent bg-accent/15 shadow-gold"
                  : "border-border/60 bg-background/50 hover:border-accent/40 hover:bg-accent/5",
              )}
            >
              <span
                className={cn(
                  "block font-display text-lg font-bold",
                  selected ? "text-accent" : "text-foreground",
                )}
              >
                {lines}
              </span>
              <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                {formatIcp(wager)} ICP
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
