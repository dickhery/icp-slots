import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SpinRecord } from "@/types";
import { SYMBOL_META, formatIcp } from "@/types";

interface SpinHistoryProps {
  /** Recent spins, newest first. */
  spins: SpinRecord[];
  /** True while the history query is loading. */
  isLoading: boolean;
}

/** Recent spin results for the signed-in player. */
export function SpinHistory({ spins, isLoading }: SpinHistoryProps) {
  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-display text-lg tracking-tight">
          Recent Spins
        </CardTitle>
        <CardDescription>Your last several spins on the vault.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && spins.length === 0 ? (
          <ul className="space-y-2" data-ocid="spinhistory.loading_state">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array, index is stable
                key={`skeleton-${i}`}
                className="h-12 animate-pulse rounded-md bg-muted/40"
              />
            ))}
          </ul>
        ) : spins.length === 0 ? (
          <div
            className="grid place-items-center py-10 text-center"
            data-ocid="spinhistory.empty_state"
          >
            <p className="text-3xl" aria-hidden="true">
              🎰
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              No spins yet
            </p>
            <p className="text-sm text-muted-foreground">
              Pull the lever to start your streak.
            </p>
          </div>
        ) : (
          <ul className="space-y-2" data-ocid="spinhistory.list">
            {spins.slice(0, 8).map((spin, i) => (
              <li
                key={spin.id.toString()}
                data-ocid={`spinhistory.item.${i + 1}`}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2.5 transition-smooth",
                  spin.won
                    ? "border-accent/40 bg-accent/10"
                    : "border-border/50 bg-background/40",
                )}
              >
                <div className="flex items-center gap-2">
                  {spin.symbols.map((sym) => (
                    <span
                      key={sym}
                      className="grid size-8 place-items-center rounded bg-background/70 text-base font-bold"
                      aria-label={SYMBOL_META[sym].label}
                    >
                      {SYMBOL_META[sym].glyph}
                    </span>
                  ))}
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-mono text-sm font-semibold",
                      spin.won ? "text-accent" : "text-muted-foreground",
                    )}
                  >
                    {spin.won
                      ? `+${formatIcp(spin.payout)} ICP`
                      : `-${formatIcp(spin.wager)} ICP`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {spin.won ? "Win" : "No win"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
