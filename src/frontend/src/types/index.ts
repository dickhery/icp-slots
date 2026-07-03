import type {
  AccountIdentifier,
  DepositAccountView,
  HouseStats,
  PlayerView,
  ReelGrid,
  SpinOutcome,
  SpinRecord,
  SyncDepositResult,
  Tokens,
  Transaction,
  TransferResult,
  TxKind,
  UserRole,
} from "@/backend";
import { Symbol as SlotSymbol } from "@/backend";

export type {
  AccountIdentifier,
  DepositAccountView,
  HouseStats,
  PlayerView,
  ReelGrid,
  SpinOutcome,
  SpinRecord,
  SyncDepositResult,
  Tokens,
  Transaction,
  TransferResult,
  TxKind,
  UserRole,
};

/** Format a 32-byte ICP account identifier as a 64-character hex string. */
export function accountIdToHex(accountId: AccountIdentifier): string {
  return Array.from(accountId)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export { SlotSymbol };

/** ICP has 8 decimals — e8s. */
export const ICP_DECIMALS = 8;

/** Per-line spin cost: 0.01 ICP (in e8s). */
export const SPIN_COST_E8S = 1_000_000n;

/** Allowed active payline counts. */
export const LINE_OPTIONS = [1, 3, 5, 9] as const;
export type LineCount = (typeof LINE_OPTIONS)[number];

/** Nine classic paylines (row index per reel column). */
export const PAYLINE_DEFS: readonly (readonly [
  number,
  number,
  number,
  number,
  number,
])[] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
] as const;

export const MAX_PAYLINES = PAYLINE_DEFS.length;

/** Total wager for a spin with the given number of active lines. */
export function computeWager(activeLines: number): bigint {
  return SPIN_COST_E8S * BigInt(activeLines);
}

/** Format an e8s amount as a human-readable ICP string. */
export function formatIcp(e8s: Tokens): string {
  const value = Number(e8s) / 10 ** ICP_DECIMALS;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

/** Shorten a Principal string for display (e.g. "ab12…cd34"). */
export function shortPrincipal(principal: string): string {
  if (principal.length <= 10) return principal;
  return `${principal.slice(0, 4)}…${principal.slice(-4)}`;
}

/** Symbol display metadata for the slot cabinet. */
export interface SymbolMeta {
  glyph: string;
  label: string;
  accent: "primary" | "accent" | "warning" | "success";
}

export const SYMBOL_META: Record<SlotSymbol, SymbolMeta> = {
  cherry: { glyph: "🍒", label: "Cherry", accent: "primary" },
  lemon: { glyph: "🍋", label: "Lemon", accent: "warning" },
  bell: { glyph: "🔔", label: "Bell", accent: "accent" },
  seven: { glyph: "7", label: "Seven", accent: "primary" },
  bar: { glyph: "BAR", label: "Bar", accent: "accent" },
  diamond: { glyph: "💎", label: "Diamond", accent: "success" },
  star: { glyph: "⭐", label: "Star", accent: "warning" },
  horseshoe: { glyph: "H", label: "Horseshoe", accent: "success" },
};

/** Routes available in the app shell. */
export type RouteId = "slot" | "wallet" | "admin";

export interface NavItem {
  id: RouteId;
  label: string;
  href: string;
  adminOnly: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "slot", label: "Slot", href: "#slot", adminOnly: false },
  { id: "wallet", label: "Wallet", href: "#wallet", adminOnly: false },
  { id: "admin", label: "Admin", href: "#admin", adminOnly: true },
];
