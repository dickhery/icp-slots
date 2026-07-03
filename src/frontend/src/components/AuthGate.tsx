import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { LandingScreen } from "./LandingScreen";

interface AuthGateProps {
  children: ReactNode;
}

/**
 * Gates the app behind Internet Identity. While II is initializing we show a
 * branded loader; unauthenticated users see the landing screen; authenticated
 * users see the children.
 */
export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background"
        data-ocid="auth.loading_state"
      >
        <div className="relative grid size-16 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/40">
          <Loader2
            className="size-7 animate-spin text-primary"
            aria-hidden="true"
          />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Unlocking the vault…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingScreen />;
  }

  return <>{children}</>;
}
