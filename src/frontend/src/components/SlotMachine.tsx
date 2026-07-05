import { LoaderCircle, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Symbol as SlotSymbol } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  applyOptimisticSpinDebit,
  invalidateSpinCaches,
  useSpin,
  useSpinHistory,
} from "@/hooks/use-backend";
import { useBalance } from "@/hooks/use-balance";
import { useGameAudio } from "@/hooks/use-game-audio";
import { cn } from "@/lib/utils";
import type {
  BetMultiplier,
  LineCount,
  ReelGrid,
  SlotSymbol as SlotSymbolType,
} from "@/types";
import { ICP_LEDGER_FEE_E8S, computeWager, formatIcp } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { BetMultiplierSelector } from "./BetMultiplierSelector";
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
  const queryClient = useQueryClient();
  const balance = useBalance();
  const spin = useSpin();
  const { data: history = [] } = useSpinHistory();
  const {
    muted,
    playPayment,
    playReelSpin,
    playReelStop,
    playWin,
    stopReelSpin,
    toggleMuted,
  } = useGameAudio();

  const [display, setDisplay] = useState<ReelGrid>(REST_GRID);
  const [activeLines, setActiveLines] = useState<LineCount>(1);
  const [betMultiplier, setBetMultiplier] = useState<BetMultiplier>(1);
  const [spinPhase, setSpinPhase] = useState<SpinPhase>("idle");
  const [won, setWon] = useState(false);
  const [payout, setPayout] = useState(0n);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [winTrigger, setWinTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const spinIdRef = useRef(0);
  const spinLockedRef = useRef(false);
  const stoppedReelsRef = useRef(new Set<number>());
  const settleTimerRef = useRef<number | null>(null);
  const reelGridRef = useRef<HTMLDivElement>(null);

  const reelDurationMs = 900;
  const reelStaggerMs = 140;
  const reelDelayMs = 75;
  const reelCount = 5;
  const spinSettleMs =
    reelDurationMs + (reelCount - 1) * (reelStaggerMs + reelDelayMs) + 140;

  const wager = computeWager(activeLines, betMultiplier);
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

  const handleReelStop = useCallback(
    (index: number) => {
      if (stoppedReelsRef.current.has(index)) return;
      stoppedReelsRef.current.add(index);
      playReelStop();
      if (stoppedReelsRef.current.size === reelCount) stopReelSpin();
    },
    [playReelStop, stopReelSpin],
  );

  const handleSpin = async () => {
    if (spinLockedRef.current || !canSpin) return;
    spinLockedRef.current = true;
    setError(null);
    setWon(false);
    setWinningLines([]);
    stoppedReelsRef.current.clear();
    applyOptimisticSpinDebit(queryClient, totalDebit);
    setSpinPhase("paying");
    playPayment();
    playReelSpin();
    const id = ++spinIdRef.current;
    try {
      const outcome = await spin(activeLines, betMultiplier);
      if (id !== spinIdRef.current) return;

      setDisplay(outcome.reels as ReelGrid);
      setSpinPhase("spinning");

      settleTimerRef.current = window.setTimeout(() => {
        if (id !== spinIdRef.current) return;
        void invalidateSpinCaches(queryClient).finally(() => {
          if (id !== spinIdRef.current) return;
          stopReelSpin();
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
        });
      }, spinSettleMs);
    } catch (e) {
      if (id !== spinIdRef.current) return;
      void invalidateSpinCaches(queryClient).finally(() => {
        if (id !== spinIdRef.current) return;
        stopReelSpin();
        setSpinPhase("idle");
        spinLockedRef.current = false;
        setError(e instanceof Error ? e.message : "Spin failed");
      });
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
        "neon-panel relative overflow-hidden rounded-2xl border border-border/60 bg-card/65 p-3 shadow-cabinet backdrop-blur-sm transition-smooth sm:p-5 md:p-8",
        busy && "border-accent/70 shadow-gold",
      )}
      data-ocid="slot.cabinet"
    >
      <WinCelebration payout={payout} trigger={winTrigger} />
      <div className="pointer-events-none absolute -left-20 top-1/3 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

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

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <LineSelector
          value={activeLines}
          betMultiplier={betMultiplier}
          onChange={setActiveLines}
          disabled={busy}
        />
        <BetMultiplierSelector
          value={betMultiplier}
          onChange={setBetMultiplier}
          disabled={busy}
        />
      </div>

      <div
        className="neon-reel-frame relative overflow-hidden rounded-xl border border-border/70 bg-background/70 p-1.5 vault-grain sm:p-3"
        data-ocid="slot.reel_window"
      >
        <div
          ref={reelGridRef}
          className="relative mx-auto w-full max-w-full"
          aria-busy={busy}
        >
          <Payline
            containerRef={reelGridRef}
            spinPhase={spinPhase}
            activeLines={activeLines}
            winningLines={winningLines}
            celebrating={won}
          />
          <div className="relative z-10 grid w-full grid-cols-5 gap-[clamp(0.125rem,1.2vw,0.75rem)]">
            {(["a", "b", "c", "d", "e"] as const).map((reelId, i) => (
              <Reel
                key={reelId}
                index={i}
                targets={
                  display[i] as [SlotSymbolType, SlotSymbolType, SlotSymbolType]
                }
                phase={spinPhase}
                durationMs={reelDurationMs}
                staggerMs={reelStaggerMs}
                delayMs={reelDelayMs}
                onStop={handleReelStop}
              />
            ))}
          </div>
        </div>
        {paying ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-3"
            data-ocid="slot.payment_pending"
            aria-live="polite"
          >
            <div className="relative flex animate-payment-ready items-center gap-2 overflow-hidden rounded-full border border-accent/50 bg-card/95 px-4 py-2 shadow-gold backdrop-blur-md">
              <div className="absolute inset-y-0 w-1/2 animate-payment-scan bg-gradient-to-r from-transparent via-accent/15 to-transparent" />
              <LoaderCircle className="relative size-4 animate-spin text-accent" />
              <p className="relative font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent sm:text-xs">
                Securing {formatIcp(totalDebit)} ICP · reels live
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
            "neon-spin-button bg-primary text-primary-foreground shadow-primary transition-smooth",
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
