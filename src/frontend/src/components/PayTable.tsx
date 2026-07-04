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
  symbol: SlotSymbol;
  count: number;
  label: string;
  prize: string;
}

/** Reference payout tiers per payline. Backend is the source of truth. */
export const PAY_TIERS: PayTier[] = [
  {
    symbol: SlotSymbol.diamond,
    count: 5,
    label: "5 × Diamond",
    prize: "7.40 ICP",
  },
  {
    symbol: SlotSymbol.diamond,
    count: 4,
    label: "4 × Diamond",
    prize: "5.92 ICP",
  },
  {
    symbol: SlotSymbol.diamond,
    count: 3,
    label: "3 × Diamond",
    prize: "4.44 ICP",
  },
  { symbol: SlotSymbol.bar, count: 5, label: "5 × Bar", prize: "2.45 ICP" },
  { symbol: SlotSymbol.bar, count: 4, label: "4 × Bar", prize: "1.96 ICP" },
  { symbol: SlotSymbol.bar, count: 3, label: "3 × Bar", prize: "1.47 ICP" },
  { symbol: SlotSymbol.seven, count: 5, label: "5 × Seven", prize: "1.20 ICP" },
  { symbol: SlotSymbol.seven, count: 4, label: "4 × Seven", prize: "0.96 ICP" },
  { symbol: SlotSymbol.seven, count: 3, label: "3 × Seven", prize: "0.72 ICP" },
  { symbol: SlotSymbol.bell, count: 5, label: "5 × Bell", prize: "0.60 ICP" },
  { symbol: SlotSymbol.bell, count: 4, label: "4 × Bell", prize: "0.48 ICP" },
  { symbol: SlotSymbol.bell, count: 3, label: "3 × Bell", prize: "0.36 ICP" },
  { symbol: SlotSymbol.star, count: 5, label: "5 × Star", prize: "0.95 ICP" },
  { symbol: SlotSymbol.star, count: 4, label: "4 × Star", prize: "0.76 ICP" },
  { symbol: SlotSymbol.star, count: 3, label: "3 × Star", prize: "0.57 ICP" },
  {
    symbol: SlotSymbol.lemon,
    count: 5,
    label: "5 × Lemon",
    prize: "0.35 ICP",
  },
  {
    symbol: SlotSymbol.lemon,
    count: 4,
    label: "4 × Lemon",
    prize: "0.28 ICP",
  },
  {
    symbol: SlotSymbol.lemon,
    count: 3,
    label: "3 × Lemon",
    prize: "0.21 ICP",
  },
  {
    symbol: SlotSymbol.horseshoe,
    count: 5,
    label: "5 × Horseshoe",
    prize: "0.45 ICP",
  },
  {
    symbol: SlotSymbol.horseshoe,
    count: 4,
    label: "4 × Horseshoe",
    prize: "0.36 ICP",
  },
  {
    symbol: SlotSymbol.horseshoe,
    count: 3,
    label: "3 × Horseshoe",
    prize: "0.27 ICP",
  },
  {
    symbol: SlotSymbol.cherry,
    count: 5,
    label: "5 × Cherry",
    prize: "0.10 ICP",
  },
  {
    symbol: SlotSymbol.cherry,
    count: 4,
    label: "4 × Cherry",
    prize: "0.08 ICP",
  },
  {
    symbol: SlotSymbol.cherry,
    count: 3,
    label: "3 × Cherry",
    prize: "0.06 ICP",
  },
  {
    symbol: SlotSymbol.cherry,
    count: 2,
    label: "2 × Cherry",
    prize: "0.04 ICP",
  },
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
          Match symbols left-to-right on any active payline. Prizes scale per
          line bet (0.01 ICP). Long-run return to player: ~98%.
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
