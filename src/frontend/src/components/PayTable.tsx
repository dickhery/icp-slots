import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SYMBOL_META, SlotSymbol } from "@/types";

/** A single payout-table row describing a symbol combination and its prize. */
export interface PayTier {
  /** Symbol that must appear on the payline. */
  symbol: SlotSymbol;
  /** Minimum count of `symbol` on the payline to win this tier. */
  count: number;
  /** Human-readable combination label (e.g. "3 × Cherry"). */
  label: string;
  /** Prize in ICP (display only — backend is the source of truth). */
  prize: string;
}

/**
 * Reference payout tiers for the single payline. The backend computes the
 * actual payout; this table mirrors those values for player transparency.
 */
export const PAY_TIERS: PayTier[] = [
  {
    symbol: SlotSymbol.diamond,
    count: 5,
    label: "5 × Diamond",
    prize: "5.00 ICP",
  },
  {
    symbol: SlotSymbol.diamond,
    count: 4,
    label: "4 × Diamond",
    prize: "1.00 ICP",
  },
  {
    symbol: SlotSymbol.diamond,
    count: 3,
    label: "3 × Diamond",
    prize: "0.20 ICP",
  },
  { symbol: SlotSymbol.seven, count: 5, label: "5 × Seven", prize: "2.00 ICP" },
  { symbol: SlotSymbol.seven, count: 4, label: "4 × Seven", prize: "0.50 ICP" },
  { symbol: SlotSymbol.seven, count: 3, label: "3 × Seven", prize: "0.10 ICP" },
  { symbol: SlotSymbol.bar, count: 5, label: "5 × Bar", prize: "1.00 ICP" },
  { symbol: SlotSymbol.bar, count: 4, label: "4 × Bar", prize: "0.30 ICP" },
  { symbol: SlotSymbol.bar, count: 3, label: "3 × Bar", prize: "0.08 ICP" },
  { symbol: SlotSymbol.bell, count: 5, label: "5 × Bell", prize: "0.50 ICP" },
  { symbol: SlotSymbol.bell, count: 4, label: "4 × Bell", prize: "0.15 ICP" },
  { symbol: SlotSymbol.bell, count: 3, label: "3 × Bell", prize: "0.05 ICP" },
  {
    symbol: SlotSymbol.cherry,
    count: 3,
    label: "3 × Cherry",
    prize: "0.04 ICP",
  },
  { symbol: SlotSymbol.lemon, count: 3, label: "3 × Lemon", prize: "0.03 ICP" },
];

/** Payout reference table shown to players. */
export function PayTable() {
  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-display text-lg tracking-tight text-glow-gold">
          Payout Table
        </CardTitle>
        <CardDescription>
          Match symbols on the center payline. Higher symbols pay more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/50" data-ocid="paytable.list">
          {PAY_TIERS.map((tier, i) => {
            const meta = SYMBOL_META[tier.symbol];
            const accent =
              meta.accent === "accent"
                ? "text-accent"
                : meta.accent === "success"
                  ? "text-success"
                  : meta.accent === "warning"
                    ? "text-warning"
                    : "text-primary";
            return (
              <li
                key={`${tier.symbol}-${tier.count}`}
                data-ocid={`paytable.item.${i + 1}`}
                className="flex items-center justify-between py-2.5"
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-md bg-background/60 ring-1 ring-border/60",
                      accent,
                    )}
                    aria-hidden="true"
                  >
                    <span className="font-display text-lg font-bold leading-none">
                      {meta.glyph}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {tier.label}
                  </span>
                </span>
                <span className="font-mono text-sm font-semibold text-accent">
                  {tier.prize}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
