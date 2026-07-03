import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useBalance } from "@/hooks/use-balance";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type RouteId, shortPrincipal } from "@/types";
import { Coins, LogOut, Sparkles, Wallet } from "lucide-react";

interface HeaderProps {
  activeRoute: RouteId;
  onNavigate: (route: RouteId) => void;
}

export function Header({ activeRoute, onNavigate }: HeaderProps) {
  const { isAuthenticated, principal, role, isAdmin, signOut } = useAuth();
  const { formatted, e8s, isRefetching } = useBalance();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-card/80 backdrop-blur-xl shadow-subtle">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onNavigate("slot")}
          data-ocid="header.brand_link"
          className="flex shrink-0 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          aria-label="Neon Vault Slots — home"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/40 text-primary">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span className="hidden flex-col items-start leading-none sm:flex">
            <span className="font-display text-sm font-700 tracking-wide text-foreground">
              NEON VAULT
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/80">
              Slots
            </span>
          </span>
        </button>

        <Separator orientation="vertical" className="hidden h-8 sm:block" />

        {/* Nav */}
        {isAuthenticated && (
          <nav
            className="flex items-center gap-1"
            aria-label="Primary navigation"
          >
            {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(
              (item) => {
                const active = activeRoute === item.id;
                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => onNavigate(item.id)}
                    data-ocid={`header.nav.${item.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "font-display text-xs uppercase tracking-wider",
                      active && "text-accent",
                    )}
                  >
                    {item.label}
                  </Button>
                );
              },
            )}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Balance */}
          {isAuthenticated && (
            <div
              className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5"
              data-ocid="header.balance"
              aria-label={`Balance: ${formatted}`}
            >
              <Coins
                className={cn(
                  "size-4 text-accent",
                  isRefetching && "animate-pulse",
                )}
                aria-hidden="true"
              />
              <span className="font-mono text-sm font-600 text-accent tabular-nums">
                {e8s === null ? "—" : formatted}
              </span>
            </div>
          )}

          {/* User chip */}
          {isAuthenticated && principal && (
            <div className="flex items-center gap-2">
              <Avatar className="size-8 ring-1 ring-primary/40">
                <AvatarFallback className="bg-primary/20 font-display text-xs font-700 text-primary">
                  {principal.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col leading-none md:flex">
                <span className="font-mono text-xs text-foreground">
                  {shortPrincipal(principal)}
                </span>
                {role && (
                  <Badge
                    variant="secondary"
                    className="mt-0.5 h-4 px-1.5 text-[9px] uppercase tracking-wider"
                  >
                    {role}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Sign out */}
          {isAuthenticated && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={signOut}
              data-ocid="header.signout_button"
              aria-label="Sign out"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          )}

          {/* Wallet hint when not signed in (kept off landing; only shows if header renders) */}
          {!isAuthenticated && (
            <Wallet
              className="size-5 text-muted-foreground/50"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </header>
  );
}
