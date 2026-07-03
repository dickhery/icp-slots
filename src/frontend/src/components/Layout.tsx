import type { ReactNode } from "react";

import type { RouteId } from "@/types";
import { Footer } from "./Footer";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
  activeRoute: RouteId;
  onNavigate: (route: RouteId) => void;
}

/**
 * App shell: elevated card header, background main content, muted footer.
 * Each structural zone has a visually distinct background treatment.
 */
export function Layout({ children, activeRoute, onNavigate }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header activeRoute={activeRoute} onNavigate={onNavigate} />
      <main className="flex flex-1 flex-col bg-background">{children}</main>
      <Footer />
    </div>
  );
}
