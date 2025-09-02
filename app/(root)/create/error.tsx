/**
 * error.tsx - Route-level error boundary for /create
 *
 * Purpose: Handles rendering errors for the /create route and its subroutes in Next.js App Router.
 * Usage: Automatically displayed when an error occurs during rendering, data fetching, or loading in /create.
 * Importance: Provides user-friendly error feedback and a retry button for recovery. Do not remove unless you want to lose custom error handling for this route.
 */

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
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-full flex-col items-center justify-center">
      <h2 className="text-center">Something went wrong!</h2>
      <button
        className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  );
}
