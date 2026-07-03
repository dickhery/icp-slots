import { useEffect, useRef, useState } from "react";

import { Symbol as SlotSymbol } from "@/backend";
import { Button } from "@/components/ui/button";
import { useSpin, useSpinHistory } from "@/hooks/use-backend";
import { useBalance } from "@/hooks/use-balance";
import { cn } from "@/lib/utils";
import type { SlotSymbol as SlotSymbolType } from "@/types";
import { SPIN_COST_E8S, formatIcp } from "@/types";
import { Payline } from "./Payline";
import { Reel } from "./Reel";
import { WinCelebration } from "./WinCelebration";

/** Neutral resting symbols shown before the first spin. */
const REST_SYMBOLS: SlotSymbolType[] = [
  SlotSymbol.cherry,
  SlotSymbol.lemon,
  SlotSymbol.bell,
  SlotSymbol.seven,
  SlotSymbol.diamond,
];

/**
 * The slot cabinet: five reels, a single center payline, a spin button that
 * charges 0.01 ICP, and a win celebration overlay.
 */
export function SlotMachine() {
  const balance = useBalance();
  const spin = useSpin();
  const { data: history = [] } = useSpinHistory();

  const [display, setDisplay] = useState<SlotSymbol[]>(REST_SYMBOLS);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState(false);
  const [payout, setPayout] = useState(0n);
  const [winTrigger, setWinTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const spinIdRef = useRef(0);

  const insufficientFunds = balance.e8s !== null && balance.e8s < SPIN_COST_E8S;

  const handleSpin = async () => {
    if (spinning) return;
    setError(null);
    setWon(false);
    setSpinning(true);
    const id = ++spinIdRef.current;
    try {
      const outcome = await spin();
      // Ignore stale responses if a newer spin started.
      if (id !== spinIdRef.current) return;
      setDisplay(outcome.symbols as SlotSymbol[]);
      // Brief delay lets the reel land animation play before celebration.
      window.setTimeout(() => {
        if (id !== spinIdRef.current) return;
        setSpinning(false);
        if (outcome.won && outcome.payout > 0n) {
          setWon(true);
          setPayout(outcome.payout);
          setWinTrigger((n) => n + 1);
        }
      }, 1100);
    } catch (e) {
      if (id !== spinIdRef.current) return;
      setSpinning(false);
      setError(e instanceof Error ? e.message : "Spin failed");
    }
  };

  // Clear win highlight after the celebration window.
  useEffect(() => {
    if (!won) return;
    const t = window.setTimeout(() => setWon(false), 2600);
    return () => window.clearTimeout(t);
  }, [won]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 shadow-cabinet backdrop-blur-sm sm:p-8"
      data-ocid="slot.cabinet"
    >
      <WinCelebration payout={payout} trigger={winTrigger} />

      {/* Cabinet header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-glow-primary sm:text-2xl">
            Neon Vault
          </h2>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Single Payline · 5 Reels
          </p>
        </div>
        <div className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Balance
          </p>
          <p
            className="font-mono text-sm font-semibold text-accent"
            data-ocid="slot.balance"
          >
            {balance.formatted}
          </p>
        </div>
      </div>

      {/* Reel window */}
      <div
        className="relative rounded-xl border border-border/70 bg-background/60 p-3 vault-grain"
        data-ocid="slot.reel_window"
      >
        <Payline active={won} />
        <div className="relative z-10 flex justify-center gap-2 sm:gap-3">
          {display.map((sym, i) => (
            <Reel
              key={sym}
              index={i}
              target={sym}
              spinning={spinning}
              durationMs={900}
            />
          ))}
        </div>
      </div>

      {/* Status line */}
      <div className="mt-4 min-h-6 text-center">
        {error ? (
          <p
            className="text-sm font-medium text-destructive"
            data-ocid="slot.error_state"
          >
            {error}
          </p>
        ) : won ? (
          <p
            className="font-display text-lg font-bold text-glow-gold"
            data-ocid="slot.success_state"
          >
            Winner! +{formatIcp(payout)} ICP
          </p>
        ) : spinning ? (
          <p className="text-sm text-muted-foreground">Spinning…</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {insufficientFunds
              ? "Insufficient balance — top up your wallet to spin."
              : `0.01 ICP per spin · ${history.length} spins played`}
          </p>
        )}
      </div>

      {/* Spin control */}
      <div className="mt-4 flex justify-center">
        <Button
          type="button"
          size="lg"
          onClick={handleSpin}
          disabled={spinning || insufficientFunds || balance.isLoading}
          data-ocid="slot.spin_button"
          className={cn(
            "h-14 min-w-56 rounded-full px-10 font-display text-lg font-bold uppercase tracking-wider",
            "bg-primary text-primary-foreground shadow-primary transition-smooth",
            "hover:scale-[1.02] hover:shadow-gold-lg disabled:hover:scale-100 disabled:hover:shadow-primary",
            !spinning && !insufficientFunds && "animate-pulse-glow",
          )}
        >
          {spinning ? "Spinning…" : "Spin · 0.01 ICP"}
        </Button>
      </div>
    </div>
  );
}
