import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";
import { BrandMark } from "@/components/BrandMark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const { error } = await searchParams;
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.3.0";

  const errorMessages: Record<string, string> = {
    AccessDenied: "Access denied. Sign-in was rejected.",
    Default: "Something went wrong. Please try again.",
  };

  return (
    <main id="login-page-root" className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: "32px 32px",
      }} />

      <div id="login-shell" className="relative w-full max-w-sm animate-fade-in-up">
        {/* Card */}
        <div id="login-card" className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-xl space-y-6 text-center">
          {/* Logo */}
          <div>
            <BrandMark className="mb-4" />
            <h1 className="text-2xl font-bold tracking-tight dark:text-white">Dispatch</h1>
            <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Sign in to continue</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
              {errorMessages[error] || errorMessages.Default}
            </div>
          )}

          <div className="space-y-3">
            <LoginForm />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 mt-4">
          Personal task management · v{appVersion}
        </p>
      </div>
    </main>
  );
}
