import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMemo } from "react";

import { useUserRole } from "./use-backend";

export interface AuthState {
  /** True when the user holds a valid, non-anonymous identity. */
  isAuthenticated: boolean;
  /** True while II is restoring an identity from local storage. */
  isInitializing: boolean;
  /** True while an interactive login is in progress. */
  isLoggingIn: boolean;
  /** True if the last login attempt errored. */
  isLoginError: boolean;
  /** The principal string of the signed-in user, or null. */
  principal: string | null;
  /** Caller's role on the backend (admin / user / guest). */
  role: "admin" | "user" | "guest" | null;
  /** Convenience: is the caller an admin? */
  isAdmin: boolean;
  /** Begin the Internet Identity login flow. */
  login: () => void;
  /** Clear the identity (sign out). */
  signOut: () => void;
}

/** Single source of truth for authentication + caller role. */
export function useAuth(): AuthState {
  const {
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginError,
    identity,
    login,
    clear,
  } = useInternetIdentity();
  const { data: role } = useUserRole();

  return useMemo<AuthState>(() => {
    const principalStr = identity?.getPrincipal().toString() ?? null;
    const resolvedRole = role ?? null;
    return {
      isAuthenticated,
      isInitializing,
      isLoggingIn,
      isLoginError,
      principal: principalStr,
      role: resolvedRole,
      isAdmin: resolvedRole === "admin",
      login,
      signOut: clear,
    };
  }, [
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginError,
    identity,
    role,
    login,
    clear,
  ]);
}
