import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDepositAccount, useSyncDeposit } from "@/hooks/use-backend";
import { accountIdToHex, formatIcp } from "@/types";
import { ArrowDownToLine, Check, Copy, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";

/**
 * Shows the player's personal ICP deposit address and lets them sync
 * incoming transfers into their playable vault balance.
 */
export function DepositAccountCard() {
  const { data, isLoading, isError } = useDepositAccount();
  const syncDeposit = useSyncDeposit();
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const hex = data ? accountIdToHex(data.accountId) : "";
  const canisterText = data?.canisterId.toString() ?? "";

  const handleCopy = async () => {
    if (!hex) return;
    await navigator.clipboard.writeText(hex);
    setCopied(true);
    toast.success("Account ID copied");
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncDeposit();
      if (result.warning) {
        toast.error("Deposit sync failed", {
          description: result.warning,
        });
        return;
      }
      if (result.credited > 0n) {
        toast.success("Deposit received", {
          description: `+${formatIcp(result.credited)} ICP added to your balance.`,
        });
      } else {
        toast.message("No new deposits", {
          description: "Send ICP to your account ID, then sync again.",
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card
      className="border-success/30 bg-card/70 backdrop-blur-sm"
      data-ocid="wallet.deposit.card"
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-success/15 ring-1 ring-success/40 text-success">
            <ArrowDownToLine className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="font-display text-base font-700 uppercase tracking-wider">
              Add ICP
            </CardTitle>
            <CardDescription className="text-xs">
              Send ICP to your personal deposit address, then sync
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Your account identifier
          </p>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : isError || !hex ? (
            <p
              className="text-sm text-destructive"
              data-ocid="wallet.deposit.error"
            >
              Could not load deposit address. Sign in and refresh.
            </p>
          ) : (
            <div className="flex items-start gap-2">
              <code
                className="flex-1 break-all rounded-lg border border-border/60 bg-background/60 px-3 py-2 font-mono text-xs leading-relaxed text-foreground"
                data-ocid="wallet.deposit.account_id"
              >
                {hex}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                data-ocid="wallet.deposit.copy_button"
                aria-label="Copy account identifier"
              >
                {copied ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {canisterText && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wallet className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Deposits route to backend canister{" "}
              <span className="font-mono text-foreground/80">
                {canisterText}
              </span>
            </span>
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Paste this 64-character hex ID into your ICP wallet (NNS, Oisy, etc.).
          After sending, tap sync to credit your playable balance.
        </p>

        <Button
          type="button"
          onClick={handleSync}
          disabled={syncing || isLoading || !hex}
          data-ocid="wallet.deposit.sync_button"
          className="w-full font-display uppercase tracking-wider"
        >
          <RefreshCw
            className={syncing ? "size-4 animate-spin" : "size-4"}
            aria-hidden="true"
          />
          Sync deposits
        </Button>
      </CardContent>
    </Card>
  );
}
