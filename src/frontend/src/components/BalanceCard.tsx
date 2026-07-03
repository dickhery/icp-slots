import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionHistory } from "@/hooks/use-backend";
import { useBalance } from "@/hooks/use-balance";
import { formatIcp } from "@/types";
import {
  Coins,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

/**
 * Hero balance card — the wallet's focal point. Large gold display with a
 * glow, a refresh control, and a quick in/out summary drawn from the
 * transaction history.
 */
export function BalanceCard() {
  const { e8s, isLoading, isRefetching, isError } = useBalance();
  const { data: txns } = useTransactionHistory();

  const recent = txns ?? [];
  const totalIn = recent
    .filter((t) => t.kind === "win" || t.kind === "transferIn")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOut = recent
    .filter((t) => t.kind === "spinCost" || t.kind === "transferOut")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <Card className="relative overflow-hidden border-accent/30 bg-card/80 backdrop-blur-sm">
      {/* Decorative gold glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-accent/15 ring-1 ring-accent/40 text-accent">
              <Wallet className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="font-display text-base font-700 uppercase tracking-wider">
                Your Balance
              </CardTitle>
              <CardDescription className="text-xs">
                ICP ledger balance in your canister-managed player account
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => window.dispatchEvent(new Event("balance:refresh"))}
            data-ocid="wallet.balance.refresh_button"
            aria-label="Refresh balance"
            className="text-muted-foreground hover:text-accent"
          >
            <RefreshCw
              className={isRefetching ? "size-4 animate-spin" : "size-4"}
              aria-hidden="true"
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Big balance display */}
        <div
          className="flex items-end gap-2"
          data-ocid="wallet.balance.display"
        >
          {isLoading ? (
            <Skeleton className="h-12 w-40" />
          ) : (
            <span className="font-display text-5xl font-700 tabular-nums text-accent text-glow-gold">
              {e8s === null ? "—" : formatIcp(e8s)}
            </span>
          )}
          <span className="mb-1.5 font-mono text-sm font-600 uppercase tracking-widest text-accent/70">
            ICP
          </span>
        </div>

        {isError && (
          <p
            className="text-xs text-destructive"
            data-ocid="wallet.balance.error_state"
          >
            Couldn't load balance. Tap refresh to try again.
          </p>
        )}

        {/* In / Out summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-success/25 bg-success/10 px-4 py-3">
            <div className="flex items-center gap-2 text-success">
              <TrendingUp className="size-4" aria-hidden="true" />
              <span className="font-mono text-[10px] uppercase tracking-wider">
                Credited
              </span>
            </div>
            <p className="mt-1 font-mono text-lg font-600 tabular-nums text-foreground">
              {formatIcp(BigInt(totalIn))}
            </p>
            <Badge
              variant="secondary"
              className="mt-1 bg-success/15 text-success"
            >
              wins · transfers in
            </Badge>
          </div>

          <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3">
            <div className="flex items-center gap-2 text-primary">
              <TrendingDown className="size-4" aria-hidden="true" />
              <span className="font-mono text-[10px] uppercase tracking-wider">
                Debited
              </span>
            </div>
            <p className="mt-1 font-mono text-lg font-600 tabular-nums text-foreground">
              {formatIcp(BigInt(totalOut))}
            </p>
            <Badge
              variant="secondary"
              className="mt-1 bg-primary/15 text-primary"
            >
              spins · transfers out
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Coins className="size-3.5 text-accent/70" aria-hidden="true" />
          <span>Summary reflects your recent activity on this device.</span>
        </div>
      </CardContent>
    </Card>
  );
}
