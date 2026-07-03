import type { Symbol as SlotSymbol } from "@/backend";
import { Symbol as Sym } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { SPIN_COST_E8S, SYMBOL_META, formatIcp } from "@/types";
import { Coins, Dices, ShieldCheck, Sparkles, Zap } from "lucide-react";

const HERO_SYMBOLS: Sym[] = [
  Sym.diamond,
  Sym.seven,
  Sym.bell,
  Sym.bar,
  Sym.cherry,
];

const FEATURES = [
  {
    icon: Zap,
    title: "Instant payouts",
    body: "Every winning spin credits your wallet immediately — no waiting, no claims.",
  },
  {
    icon: ShieldCheck,
    title: "On-chain custody",
    body: "Your balance lives on the Internet Computer, secured by Internet Identity.",
  },
  {
    icon: Dices,
    title: "Classic reels",
    body: "Five reels, one payline, six timeless symbols. Pure slot-machine fun.",
  },
];

export function LandingScreen() {
  const { login, isLoggingIn, isLoginError } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 20% 15%, oklch(0.62 0.24 25 / 0.18), transparent 45%), radial-gradient(circle at 80% 85%, oklch(0.82 0.16 80 / 0.14), transparent 50%)",
        }}
      />
      <div
        className="vault-grain pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      />

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
        {/* Eyebrow */}
        <Badge
          variant="outline"
          className="mb-6 border-accent/40 bg-accent/10 text-accent"
        >
          <Sparkles className="size-3" aria-hidden="true" />
          Internet Computer · ICP wagering
        </Badge>

        {/* Title */}
        <h1 className="text-center font-display text-5xl font-700 leading-[0.95] tracking-tight text-foreground sm:text-7xl">
          <span className="text-glow-primary text-primary">NEON</span>{" "}
          <span className="text-glow-gold text-accent">VAULT</span>
        </h1>
        <p className="mt-4 max-w-xl text-center text-base text-muted-foreground sm:text-lg">
          A classic slot machine on the Internet Computer. Spin the reels for{" "}
          <span className="font-mono font-600 text-accent">
            {formatIcp(SPIN_COST_E8S)} ICP
          </span>{" "}
          and watch winnings land in your wallet instantly.
        </p>

        {/* Reel strip preview */}
        <div
          className="mt-10 flex w-full max-w-md items-stretch justify-center gap-2 sm:gap-3"
          aria-hidden="true"
        >
          {HERO_SYMBOLS.map((sym, i) => {
            const meta = SYMBOL_META[sym];
            return (
              <div
                key={sym}
                className="reel-edge grid flex-1 place-items-center rounded-lg border border-border/60 px-1 py-4 shadow-lg sm:py-6"
                style={{
                  animation: `float 3s ease-in-out ${i * 0.2}s infinite`,
                }}
              >
                <span
                  className={
                    meta.glyph.length > 2
                      ? "font-display text-lg font-700 text-accent sm:text-2xl"
                      : "text-2xl sm:text-4xl"
                  }
                >
                  {meta.glyph}
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Button
            type="button"
            size="lg"
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="landing.signin_button"
            className="min-w-56 bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-smooth hover:bg-primary/90 hover:shadow-primary/50"
          >
            <Coins className="size-5" aria-hidden="true" />
            {isLoggingIn ? "Connecting…" : "Sign in with Internet Identity"}
          </Button>
          {isLoginError && (
            <p
              className="font-mono text-xs text-destructive"
              data-ocid="landing.error_state"
              role="alert"
            >
              Sign-in failed. Please try again.
            </p>
          )}
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            No password · no email · just your identity
          </p>
        </div>

        {/* Features */}
        <div className="mt-16 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm transition-smooth hover:border-accent/40 hover:bg-card"
            >
              <feature.icon
                className="mb-2 size-5 text-accent"
                aria-hidden="true"
              />
              <p className="font-display text-sm font-600 text-foreground">
                {feature.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
