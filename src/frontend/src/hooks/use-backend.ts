import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";

import type {
  DepositAccountView,
  HouseStats,
  PlayerView,
  SpinOutcome,
  SpinRecord,
  SyncDepositResult,
  Tokens,
  Transaction,
  TransferResult,
  UserRole,
} from "@/backend";
import type { AccountIdentifier } from "@/backend";

/** Shared actor accessor for the backend canister. */
export function useBackend() {
  const { actor, isFetching } = useActor(createActor);
  return { actor, isFetching };
}

/** Ensure the caller has a player record; returns the player view. */
export function useGetOrCreatePlayer() {
  const { actor, isFetching } = useBackend();
  return useQuery<PlayerView>({
    queryKey: ["player"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getOrCreatePlayer();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Current signed-in player's ICP balance (e8s). */
export function useBalance() {
  const { actor, isFetching } = useBackend();
  return useQuery<Tokens>({
    queryKey: ["balance"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getBalance();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10000,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
}

/** Caller's role (admin / user / guest). */
export function useUserRole() {
  const { actor, isFetching } = useBackend();
  return useQuery<UserRole>({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Whether the caller is an admin. */
export function useIsAdmin() {
  const { actor, isFetching } = useBackend();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

/** The caller's ICP deposit account (for topping up playable balance). */
export function useDepositAccount() {
  const { actor, isFetching } = useBackend();
  return useQuery<DepositAccountView>({
    queryKey: ["depositAccount"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getDepositAccount();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Admin: sync ledger deposits into the house balance. */
export function useSyncHouseDeposit() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useCallback(async (): Promise<SyncDepositResult> => {
    if (!actor) throw new Error("Actor not ready");
    const result = await actor.syncHouseDeposit();
    await queryClient.invalidateQueries({ queryKey: ["houseBalance"] });
    await queryClient.invalidateQueries({ queryKey: ["houseStats"] });
    return result;
  }, [actor, queryClient]);
}

/** Admin: the house vault ICP deposit account. */
export function useHouseDepositAccount() {
  const { actor, isFetching } = useBackend();
  return useQuery<DepositAccountView>({
    queryKey: ["houseDepositAccount"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getHouseDepositAccount();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Sync ledger deposits into the caller's playable balance. */
export function useSyncDeposit() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useCallback(async (): Promise<SyncDepositResult> => {
    if (!actor) throw new Error("Actor not ready");
    const result = await actor.syncDeposit();
    await queryClient.invalidateQueries({ queryKey: ["balance"] });
    await queryClient.invalidateQueries({ queryKey: ["transactionHistory"] });
    return result;
  }, [actor, queryClient]);
}

/** Recent spin history for the signed-in player. */
export function useSpinHistory() {
  const { actor, isFetching } = useBackend();
  return useQuery<SpinRecord[]>({
    queryKey: ["spinHistory"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getSpinHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Recent transaction history for the signed-in player. */
export function useTransactionHistory() {
  const { actor, isFetching } = useBackend();
  return useQuery<Transaction[]>({
    queryKey: ["transactionHistory"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getTransactionHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

/** House-wide statistics (admin view). */
export function useHouseStats() {
  const { actor, isFetching } = useBackend();
  return useQuery<HouseStats>({
    queryKey: ["houseStats"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getHouseStats();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Whether the slot machine is in maintenance mode (query; cheap read). */
export function useMaintenanceMode() {
  const { actor, isFetching } = useBackend();
  return useQuery<boolean>({
    queryKey: ["maintenanceMode"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getMaintenanceMode();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

/** Admin: enable or disable maintenance mode. */
export function useSetMaintenanceMode() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useCallback(
    async (enabled: boolean): Promise<void> => {
      if (!actor) throw new Error("Actor not ready");
      await actor.setMaintenanceMode(enabled);
      await queryClient.invalidateQueries({ queryKey: ["maintenanceMode"] });
    },
    [actor, queryClient],
  );
}

/** House canister ICP balance (admin view). */
export function useHouseBalance() {
  const { actor, isFetching } = useBackend();
  return useQuery<Tokens>({
    queryKey: ["houseBalance"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getHouseBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Refresh player and house caches after a spin resolves in the UI. */
export async function invalidateSpinCaches(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["balance"] }),
    queryClient.invalidateQueries({ queryKey: ["spinHistory"] }),
    queryClient.invalidateQueries({ queryKey: ["transactionHistory"] }),
    queryClient.invalidateQueries({ queryKey: ["houseBalance"] }),
    queryClient.invalidateQueries({ queryKey: ["houseStats"] }),
  ]);
}

/** Optimistically reduce the cached balance when a spin is initiated. */
export function applyOptimisticSpinDebit(
  queryClient: QueryClient,
  debitE8s: Tokens,
): void {
  void queryClient.cancelQueries({ queryKey: ["balance"] });
  queryClient.setQueryData<Tokens>(["balance"], (current) => {
    if (current === undefined) return current;
    const next = current - debitE8s;
    return next < 0n ? 0n : next;
  });
}

/** Spin the reels with the chosen number of active paylines. */
export function useSpin() {
  const { actor } = useBackend();
  return useCallback(
    async (
      activeLines: number,
      betMultiplier: number,
    ): Promise<SpinOutcome> => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.spin(
        BigInt(activeLines),
        BigInt(betMultiplier),
      );
      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }
      return result.ok;
    },
    [actor],
  );
}

/** Transfer ICP out of the player's wallet to an external account. */
export function useTransfer() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useCallback(
    async (to: AccountIdentifier, amount: Tokens): Promise<TransferResult> => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.transfer(to, amount);
      await queryClient.invalidateQueries({ queryKey: ["balance"] });
      await queryClient.invalidateQueries({ queryKey: ["transactionHistory"] });
      return result;
    },
    [actor, queryClient],
  );
}

/** Admin: transfer accumulated house ICP to an external account. */
export function useAdminTransfer() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useCallback(
    async (to: AccountIdentifier, amount: Tokens): Promise<TransferResult> => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.adminTransfer(to, amount);
      await queryClient.invalidateQueries({ queryKey: ["houseBalance"] });
      await queryClient.invalidateQueries({ queryKey: ["houseStats"] });
      return result;
    },
    [actor, queryClient],
  );
}
