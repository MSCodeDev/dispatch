"use client";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        className="w-16 h-16"
      >
        <defs>
          <linearGradient
            id="dispatch-bolt-bg"
            x1="0%"
            x2="100%"
            y1="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="55%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="16"
          fill="url(#dispatch-bolt-bg)"
        />
        <path
          d="M23 10 11 34h16l-2 20 28-33H34l3-11z"
          fill="#fff"
          stroke="#fff"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        You&apos;re offline
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400 max-w-sm">
        Dispatch couldn&apos;t connect to the server. Check your internet
        connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
