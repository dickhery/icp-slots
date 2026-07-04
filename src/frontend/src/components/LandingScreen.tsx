import type { Symbol as SlotSymbol } from "@/backend";
import { Symbol as Sym } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  ICP_LEDGER_FEE_E8S,
  SPIN_COST_E8S,
  SYMBOL_META,
  formatIcp,
} from "@/types";
import {
  CircleDollarSign,
  Dices,
  Fingerprint,
  Info,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

const HERO_SYMBOLS: SlotSymbol[] = [
  Sym.diamond,
  Sym.seven,
  Sym.bell,
  Sym.bar,
  Sym.cherry,
];

const FEATURES = [
  {
    icon: Zap,
    title: "On-chain settlement",
    body: "Wagers and eligible payouts are processed by the game canister on the Internet Computer.",
  },
  {
    icon: ShieldCheck,
    title: "Private sign-in",
    body: "Internet Identity authenticates you without giving this app a password or email address.",
  },
  {
    icon: Dices,
    title: "More ways to play",
    body: "Five reels, three rows, eight symbols, and up to nine selectable paylines.",
  },
];

export function LandingScreen() {
  const { login, isLoggingIn, isLoginError } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div
        className="neon-grid pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div
        className="scanlines pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 top-16 size-72 animate-neon-drift rounded-full bg-primary/20 blur-[90px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-28 bottom-10 size-80 animate-neon-drift rounded-full bg-accent/15 blur-[100px] [animation-delay:-4s]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 size-56 -translate-x-1/2 rounded-full bg-success/5 blur-[90px]"
        aria-hidden="true"
      />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <Badge
          variant="outline"
          className="mb-5 border-accent/50 bg-accent/10 px-3 py-1 text-accent shadow-gold backdrop-blur-md"
        >
          <Sparkles className="size-3" aria-hidden="true" />
          Built on the Internet Computer
        </Badge>

        <h1 className="text-center font-display text-5xl font-bold leading-[0.9] tracking-[-0.06em] text-foreground sm:text-7xl md:text-8xl">
          <span className="text-glow-primary text-primary">NEON</span>{" "}
          <span className="text-glow-gold text-accent">VAULT</span>
        </h1>
        <p className="mt-5 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground sm:text-lg">
          A five-reel, three-row slot game with up to nine paylines. Each active
          line starts at{" "}
          <span className="font-mono font-semibold text-accent">
            {formatIcp(SPIN_COST_E8S)} ICP
          </span>
          , with optional multipliers and a{" "}
          <span className="font-mono text-foreground">
            {formatIcp(ICP_LEDGER_FEE_E8S)} ICP
          </span>{" "}
          ledger fee per spin.
        </p>

        <div
          className="neon-card mt-8 flex w-full max-w-lg items-stretch justify-center gap-2 rounded-2xl border border-border/60 bg-card/45 p-2 backdrop-blur-md sm:mt-10 sm:gap-3 sm:p-3"
          aria-hidden="true"
        >
          {HERO_SYMBOLS.map((symbol, index) => {
            const meta = SYMBOL_META[symbol];
            return (
              <div
                key={symbol}
                className="reel-edge reel-window-glass grid aspect-[3/4] flex-1 place-items-center rounded-xl border border-border/70 shadow-lg animate-landing-float"
                style={{ animationDelay: `${index * 160}ms` }}
              >
                <span
                  className={
                    meta.glyph.length > 2
                      ? "symbol-glow font-display text-sm font-bold text-accent sm:text-2xl"
                      : "symbol-glow text-2xl sm:text-4xl"
                  }
                >
                  {meta.glyph}
                </span>
              </div>
            );
          })}
        </div>

        <section className="neon-card mt-8 w-full max-w-2xl rounded-2xl border border-border/70 bg-card/75 p-5 backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <div className="mb-2 flex items-center gap-2 text-accent">
                <Fingerprint className="size-5" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold">
                  Enter with Internet Identity
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Continue with a device passkey or another supported Internet
                Identity method. The app receives a private principal, not your
                sign-in credentials.
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="landing.signin_button"
              className="neon-spin-button min-w-56 shrink-0 bg-primary text-primary-foreground transition-smooth hover:scale-[1.02] hover:bg-primary/90"
            >
              {isLoggingIn ? (
                <LoaderCircle
                  className="size-5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Fingerprint className="size-5" aria-hidden="true" />
              )}
              {isLoggingIn ? "Connecting…" : "Continue securely"}
            </Button>
          </div>

          {isLoginError ? (
            <p
              className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive"
              data-ocid="landing.error_state"
              role="alert"
            >
              Sign-in did not complete. Please try again.
            </p>
          ) : null}

          <div className="mt-5 flex gap-3 rounded-xl border border-warning/25 bg-warning/5 p-3 text-xs leading-relaxed text-muted-foreground">
            <Info
              className="mt-0.5 size-4 shrink-0 text-warning"
              aria-hidden="true"
            />
            <p>
              This game uses real ICP. Wagers can be lost. Review the paytable,
              set a limit, and play only where permitted.
            </p>
          </div>
        </section>

        <div className="mt-8 grid w-full max-w-4xl gap-3 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="neon-card group rounded-xl border border-border/60 bg-card/55 p-4 backdrop-blur-sm transition-smooth hover:-translate-y-0.5 hover:border-accent/45 hover:bg-card/80"
            >
              <span className="mb-3 grid size-9 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-accent group-hover:shadow-gold">
                <feature.icon className="size-4" aria-hidden="true" />
              </span>
              <p className="font-display text-sm font-semibold text-foreground">
                {feature.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-7 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <CircleDollarSign
            className="size-3.5 text-accent"
            aria-hidden="true"
          />
          ICP balance required to spin · Paytable available after sign-in
        </p>
      </main>
    </div>
  );
}
