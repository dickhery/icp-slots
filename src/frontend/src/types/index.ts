import type {
  AccountIdentifier,
  HouseStats,
  PlayerView,
  SpinOutcome,
  SpinRecord,
  Tokens,
  Transaction,
  TransferResult,
  TxKind,
  UserRole,
} from "@/backend";
import { Symbol as SlotSymbol } from "@/backend";

export type {
  AccountIdentifier,
  HouseStats,
  PlayerView,
  SpinOutcome,
  SpinRecord,
  Tokens,
  Transaction,
  TransferResult,
  TxKind,
  UserRole,
};

export { SlotSymbol };

/** ICP has 8 decimals — e8s. */
export const ICP_DECIMALS = 8;

/** Spin cost fixed at 0.01 ICP per spin (in e8s). */
export const SPIN_COST_E8S = 1_000_000n;

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
