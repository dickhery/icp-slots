import { LoaderCircle, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Symbol as SlotSymbol } from "@/backend";
import { Button } from "@/components/ui/button";
import { useSpin, useSpinHistory } from "@/hooks/use-backend";
import { useBalance } from "@/hooks/use-balance";
import { useGameAudio } from "@/hooks/use-game-audio";
import { cn } from "@/lib/utils";
import type {
  LineCount,
  ReelGrid,
  SlotSymbol as SlotSymbolType,
} from "@/types";
import { ICP_LEDGER_FEE_E8S, computeWager, formatIcp } from "@/types";
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

type SpinPhase = "idle" | "paying" | "spinning";

/**
 * The slot cabinet: five reels × three rows, up to nine paylines, and a
 * spin button that charges 0.01 ICP per active line.
 */
export function SlotMachine() {
  const balance = useBalance();
  const spin = useSpin();
  const { data: history = [] } = useSpinHistory();
  const { muted, playPayment, playWin, toggleMuted } = useGameAudio();

  const [display, setDisplay] = useState<ReelGrid>(REST_GRID);
  const [activeLines, setActiveLines] = useState<LineCount>(1);
  const [spinPhase, setSpinPhase] = useState<SpinPhase>("idle");
  const [won, setWon] = useState(false);
  const [payout, setPayout] = useState(0n);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [winTrigger, setWinTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const spinIdRef = useRef(0);
  const spinLockedRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);

  const reelDurationMs = 900;
  const reelStaggerMs = 180;
  const reelCount = 5;
  const spinSettleMs = reelDurationMs + (reelCount - 1) * reelStaggerMs + 250;

  const wager = computeWager(activeLines);
  const totalDebit = wager + ICP_LEDGER_FEE_E8S;
  const insufficientFunds = balance.e8s !== null && balance.e8s < totalDebit;
  const canSpin =
    balance.e8s !== null &&
    balance.e8s >= totalDebit &&
    !balance.isLoading &&
    !balance.isError;
  const paying = spinPhase === "paying";
  const spinning = spinPhase === "spinning";
  const busy = spinPhase !== "idle";

  const handleSpin = async () => {
    if (spinLockedRef.current || !canSpin) return;
    spinLockedRef.current = true;
    setError(null);
    setWon(false);
    setWinningLines([]);
    setSpinPhase("paying");
    playPayment();
    const id = ++spinIdRef.current;
    try {
      const outcome = await spin(activeLines);
      if (id !== spinIdRef.current) return;

      setDisplay(outcome.reels as ReelGrid);
      setSpinPhase("spinning");

      settleTimerRef.current = window.setTimeout(() => {
        if (id !== spinIdRef.current) return;
        setSpinPhase("idle");
        spinLockedRef.current = false;
        const wins = outcome.winningLines.map(Number);
        setWinningLines(wins);
        if (outcome.won && outcome.payout > 0n) {
          setWon(true);
          setPayout(outcome.payout);
          setWinTrigger((n) => n + 1);
          playWin(outcome.payout);
        }
      }, spinSettleMs);
    } catch (e) {
      if (id !== spinIdRef.current) return;
      setSpinPhase("idle");
      spinLockedRef.current = false;
      setError(e instanceof Error ? e.message : "Spin failed");
    }
  };

  useEffect(() => {
    return () => {
      spinIdRef.current += 1;
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

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
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 shadow-cabinet backdrop-blur-sm transition-smooth sm:p-8",
        busy && "border-accent/60 shadow-gold",
      )}
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
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleMuted}
            aria-label={muted ? "Turn game sounds on" : "Mute game sounds"}
            aria-pressed={muted}
            title={muted ? "Sound off" : "Sound on"}
            data-ocid="slot.sound_toggle"
            className="size-10 rounded-full border border-border/60 bg-background/50 text-muted-foreground hover:text-accent"
          >
            {muted ? (
              <VolumeX className="size-4" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </Button>
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
      </div>

      <div className="mb-4">
        <LineSelector
          value={activeLines}
          onChange={setActiveLines}
          disabled={busy}
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
            />
          ))}
        </div>
        {paying ? (
          <div
            className="absolute inset-0 z-20 grid place-items-center overflow-hidden rounded-xl bg-background/90 sm:bg-background/80 sm:backdrop-blur-sm"
            data-ocid="slot.payment_pending"
            aria-live="polite"
          >
            <div className="absolute inset-y-0 w-1/2 animate-payment-scan bg-gradient-to-r from-transparent via-accent/10 to-transparent" />
            <div className="relative animate-payment-ready rounded-2xl border border-accent/50 bg-card/90 px-7 py-5 text-center shadow-gold">
              <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full border border-accent/40 bg-accent/10 text-accent">
                <LoaderCircle className="size-5 animate-spin" />
              </span>
              <p className="font-display text-base font-bold uppercase tracking-[0.18em] text-accent">
                Starting your spin
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Securing {formatIcp(totalDebit)} ICP total (wager + fee)
              </p>
            </div>
          </div>
        ) : null}
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
        ) : paying ? (
          <p className="text-sm font-medium text-accent" aria-live="polite">
            Payment in progress — your spin is locked in…
          </p>
        ) : spinning ? (
          <p className="text-sm font-medium text-accent">Reels in motion…</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {balance.isError
              ? "Balance unavailable — refresh before spinning."
              : insufficientFunds
                ? "Insufficient balance — top up your wallet to spin."
                : `${formatIcp(wager)} ICP per spin + ${formatIcp(ICP_LEDGER_FEE_E8S)} fee · ${history.length} spins played`}
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          type="button"
          size="lg"
          onClick={handleSpin}
          disabled={busy || !canSpin}
          aria-busy={busy}
          data-ocid="slot.spin_button"
          className={cn(
            "h-14 min-w-56 rounded-full px-10 font-display text-lg font-bold uppercase tracking-wider",
            "bg-primary text-primary-foreground shadow-primary transition-smooth",
            "hover:scale-[1.02] hover:shadow-gold-lg disabled:hover:scale-100 disabled:hover:shadow-primary",
            !busy && canSpin && "animate-pulse-glow",
          )}
        >
          {busy ? <LoaderCircle className="mr-2 size-5 animate-spin" /> : null}
          {paying
            ? "Starting spin…"
            : spinning
              ? "Reels spinning…"
              : `Spin · ${formatIcp(wager)} ICP`}
        </Button>
      </div>
    </div>
  );
}
