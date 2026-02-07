"use client";

import { useTheme } from "@/components/ThemeProvider";
import { IconSun, IconMoon } from "@/components/icons";
import { signOut } from "next-auth/react";

export function ProfilePreferences() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Preferences</h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Personalize how Dispatch looks and feels.
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-lg border border-red-200 dark:border-red-900/50 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all active:scale-95"
        >
          Sign Out
        </button>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Theme</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Switch between light and dark mode.
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 inline-flex items-center gap-2"
        >
          {theme === "dark" ? (
            <>
              <IconSun className="w-4 h-4" />
              Light Mode
            </>
          ) : (
            <>
              <IconMoon className="w-4 h-4" />
              Dark Mode
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Keyboard Shortcuts</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Press <kbd className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] border border-neutral-200 dark:border-neutral-700">?</kbd> to view the full list.
          </p>
        </div>
        <span className="text-xs font-medium text-green-600 dark:text-green-400">Enabled</span>
      </div>
    </div>
  );
}
