"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function NavBar() {
  const { data: session, status } = useSession();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold">
          Dispatch
        </Link>
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          ) : session?.user ? (
            <>
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-7 w-7 rounded-full"
                />
              )}
              <span className="text-sm text-gray-700">
                {session.user.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
