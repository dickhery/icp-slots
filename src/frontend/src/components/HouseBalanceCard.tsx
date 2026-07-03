import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useHouseBalance } from "@/hooks/use-backend";
import { formatIcp } from "@/types";
import { Coins, RefreshCw, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

/**
 * Admin-only card showing the current house canister ICP balance.
 * Prominent gold-accented display with manual refresh.
 */
export function HouseBalanceCard() {
  const { data, isLoading, isError, isRefetching, refetch } = useHouseBalance();
  const balance = data ?? 0n;
  const formatted = data ? formatIcp(data) : "0.0000";

  return (
    <Card
      className="relative overflow-hidden border-accent/30 bg-card/80 backdrop-blur-sm"
      data-ocid="admin.house_balance.card"
    >
      {/* Gold glow accent */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-accent/15 ring-1 ring-accent/40 text-accent">
              <Coins className="size-5" aria-hidden="true" />
            </span>
            <div className="space-y-0.5">
              <CardTitle className="font-display text-base font-600 tracking-tight">
                House Balance
              </CardTitle>
              <CardDescription className="text-xs">
                Playable house pool (fund via deposit card, then sync)
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            data-ocid="admin.house_balance.refresh_button"
            aria-label="Refresh house balance"
            className="text-muted-foreground hover:text-accent"
          >
            <RefreshCw
              className={isRefetching ? "size-4 animate-spin" : "size-4"}
              aria-hidden="true"
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="flex items-end gap-2">
            {isLoading ? (
              <div
                className="h-12 w-40 animate-pulse rounded-md bg-accent/20"
                data-ocid="admin.house_balance.loading_state"
              />
            ) : isError ? (
              <p
                className="font-mono text-sm text-destructive"
                data-ocid="admin.house_balance.error_state"
              >
                Failed to load balance
              </p>
            ) : (
              <span
                className="font-display text-4xl font-700 tracking-tight text-accent text-glow-gold tabular-nums"
                data-ocid="admin.house_balance.value"
              >
                {formatted}
              </span>
            )}
            <span className="mb-1.5 font-mono text-sm font-600 uppercase tracking-wider text-accent/70">
              ICP
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
            <ShieldCheck
              className="size-3.5 text-accent/80"
              aria-hidden="true"
            />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {formatIcp(balance)} ICP available for transfer
            </span>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
