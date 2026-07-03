import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHouseStats } from "@/hooks/use-backend";
import type { HouseStats } from "@/types";
import { formatIcp } from "@/types";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Coins,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface StatDef {
  key: keyof Pick<
    HouseStats,
    "totalSpins" | "totalWagered" | "totalPaidOut" | "houseRetained"
  >;
  label: string;
  icon: LucideIcon;
  accent: "primary" | "accent" | "success" | "warning";
  format: (stats: HouseStats) => string;
  suffix?: string;
}

const STAT_DEFS: StatDef[] = [
  {
    key: "totalSpins",
    label: "Total Spins",
    icon: Activity,
    accent: "primary",
    format: (s) => Number(s.totalSpins).toLocaleString(),
  },
  {
    key: "totalWagered",
    label: "Total Wagered",
    icon: ArrowUpFromLine,
    accent: "warning",
    format: (s) => formatIcp(s.totalWagered),
    suffix: "ICP",
  },
  {
    key: "totalPaidOut",
    label: "Total Paid Out",
    icon: ArrowDownToLine,
    accent: "success",
    format: (s) => formatIcp(s.totalPaidOut),
    suffix: "ICP",
  },
  {
    key: "houseRetained",
    label: "House Retained",
    icon: Banknote,
    accent: "accent",
    format: (s) => formatIcp(s.houseRetained),
    suffix: "ICP",
  },
];

const ACCENT_CLASSES: Record<StatDef["accent"], string> = {
  primary: "bg-primary/15 ring-primary/40 text-primary",
  accent: "bg-accent/15 ring-accent/40 text-accent",
  success: "bg-success/15 ring-success/40 text-success",
  warning: "bg-warning/15 ring-warning/40 text-warning",
};

/**
 * Admin-only panel showing aggregate house statistics:
 * total spins, total wagered, total paid out, house retained.
 */
export function HouseStatsPanel() {
  const { data, isLoading, isError } = useHouseStats();

  return (
    <Card
      className="border-border/60 bg-card/70 backdrop-blur-sm"
      data-ocid="admin.house_stats.panel"
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/40 text-primary">
            <Coins className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-0.5">
            <CardTitle className="font-display text-base font-600 tracking-tight">
              House Statistics
            </CardTitle>
            <CardDescription className="text-xs">
              Aggregate activity across all spins
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-6 text-center"
            data-ocid="admin.house_stats.error_state"
          >
            <p className="font-mono text-sm text-destructive">
              Failed to load house statistics
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {STAT_DEFS.map((def, index) => (
              <StatTile
                key={def.key}
                def={def}
                stats={data}
                isLoading={isLoading}
                index={index}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatTileProps {
  def: StatDef;
  stats: HouseStats | undefined;
  isLoading: boolean;
  index: number;
}

function StatTile({ def, stats, isLoading, index }: StatTileProps) {
  const Icon = def.icon;
  const value = stats ? def.format(stats) : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl border border-border/60 bg-background/60 p-4"
      data-ocid={`admin.house_stats.item.${index + 1}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {def.label}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-display text-2xl font-700 tracking-tight text-foreground tabular-nums"
                data-ocid={`admin.house_stats.value.${index + 1}`}
              >
                {value}
              </span>
              {def.suffix && (
                <span className="font-mono text-xs font-600 uppercase tracking-wider text-muted-foreground">
                  {def.suffix}
                </span>
              )}
            </div>
          )}
        </div>
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-lg ring-1 ${ACCENT_CLASSES[def.accent]}`}
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </span>
      </div>
    </motion.div>
  );
}
