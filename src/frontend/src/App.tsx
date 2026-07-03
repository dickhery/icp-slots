import { useEffect, useState } from "react";

import { AuthGate } from "@/components/AuthGate";
import { Layout } from "@/components/Layout";
import { useGetOrCreatePlayer } from "@/hooks/use-backend";
import { AdminPage } from "@/pages/AdminPage";
import { SlotPage } from "@/pages/SlotPage";
import { WalletPage } from "@/pages/WalletPage";
import type { RouteId } from "@/types";

/** Resolve the initial route from the URL hash, defaulting to "slot". */
function resolveInitialRoute(): RouteId {
  const hash = window.location.hash.replace("#", "");
  if (hash === "wallet" || hash === "admin" || hash === "slot") return hash;
  return "slot";
}

export default function App() {
  const [route, setRoute] = useState<RouteId>(() =>
    typeof window !== "undefined" ? resolveInitialRoute() : "slot",
  );

  // Ensure a player record exists once authenticated.
  useGetOrCreatePlayer();

  // Keep the URL hash in sync with the active route.
  useEffect(() => {
    if (window.location.hash !== `#${route}`) {
      window.history.replaceState(null, "", `#${route}`);
    }
  }, [route]);

  // Listen for back/forward navigation.
  useEffect(() => {
    const onHashChange = () => setRoute(resolveInitialRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleNavigate = (next: RouteId) => {
    setRoute(next);
    document
      .getElementById("main-content")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AuthGate>
      <Layout activeRoute={route} onNavigate={handleNavigate}>
        <div
          id="main-content"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6"
        >
          {route === "slot" && <SlotPage />}
          {route === "wallet" && <WalletPage />}
          {route === "admin" && <AdminPage />}
        </div>
      </Layout>
    </AuthGate>
  );
}
