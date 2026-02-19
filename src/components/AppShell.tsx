"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import { SearchOverlay } from "@/components/SearchOverlay";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ShortcutHelpOverlay } from "@/components/ShortcutHelpOverlay";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status, update } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const refreshAttemptedRef = useRef(false);
  const initialRouteRef = useRef(true);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    refreshAttemptedRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/login") return;
    if (status !== "unauthenticated" || refreshAttemptedRef.current) return;
    refreshAttemptedRef.current = true;
    void update();
  }, [pathname, status, update]);

  useEffect(() => {
    if (initialRouteRef.current) {
      initialRouteRef.current = false;
      return;
    }

    setRouteLoading(true);
    const timer = setTimeout(() => setRouteLoading(false), 420);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Render login page without the app shell.
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className={`flex h-screen ${isMobile ? "flex-col" : ""}`}>
      <div
        className={`pointer-events-none fixed left-0 top-0 z-[120] h-0.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-500 transition-all duration-500 ${
          routeLoading ? "w-full opacity-100" : "w-0 opacity-0"
        }`}
      />
      <KeyboardShortcuts
        onSearchOpen={() => setSearchOpen(true)}
        onShortcutHelp={() => setShortcutHelpOpen(true)}
      />
      <Suspense>
        <Sidebar
          onSearchOpen={() => setSearchOpen(true)}
          onShortcutHelp={() => setShortcutHelpOpen(true)}
        />
      </Suspense>
      <main className={`app-main-scrollbar flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 ${isMobile ? "pb-16" : ""}`}>
        {children}
      </main>
      {searchOpen && (
        <SearchOverlay onClose={() => setSearchOpen(false)} />
      )}
      {shortcutHelpOpen && (
        <ShortcutHelpOverlay onClose={() => setShortcutHelpOpen(false)} />
      )}
    </div>
  );
}
