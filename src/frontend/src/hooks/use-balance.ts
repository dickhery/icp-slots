import { type Tokens, formatIcp } from "@/types";
import { useBalance as useBalanceQuery } from "./use-backend";

export interface BalanceState {
  /** Raw balance in e8s, or null while loading. */
  e8s: Tokens | null;
  /** Human-readable ICP string (e.g. "1.2500"). */
  formatted: string;
  /** True while the balance is being fetched for the first time. */
  isLoading: boolean;
  /** True if the query is currently refetching. */
  isRefetching: boolean;
  /** True if the last fetch errored. */
  isError: boolean;
}

/** Convenience wrapper around the balance query with formatting. */
export function useBalance(): BalanceState {
  const { data, isLoading, isError, isRefetching } = useBalanceQuery();

  return {
    e8s: data ?? null,
    formatted: data !== undefined ? `${formatIcp(data)} ICP` : "—",
    isLoading,
    isRefetching,
    isError,
  };
}
