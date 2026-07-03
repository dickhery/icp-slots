import { useEffect, useRef, useState } from "react";

import { Symbol as SlotSymbol } from "@/backend";
import { Button } from "@/components/ui/button";
import { useSpin, useSpinHistory } from "@/hooks/use-backend";
import { useBalance } from "@/hooks/use-balance";
import { cn } from "@/lib/utils";
import type {
  LineCount,
  ReelGrid,
  SlotSymbol as SlotSymbolType,
} from "@/types";
import { computeWager, formatIcp } from "@/types";
import { LineSelector } from "./LineSelector";
import { Payline } from "./Payline";
import { Reel } from "./Reel";
import { WinCelebration } from "./WinCelebration";

/** Neutral resting grid shown before the first spin. */
const REST_GRID: ReelGrid = [
  [SlotSymbol.cherry, SlotSymbol.lemon, SlotSymbol.bell],
  [SlotSymbol.lemon, SlotSymbol.bell, SlotSymbol.seven],
  [SlotSymbol.bell, SlotSymbol.star, SlotSymbol.bar],
  [SlotSymbol.seven, SlotSymbol.diamond, SlotSymbol.horseshoe],
  [SlotSymbol.cherry, SlotSymbol.lemon, SlotSymbol.diamond],
];

/**
 * The slot cabinet: five reels × three rows, up to nine paylines, and a
 * spin button that charges 0.01 ICP per active line.
 */
export function SlotMachine() {
  const balance = useBalance();
  const spin = useSpin();
  const { data: history = [] } = useSpinHistory();

  const [display, setDisplay] = useState<ReelGrid>(REST_GRID);
  const [activeLines, setActiveLines] = useState<LineCount>(1);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState(false);
  const [payout, setPayout] = useState(0n);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [winTrigger, setWinTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const spinIdRef = useRef(0);
  const [spinKey, setSpinKey] = useState(0);

  const reelDurationMs = 900;
  const reelStaggerMs = 180;
  const reelCount = 5;
  const spinSettleMs = reelDurationMs + (reelCount - 1) * reelStaggerMs + 250;

  const wager = computeWager(activeLines);
  const insufficientFunds = balance.e8s !== null && balance.e8s < wager;

  const handleSpin = async () => {
    if (spinning) return;
    setError(null);
    setWon(false);
    setWinningLines([]);
    setSpinning(true);
    const id = ++spinIdRef.current;
    try {
      const outcome = await spin(activeLines);
      if (id !== spinIdRef.current) return;
      setDisplay(outcome.reels as ReelGrid);
      setSpinKey(id);
      window.setTimeout(() => {
        if (id !== spinIdRef.current) return;
        setSpinning(false);
        const wins = outcome.winningLines.map(Number);
        setWinningLines(wins);
        if (outcome.won && outcome.payout > 0n) {
          setWon(true);
          setPayout(outcome.payout);
          setWinTrigger((n) => n + 1);
        }
      }, spinSettleMs);
    } catch (e) {
      if (id !== spinIdRef.current) return;
      setSpinning(false);
      setError(e instanceof Error ? e.message : "Spin failed");
    }
  };

  useEffect(() => {
    if (!won) return;
    const t = window.setTimeout(() => {
      setWon(false);
      setWinningLines([]);
    }, 2600);
    return () => window.clearTimeout(t);
  }, [won]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 shadow-cabinet backdrop-blur-sm sm:p-8"
      data-ocid="slot.cabinet"
    >
      <WinCelebration payout={payout} trigger={winTrigger} />

      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-glow-primary sm:text-2xl">
            Neon Vault
          </h2>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            5 Reels · 3 Rows · Up to 9 Lines
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

      <div className="mb-4">
        <LineSelector
          value={activeLines}
          onChange={setActiveLines}
          disabled={spinning}
        />
      </div>

      <div
        className="relative rounded-xl border border-border/70 bg-background/60 p-3 vault-grain"
        data-ocid="slot.reel_window"
      >
        <Payline
          activeLines={activeLines}
          winningLines={winningLines}
          celebrating={won}
        />
        <div className="relative z-10 flex justify-center gap-2 sm:gap-3">
          {(["a", "b", "c", "d", "e"] as const).map((reelId, i) => (
            <Reel
              key={reelId}
              index={i}
              targets={
                display[i] as [SlotSymbolType, SlotSymbolType, SlotSymbolType]
              }
              spinning={spinning}
              durationMs={reelDurationMs}
              spinKey={spinKey}
            />
          ))}
        </div>
      </div>

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
            {winningLines.length > 1 ? ` · ${winningLines.length} lines` : ""}
          </p>
        ) : spinning ? (
          <p className="text-sm text-muted-foreground">Spinning…</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {insufficientFunds
              ? "Insufficient balance — top up your wallet to spin."
              : `${formatIcp(wager)} ICP per spin · ${history.length} spins played`}
          </p>
        )}
      </div>

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
          {spinning ? "Spinning…" : `Spin · ${formatIcp(wager)} ICP`}
        </Button>
      </div>
    </div>
  );
}
