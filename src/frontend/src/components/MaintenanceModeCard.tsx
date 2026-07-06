import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useMaintenanceMode, useSetMaintenanceMode } from "@/hooks/use-backend";
import { cn } from "@/lib/utils";
import { AlertTriangle, Wrench } from "lucide-react";
import { useState } from "react";

/**
 * Admin-only toggle that pauses player spins while maintenance is active.
 * Admins can still spin to verify the machine during downtime.
 */
export function MaintenanceModeCard() {
  const { data: enabled, isLoading, isError, refetch } = useMaintenanceMode();
  const setMaintenanceMode = useSetMaintenanceMode();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (next: boolean) => {
    setError(null);
    setPending(true);
    try {
      await setMaintenanceMode(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to update maintenance mode",
      );
      void refetch();
    } finally {
      setPending(false);
    }
  };

  const isEnabled = enabled === true;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm",
        isEnabled && "border-warning/40",
      )}
      data-ocid="admin.maintenance_mode.card"
    >
      {isEnabled ? (
        <div
          className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-warning/10 blur-3xl"
          aria-hidden="true"
        />
      ) : null}
      <CardHeader>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid size-11 place-items-center rounded-xl ring-1",
              isEnabled
                ? "bg-warning/15 text-warning ring-warning/40"
                : "bg-primary/15 text-primary ring-primary/40",
            )}
          >
            <Wrench className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-0.5">
            <CardTitle className="font-display text-base font-600 tracking-tight">
              Maintenance Mode
            </CardTitle>
            <CardDescription className="text-xs">
              Pause player spins while you perform vault or game updates
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-background/40 px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {isLoading
                ? "Loading status…"
                : isEnabled
                  ? "Maintenance active"
                  : "Game open"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isEnabled
                ? "Only admins can spin until maintenance is turned off."
                : "All signed-in players can spin normally."}
            </p>
          </div>
          <Switch
            checked={isEnabled}
            disabled={isLoading || isError || pending}
            onCheckedChange={handleToggle}
            aria-label="Toggle maintenance mode"
            data-ocid="admin.maintenance_mode.toggle"
          />
        </div>

        {isEnabled ? (
          <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2">
            <AlertTriangle
              className="mt-0.5 size-3.5 shrink-0 text-warning"
              aria-hidden="true"
            />
            <p className="text-xs text-muted-foreground">
              Players see a maintenance notice when they try to spin. Your admin
              spins still work for smoke testing.
            </p>
          </div>
        ) : null}

        {isError ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-destructive">
              Failed to load maintenance status
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              data-ocid="admin.maintenance_mode.retry_button"
            >
              Retry
            </Button>
          </div>
        ) : null}

        {error ? (
          <p
            className="text-xs text-destructive"
            data-ocid="admin.maintenance_mode.error"
          >
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
