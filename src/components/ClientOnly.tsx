"use client";

import { useState, useEffect, type ReactNode } from "react";

/**
 * Renders children only after the component has mounted on the client.
 * Use this to wrap any content that uses client-only libs (e.g. recharts)
 * so the server never tries to run or bundle that code — avoids
 * "localhost is currently unable to handle this request" on dashboard/supervisor/worker.
 */
export default function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
