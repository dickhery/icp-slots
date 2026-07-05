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

/** Normalize candid account identifier bytes to a 32-byte Uint8Array. */
export function normalizeAccountId(accountId: AccountIdentifier): Uint8Array {
  const bytes =
    accountId instanceof Uint8Array
      ? accountId
      : Uint8Array.from(accountId as ArrayLike<number>);
  if (bytes.length !== 32) {
    throw new Error(
      `Invalid account identifier length: ${bytes.length} (expected 32)`,
    );
  }
  return bytes;
}

/** Format a 32-byte ICP account identifier as a 64-character hex string. */
export function accountIdToHex(accountId: AccountIdentifier): string {
  return Array.from(normalizeAccountId(accountId))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export { SlotSymbol };

/** ICP has 8 decimals — e8s. */
export const ICP_DECIMALS = 8;

/** Per-line spin cost: 0.01 ICP (in e8s). */
export const SPIN_COST_E8S = 1_000_000n;

/** Current ICP ledger transfer fee; the backend handles runtime fee changes. */
export const ICP_LEDGER_FEE_E8S = 10_000n;

/** Allowed active payline counts. */
export const LINE_OPTIONS = [1, 3, 5, 9] as const;
export type LineCount = (typeof LINE_OPTIONS)[number];

/** Per-line bet multipliers (1× = 0.01 ICP, 5× = 0.05 ICP). */
export const BET_MULTIPLIER_OPTIONS = [1, 2, 3, 4, 5] as const;
export type BetMultiplier = (typeof BET_MULTIPLIER_OPTIONS)[number];
export const MAX_BET_MULTIPLIER = 5;

/** Display colors for each payline overlay (line 1–9). */
export const PAYLINE_COLORS: readonly string[] = [
  "oklch(0.82 0.16 80)",
  "oklch(0.7 0.18 150)",
  "oklch(0.65 0.2 250)",
  "oklch(0.72 0.18 305)",
  "oklch(0.78 0.15 70)",
  "oklch(0.68 0.22 25)",
  "oklch(0.75 0.14 195)",
  "oklch(0.7 0.16 45)",
  "oklch(0.66 0.14 130)",
] as const;

/** Short labels shown when a payline is highlighted. */
export const PAYLINE_LABELS: readonly string[] = [
  "Line 1 · Middle",
  "Line 2 · Top",
  "Line 3 · Bottom",
  "Line 4 · V Down",
  "Line 5 · V Up",
  "Line 6 · W Low",
  "Line 7 · W High",
  "Line 8 · Zig Up",
  "Line 9 · Zig Down",
] as const;

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

/** Per-line wager for the chosen multiplier. */
export function computeLineBet(betMultiplier: number): bigint {
  return SPIN_COST_E8S * BigInt(betMultiplier);
}

/** Total wager for a spin with active lines and per-line multiplier. */
export function computeWager(activeLines: number, betMultiplier = 1): bigint {
  return SPIN_COST_E8S * BigInt(activeLines) * BigInt(betMultiplier);
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
  horseshoe: { glyph: "⌒", label: "Horseshoe", accent: "success" },
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
