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
import { useHouseDepositAccount } from "@/hooks/use-backend";
import { accountIdToHex } from "@/types";
import { Building2, Check, Copy, Landmark } from "lucide-react";
import { toast } from "sonner";

/**
 * Admin card showing the backend canister's default ICP deposit address
 * for funding the vault (cycles and house liquidity).
 */
export function HouseDepositCard() {
  const { data, isLoading, isError } = useHouseDepositAccount();
  const [copied, setCopied] = useState(false);

  const hex = data ? accountIdToHex(data.accountId) : "";
  const canisterText = data?.canisterId.toString() ?? "";

  const handleCopy = async () => {
    if (!hex) return;
    await navigator.clipboard.writeText(hex);
    setCopied(true);
    toast.success("House account ID copied");
    window.setTimeout(() => setCopied(false), 2000);
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
              Fund Backend Account
            </CardTitle>
            <CardDescription className="text-xs">
              Send ICP to the canister&apos;s default ledger account
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Backend account identifier
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
          Use this address to top up the backend with ICP for cycle payments and
          house liquidity. This is the canister&apos;s main ledger account (no
          subaccount).
        </p>
      </CardContent>
    </Card>
  );
}
