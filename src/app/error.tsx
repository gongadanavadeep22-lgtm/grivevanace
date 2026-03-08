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
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-8 text-white">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-center text-slate-400">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg px-4 py-2 text-sm font-medium text-black hover:opacity-90"
        style={{ background: "linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 100%)", boxShadow: "0 0 10px rgba(192, 192, 192, 0.3)" }}
      >
        Try again
      </button>
    </div>
  );
}
