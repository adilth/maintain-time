"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error caught by error boundary:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-2xl font-semibold">Something went wrong!</h2>
        <p className="text-foreground/60">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-md bg-foreground text-background hover:opacity-90"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 rounded-md border hover:bg-black/5 dark:hover:bg-white/10"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
