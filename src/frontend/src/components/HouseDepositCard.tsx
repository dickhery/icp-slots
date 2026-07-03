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
import {
  useHouseDepositAccount,
  useSyncHouseDeposit,
} from "@/hooks/use-backend";
import { accountIdToHex, formatIcp } from "@/types";
import { Building2, Check, Copy, Landmark, RefreshCw } from "lucide-react";
import { toast } from "sonner";

/**
 * Admin card showing the house vault deposit address and a sync control
 * that credits ICP from the ledger into the playable house balance.
 */
export function HouseDepositCard() {
  const { data, isLoading, isError } = useHouseDepositAccount();
  const syncHouseDeposit = useSyncHouseDeposit();
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const hex = data ? accountIdToHex(data.accountId) : "";
  const canisterText = data?.canisterId.toString() ?? "";

  const handleCopy = async () => {
    if (!hex) return;
    await navigator.clipboard.writeText(hex);
    setCopied(true);
    toast.success("House account ID copied");
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncHouseDeposit();
      if (result.credited > 0n) {
        toast.success("House funded", {
          description: `+${formatIcp(result.credited)} ICP added to house balance.`,
        });
      } else {
        toast.message("No new deposits", {
          description:
            "Send ICP to the house account ID below, then sync again.",
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
      className="border-primary/30 bg-card/70 backdrop-blur-sm"
      data-ocid="admin.house_deposit.card"
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/40 text-primary">
            <Landmark className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="font-display text-base font-600 tracking-tight">
              Fund House Balance
            </CardTitle>
            <CardDescription className="text-xs">
              Send ICP to the house vault account, then sync
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            House account identifier
          </p>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : isError || !hex ? (
            <p
              className="text-sm text-destructive"
              data-ocid="admin.house_deposit.error"
            >
              Could not load house deposit address.
            </p>
          ) : (
            <div className="flex items-start gap-2">
              <code
                className="flex-1 break-all rounded-lg border border-border/60 bg-background/60 px-3 py-2 font-mono text-xs leading-relaxed text-foreground"
                data-ocid="admin.house_deposit.account_id"
              >
                {hex}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                data-ocid="admin.house_deposit.copy_button"
                aria-label="Copy house account identifier"
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
            <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Canister{" "}
              <span className="font-mono text-foreground/80">
                {canisterText}
              </span>
            </span>
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          This address is dedicated to the house pool (separate from player
          deposits). If you funded the canister before this update, tap sync —
          it will also pick up ICP on the previous default account.
        </p>

        <Button
          type="button"
          onClick={handleSync}
          disabled={syncing || isLoading}
          data-ocid="admin.house_deposit.sync_button"
          className="w-full font-display uppercase tracking-wider"
        >
          <RefreshCw
            className={syncing ? "size-4 animate-spin" : "size-4"}
            aria-hidden="true"
          />
          Sync house deposits
        </Button>
      </CardContent>
    </Card>
  );
}
