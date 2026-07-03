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

function CopyableAccountId({
  label,
  hex,
  copyLabel,
  dataOcid,
}: {
  label: string;
  hex: string;
  copyLabel: string;
  dataOcid: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!hex) return;
    await navigator.clipboard.writeText(hex);
    setCopied(true);
    toast.success(copyLabel);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex items-start gap-2">
        <code
          className="flex-1 break-all rounded-lg border border-border/60 bg-background/60 px-3 py-2 font-mono text-xs leading-relaxed text-foreground"
          data-ocid={dataOcid}
        >
          {hex}
        </code>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          aria-label={`Copy ${label.toLowerCase()}`}
        >
          {copied ? (
            <Check className="size-4 text-success" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Admin card showing the house vault deposit address and a sync control
 * that credits ICP from the ledger into the playable house balance.
 */
export function HouseDepositCard() {
  const { data, isLoading, isError } = useHouseDepositAccount();
  const syncHouseDeposit = useSyncHouseDeposit();
  const [syncing, setSyncing] = useState(false);
  const [lastLedger, setLastLedger] = useState<{
    default: bigint;
    house: bigint;
  } | null>(null);

  let primaryHex = "";
  try {
    primaryHex = data ? accountIdToHex(data.accountId) : "";
  } catch (e) {
    console.error("Invalid house deposit account identifier", e);
  }

  const canisterText = data?.canisterId.toString() ?? "";

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncHouseDeposit();
      setLastLedger({
        default: result.ledgerDefault,
        house: result.ledgerHouse,
      });
      if (result.warning) {
        toast.warning("House sync needs attention", {
          description: result.warning,
        });
        return;
      }
      if (result.credited > 0n) {
        toast.success("House funded", {
          description: `+${formatIcp(result.credited)} ICP added to house balance (${formatIcp(result.balance)} ICP total).`,
        });
      } else {
        const onLedger = result.ledgerDefault + result.ledgerHouse;
        toast.message("No new deposits credited", {
          description:
            onLedger > 0n
              ? `Ledger holds ${formatIcp(onLedger)} ICP (${formatIcp(result.ledgerDefault)} default, ${formatIcp(result.ledgerHouse)} house subaccount). Tap sync after each new transfer.`
              : "No ICP detected on the ledger yet. Send to the account ID above, wait for confirmation, then sync again.",
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
              Send ICP to the account ID below, then sync
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : isError || !primaryHex ? (
          <p
            className="text-sm text-destructive"
            data-ocid="admin.house_deposit.error"
          >
            Could not load house deposit address. Sign in as admin and refresh.
          </p>
        ) : (
          <CopyableAccountId
            label="Canonical house vault account identifier"
            hex={primaryHex}
            copyLabel="House vault account ID copied"
            dataOcid="admin.house_deposit.account_id"
          />
        )}

        {canisterText && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Backend canister{" "}
              <span className="font-mono text-foreground/80">
                {canisterText}
              </span>
            </span>
          </div>
        )}

        {lastLedger && (
          <p className="rounded-md border border-border/50 bg-background/50 px-3 py-2 font-mono text-[11px] text-muted-foreground">
            Last ledger check: {formatIcp(lastLedger.house)} ICP in house vault
            {lastLedger.default > 0n
              ? ` · ${formatIcp(lastLedger.default)} ICP legacy balance`
              : ""}
          </p>
        )}

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          In NNS, Oisy, or another ICP wallet, choose <em>Send ICP</em> and
          paste the 64-character account identifier above as the destination. Do
          not enter the canister principal alone — that is a different address.
          This is the same canister-owned vault that receives wagers and pays
          winners. After the transfer confirms, tap sync. Funds sent to the
          address used by older builds are swept here automatically when
          possible.
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
