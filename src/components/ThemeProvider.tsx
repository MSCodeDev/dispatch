"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    function apply(dark: boolean) {
      document.documentElement.classList.toggle("dark", dark);
    }

    apply(mq.matches);

    function onChange(e: MediaQueryListEvent) {
      apply(e.matches);
    }

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return <>{children}</>;
}
