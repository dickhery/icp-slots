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

let balance = 50_000_000n;
let houseBalance = 12_000_000n;
const SPIN_COST = 1_000_000n;

const REEL_SYMBOLS: Sym[] = [
  Sym.cherry,
  Sym.lemon,
  Sym.bell,
  Sym.bar,
  Sym.seven,
  Sym.diamond,
  Sym.star,
  Sym.horseshoe,
];

function randomGrid(): Sym[][] {
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 3 }, () =>
      REEL_SYMBOLS[Math.floor(Math.random() * REEL_SYMBOLS.length)],
    ),
  );
}

const spinHistory: Array<{
  id: bigint;
  won: boolean;
  reels: Sym[][];
  activeLines: bigint;
  winningLines: bigint[];
  timestamp: bigint;
  wager: bigint;
  payout: bigint;
}> = [
  {
    id: 1n,
    won: true,
    reels: [
      [Sym.seven, Sym.seven, Sym.cherry],
      [Sym.seven, Sym.seven, Sym.lemon],
      [Sym.seven, Sym.bell, Sym.bar],
      [Sym.bar, Sym.cherry, Sym.diamond],
      [Sym.cherry, Sym.lemon, Sym.diamond],
    ],
    activeLines: 1n,
    winningLines: [0n],
    timestamp: BigInt(Date.now() - 60_000) * 1_000_000n,
    wager: SPIN_COST,
    payout: 10_000_000n,
  },
  {
    id: 0n,
    won: false,
    reels: [
      [Sym.cherry, Sym.lemon, Sym.bell],
      [Sym.lemon, Sym.bell, Sym.bar],
      [Sym.bell, Sym.bar, Sym.seven],
      [Sym.bar, Sym.seven, Sym.diamond],
      [Sym.seven, Sym.diamond, Sym.cherry],
    ],
    activeLines: 3n,
    winningLines: [],
    timestamp: BigInt(Date.now() - 120_000) * 1_000_000n,
    wager: SPIN_COST * 3n,
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
  async getDepositAccount() {
    const accountId = new Uint8Array(32);
    accountId.fill(0xab);
    return { accountId, canisterId: SAMPLE_PRINCIPAL };
  },
  async getHouseDepositAccount() {
    const accountId = new Uint8Array(32);
    accountId[0] = 0xcd;
    return { accountId, canisterId: SAMPLE_PRINCIPAL };
  },
  async syncHouseDeposit() {
    houseBalance += 10_000_000n;
    return { credited: 10_000_000n, balance: houseBalance };
  },
  async syncDeposit() {
    balance += 5_000_000n;
    return { credited: 5_000_000n, balance };
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
  async spin(activeLines: bigint) {
    const wager = SPIN_COST * activeLines;
    balance -= wager;
    const reels = randomGrid();
    const won = reels[0][1] === reels[1][1] && reels[1][1] === reels[2][1];
    const payout = won ? 10_000_000n : 0n;
    if (won) balance += payout;
    spinHistory.unshift({
      id: BigInt(spinHistory.length),
      won,
      reels,
      activeLines,
      winningLines: won ? [0n] : [],
      timestamp: BigInt(Date.now()) * 1_000_000n,
      wager,
      payout,
    });
    return {
      won,
      reels,
      activeLines,
      wager,
      payout,
      winningLines: won ? [0n] : [],
    };
  },
  async transfer() {
    return { __kind__: "ok" as const, ok: { amount: 1_000_000n } };
  },
};