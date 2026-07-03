import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionHistory } from "@/hooks/use-backend";
import { type Transaction, type TxKind, formatIcp } from "@/types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Dices,
  Gift,
  History,
  ShieldAlert,
} from "lucide-react";

interface KindMeta {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** "in" amounts are credited to the player; "out" amounts are debited. */
  direction: "in" | "out";
  tone: "success" | "primary" | "accent" | "warning";
}

const KIND_META: Record<TxKind, KindMeta> = {
  win: {
    label: "Win",
    icon: Gift,
    direction: "in",
    tone: "success",
  },
  spinCost: {
    label: "Spin cost",
    icon: Dices,
    direction: "out",
    tone: "primary",
  },
  transferOut: {
    label: "Transfer out",
    icon: ArrowUpRight,
    direction: "out",
    tone: "warning",
  },
  transferIn: {
    label: "Transfer in",
    icon: ArrowDownLeft,
    direction: "in",
    tone: "accent",
  },
  adminTransferOut: {
    label: "Admin transfer",
    icon: ShieldAlert,
    direction: "out",
    tone: "primary",
  },
};

const TONE_CLASSES: Record<KindMeta["tone"], string> = {
  success: "bg-success/15 text-success ring-success/30",
  primary: "bg-primary/15 text-primary ring-primary/30",
  accent: "bg-accent/15 text-accent ring-accent/30",
  warning: "bg-warning/15 text-warning ring-warning/30",
};

/** Format a timestamp (ns since epoch) as a short date/time string. */
function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Render a hex account identifier (Uint8Array) as a shortened hex string. */
function formatCounterparty(bytes: Uint8Array | undefined): string | null {
  if (!bytes || bytes.length === 0) return null;
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (hex.length <= 12) return hex;
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`;
}

function TransactionRow({
  txn,
  index,
}: {
  txn: Transaction;
  index: number;
}) {
  const meta = KIND_META[txn.kind];
  const Icon = meta.icon;
  const isIn = meta.direction === "in";
  const counterparty = formatCounterparty(txn.counterparty);

  return (
    <li
      data-ocid={`wallet.history.item.${index + 1}`}
      className="flex items-center gap-3 px-4 py-3 transition-smooth hover:bg-muted/40"
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-lg ring-1 ${TONE_CLASSES[meta.tone]}`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-display text-sm font-600 text-foreground">
            {meta.label}
          </p>
          {counterparty && (
            <Badge
              variant="secondary"
              className="shrink-0 bg-muted/60 font-mono text-[10px] text-muted-foreground"
            >
              {counterparty}
            </Badge>
          )}
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {formatTimestamp(txn.timestamp)}
        </p>
      </div>

      <div className="text-right">
        <p
          className={`font-mono text-sm font-600 tabular-nums ${
            isIn ? "text-success" : "text-foreground"
          }`}
        >
          {isIn ? "+" : "−"}
          {formatIcp(txn.amount)}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          ICP
        </p>
      </div>
    </li>
  );
}

/**
 * Scrollable list of the player's recent transactions (spins, wins,
 * transfers). Shows an empty state when there is no activity yet.
 */
export function TransactionHistory() {
  const { data, isLoading, isError } = useTransactionHistory();
  const txns = data ?? [];

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/40 text-primary">
            <History className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="font-display text-base font-700 uppercase tracking-wider">
              Transaction History
            </CardTitle>
            <CardDescription className="text-xs">
              Spins, wins, and transfers on your account
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div
            className="space-y-2 px-4 pb-4"
            data-ocid="wallet.history.loading_state"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array, index is stable
                key={`skeleton-${i}`}
                className="flex items-center gap-3 py-3"
              >
                <Skeleton className="size-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div
            className="px-6 pb-6 pt-2 text-sm text-destructive"
            data-ocid="wallet.history.error_state"
          >
            Couldn't load your transaction history. Please try again shortly.
          </div>
        ) : txns.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 px-6 py-12 text-center"
            data-ocid="wallet.history.empty_state"
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
              <Coins className="size-6" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="font-display text-sm font-600 text-foreground">
                No transactions yet
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Spin the reels or send a transfer — your activity will show up
                here.
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[22rem]">
            <ul className="divide-y divide-border/50">
              {txns.map((txn, i) => (
                <TransactionRow key={txn.id} txn={txn} index={i} />
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
