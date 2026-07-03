import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type {
  HouseStats,
  PlayerView,
  SpinOutcome,
  SpinRecord,
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
    refetchInterval: 15000,
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

/** Spin the reels. Invalidates balance + history on success. */
export function useSpin() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useCallback(async (): Promise<SpinOutcome> => {
    if (!actor) throw new Error("Actor not ready");
    const outcome = await actor.spin();
    await queryClient.invalidateQueries({ queryKey: ["balance"] });
    await queryClient.invalidateQueries({ queryKey: ["spinHistory"] });
    await queryClient.invalidateQueries({ queryKey: ["transactionHistory"] });
    return outcome;
  }, [actor, queryClient]);
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
