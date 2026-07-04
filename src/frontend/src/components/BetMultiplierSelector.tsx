import { cn } from "@/lib/utils";
import {
  BET_MULTIPLIER_OPTIONS,
  type BetMultiplier,
  SPIN_COST_E8S,
  computeLineBet,
  formatIcp,
} from "@/types";

interface BetMultiplierSelectorProps {
  value: BetMultiplier;
  onChange: (multiplier: BetMultiplier) => void;
  disabled?: boolean;
}

/** Lets the player scale the per-line wager from 1× to 5× (0.01–0.05 ICP). */
export function BetMultiplierSelector({
  value,
  onChange,
  disabled,
}: BetMultiplierSelectorProps) {
  return (
    <div className="space-y-2" data-ocid="slot.bet_multiplier">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Bet Per Line
        </p>
        <p className="font-mono text-xs text-accent">
          {formatIcp(computeLineBet(value))} ICP / line
        </p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {BET_MULTIPLIER_OPTIONS.map((multiplier) => {
          const selected = value === multiplier;
          const lineBet = computeLineBet(multiplier);
          return (
            <button
              key={multiplier}
              type="button"
              disabled={disabled}
              onClick={() => onChange(multiplier)}
              data-ocid={`slot.bet_multiplier.${multiplier}`}
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
                {multiplier}×
              </span>
              <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                {formatIcp(lineBet)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Base line bet {formatIcp(SPIN_COST_E8S)} ICP · max{" "}
        {formatIcp(SPIN_COST_E8S * 5n)} ICP / line
      </p>
    </div>
  );
}
