import { AdminTransferForm } from "@/components/AdminTransferForm";
import { HouseBalanceCard } from "@/components/HouseBalanceCard";
import { HouseDepositCard } from "@/components/HouseDepositCard";
import { HouseStatsPanel } from "@/components/HouseStatsPanel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Lock } from "lucide-react";
import { motion } from "motion/react";

/**
 * Admin-only console: house balance, aggregate stats, and the
 * admin transfer flow. Visible only to the first authenticated
 * user (admin). Non-admins see a restricted-access notice.
 */
export function AdminPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <Card
        className="mx-auto max-w-2xl border-border/60 bg-card/70 backdrop-blur-sm"
        data-ocid="admin.restricted.card"
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/40 text-primary">
              <Lock className="size-5" aria-hidden="true" />
            </span>
            <div className="space-y-0.5">
              <CardTitle className="font-display text-xl tracking-tight">
                Admin access required
              </CardTitle>
              <CardDescription>
                This console is restricted to the vault administrator.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            data-ocid="admin.restricted.back_button"
            className="text-muted-foreground"
          >
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
      data-ocid="admin.page"
    >
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-700 tracking-tight text-foreground">
          Admin Console
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage the house balance, review aggregate stats, and transfer
          accumulated ICP to external accounts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HouseBalanceCard />
        <HouseDepositCard />
      </div>

      {/* Aggregate stats */}
      <HouseStatsPanel />

      {/* Transfer form */}
      <AdminTransferForm />
    </motion.div>
  );
}
