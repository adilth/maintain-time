"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex items-center justify-center min-h-screen p-4 bg-white dark:bg-black">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="text-6xl">💥</div>
            <h2 className="text-2xl font-semibold">Critical Error</h2>
            <p className="text-gray-600 dark:text-gray-400">
              A critical error occurred. Please refresh the page.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
              >
                Try again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
