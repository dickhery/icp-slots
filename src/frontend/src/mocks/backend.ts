import { Principal } from "@icp-sdk/core/principal";

import type { backendInterface } from "@/backend";
import { Symbol as Sym, UserRole as Role, TxKind } from "@/backend";

/**
 * In-memory mock of the backend canister. Not wired into the app by default
 * (the app uses @caffeineai/core-infrastructure's useActor/useInternetIdentity,
 * which do not read VITE_USE_MOCK). Kept for developer iteration: import this
 * object directly in tests or a throwaway dev harness to exercise the UI
 * without a live canister.
 */

const SAMPLE_PRINCIPAL = Principal.fromText(
  "2vxsx-fae",
) as unknown as backendInterface extends never ? never : Principal;

let balance = 50_000_000n; // 0.5 ICP in e8s
let houseBalance = 12_000_000n; // 0.12 ICP
const SPIN_COST = 1_000_000n; // 0.01 ICP

const REEL_SYMBOLS: Sym[] = [
  Sym.cherry,
  Sym.lemon,
  Sym.bell,
  Sym.bar,
  Sym.seven,
  Sym.diamond,
];

function randomSymbols(): Sym[] {
  return Array.from({ length: 5 }, () =>
    REEL_SYMBOLS[Math.floor(Math.random() * REEL_SYMBOLS.length)],
  );
}

const spinHistory: Array<{
  id: bigint;
  won: boolean;
  symbols: Sym[];
  timestamp: bigint;
  wager: bigint;
  payout: bigint;
}> = [
  {
    id: 1n,
    won: true,
    symbols: [Sym.seven, Sym.seven, Sym.seven, Sym.bar, Sym.cherry],
    timestamp: BigInt(Date.now() - 60_000) * 1_000_000n,
    wager: SPIN_COST,
    payout: 10_000_000n,
  },
  {
    id: 0n,
    won: false,
    symbols: [Sym.cherry, Sym.lemon, Sym.bell, Sym.bar, Sym.diamond],
    timestamp: BigInt(Date.now() - 120_000) * 1_000_000n,
    wager: SPIN_COST,
    payout: 0n,
  },
];

const transactions: Array<{
  id: bigint;
  kind: TxKind;
  counterparty?: Uint8Array;
  timestamp: bigint;
  amount: bigint;
}> = [
  {
    id: 1n,
    kind: TxKind.win,
    timestamp: BigInt(Date.now() - 60_000) * 1_000_000n,
    amount: 10_000_000n,
  },
  {
    id: 0n,
    kind: TxKind.spinCost,
    timestamp: BigInt(Date.now() - 120_000) * 1_000_000n,
    amount: SPIN_COST,
  },
];

export const mockBackend: backendInterface = {
  // Stable-state inspection helpers (data-viewer / admin introspection).
  // Return empty records so any dev harness that calls them gets a safe shape.
  async __accessControlState() {
    return {};
  },
  async __aggregateStats() {
    return {};
  },
  async __counters() {
    return {};
  },
  async __houseBalance() {
    return houseBalance;
  },
  async __players() {
    return [];
  },
  async __spinHistory() {
    return spinHistory;
  },
  async __transactions() {
    return transactions;
  },
  async _initialize_access_control() {
    return undefined;
  },
  async _internet_identity_sign_in_finish() {
    return { __kind__: "ok" as const, ok: null };
  },
  async _internet_identity_sign_in_start() {
    return new Uint8Array();
  },
  async adminTransfer() {
    return { __kind__: "ok" as const, ok: { amount: 1_000_000n } };
  },
  async assignCallerUserRole() {
    return undefined;
  },
  async getBalance() {
    return balance;
  },
  async getCallerUserRole() {
    return Role.user;
  },
  async getHouseBalance() {
    return houseBalance;
  },
  async getHouseStats() {
    return {
      totalWagered: 4_000_000n,
      totalPaidOut: 10_000_000n,
      totalSpins: 4n,
      houseRetained: 3_000_000n,
      houseBalance,
    };
  },
  async getOrCreatePlayer() {
    return { id: SAMPLE_PRINCIPAL, balance };
  },
  async getSpinHistory() {
    return spinHistory;
  },
  async getTransactionHistory() {
    return transactions;
  },
  async isCallerAdmin() {
    return false;
  },
  async spin() {
    balance -= SPIN_COST;
    const symbols = randomSymbols();
    const won = symbols.every((s) => s === symbols[0]);
    const payout = won ? 10_000_000n : 0n;
    if (won) balance += payout;
    spinHistory.unshift({
      id: BigInt(spinHistory.length),
      won,
      symbols,
      timestamp: BigInt(Date.now()) * 1_000_000n,
      wager: SPIN_COST,
      payout,
    });
    return { won, symbols, payout };
  },
  async transfer() {
    return { __kind__: "ok" as const, ok: { amount: 1_000_000n } };
  },
};
