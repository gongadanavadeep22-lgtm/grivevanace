"use client";

import { useEffect, useState, useRef } from "react";
import type { DashboardData } from "./DashboardContent";
import DashboardContent from "./DashboardContent";
import ClientOnly from "@/components/ClientOnly";
import { useNotifications } from "@/lib/notifications";

const Spinner = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" style={{ boxShadow: "0 0 8px rgba(192, 192, 192, 0.25)" }} />
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { add: addNotification } = useNotifications();
  const notified = useRef(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setData(d);
        if (d.breachedCount > 0 && !notified.current) {
          addNotification(`${d.breachedCount} grievance(s) breached SLA`);
          notified.current = true;
        }
      })
      .catch((e) => setError(e?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [addNotification]);

  const exportReport = () => {
    if (!data) return;
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grievance-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const retry = () => {
    setError(null);
    setLoading(true);
    setData(null);
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e?.message ?? "Failed"))
      .finally(() => setLoading(false));
  };

  if (loading) return <Spinner />;

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-slate-400">{error || "Failed to load dashboard."}</p>
        <button
          onClick={retry}
          className="mt-4 rounded-lg px-4 py-2 text-sm text-black hover:opacity-90"
          style={{ background: "linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 100%)", boxShadow: "0 0 10px rgba(192, 192, 192, 0.3)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ClientOnly fallback={<Spinner />}>
      <DashboardContent data={data} onExport={exportReport} />
    </ClientOnly>
  );
}
