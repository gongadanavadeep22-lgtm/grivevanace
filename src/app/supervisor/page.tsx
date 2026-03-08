"use client";

import { useEffect, useState } from "react";
import ClientOnly from "@/components/ClientOnly";
import { useNotifications } from "@/lib/notifications";
import WorkerWorkloadChart from "./WorkerWorkloadChart";
import VizagMap from "./VizagMap";

interface QueueItem {
  id: string;
  ticketId: string;
  description: string;
  department: string;
  category: string;
  status: string;
  slaDueAt: string | null;
  breached: boolean;
  atRisk: boolean;
  minutesRemaining: number | null;
  assignedTo: { id: string; name: string; email: string } | null;
  createdAt: string;
}

interface LocationZone {
  location: string;
  count: number;
  zone: "red" | "orange" | "green";
}

interface QueueData {
  queue: QueueItem[];
  breachList: QueueItem[];
  atRiskList: QueueItem[];
  locationZones?: LocationZone[];
}

interface Worker {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  openTickets: number;
}

export default function SupervisorPage() {
  const [data, setData] = useState<QueueData | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Record<string, string>>({});

  const { add: addNotification } = useNotifications();

  const load = () => {
    setError(null);
    setLoading(true);
    const q = department ? `?department=${encodeURIComponent(department)}` : "";
    Promise.all([
      fetch(`/api/supervisor/queue${q}`).then((r) => r.json()),
      fetch("/api/workers").then((r) => r.json()),
    ])
      .then(([queueData, workersList]) => {
        const queue = Array.isArray(queueData?.queue) ? queueData.queue : [];
        const breachList = Array.isArray(queueData?.breachList) ? queueData.breachList : [];
        const atRiskList = Array.isArray(queueData?.atRiskList) ? queueData.atRiskList : [];
        const locationZones = Array.isArray(queueData?.locationZones) ? queueData.locationZones : [];
        setData({ queue, breachList, atRiskList, locationZones });
        setWorkers(Array.isArray(workersList) ? workersList : []);
        if (breachList.length > 0)
          addNotification(`${breachList.length} ticket(s) breached SLA`);
      })
      .catch((e) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [department]);

  const assign = async (grievanceId: string) => {
    const workerId = selectedWorker[grievanceId];
    if (!workerId) return;
    setAssigning(grievanceId);
    try {
      await fetch("/api/supervisor/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grievanceId, workerId }),
      });
      setSelectedWorker((s) => ({ ...s, [grievanceId]: "" }));
      load();
    } finally {
      setAssigning(null);
    }
  };

  const workloadData = workers
    .filter((w) => !department || w.department === department)
    .map((w) => ({ name: w.name.split(" ")[0], openTickets: w.openTickets, department: w.department }));

  const spinner = (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" style={{ boxShadow: "0 0 8px rgba(192, 192, 192, 0.25)" }} />
    </div>
  );

  if (loading && !data && !error) return spinner;

  if (error && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-slate-400">{error}</p>
        <button
          onClick={load}
          className="mt-4 rounded-lg px-4 py-2 text-sm text-black hover:opacity-90"
          style={{ background: "linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 100%)", boxShadow: "0 0 16px rgba(192, 192, 192, 0.3)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ClientOnly fallback={spinner}>
    <div className="min-h-screen gradient-mesh">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#e8e8e8", textShadow: "0 0 12px rgba(192, 192, 192, 0.35)" }}>Supervisor Queue</h1>
          <p className="mt-1 text-slate-400">Assign tickets and monitor SLA breaches</p>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-800/50 px-4 py-2.5 text-white focus:border-slate-400/50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
          >
            <option value="">All departments</option>
            <option value="water">Water</option>
            <option value="roads">Roads</option>
            <option value="sanitation">Sanitation</option>
            <option value="general">General</option>
          </select>
          <button
            onClick={load}
            className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/15"
          >
            Refresh
          </button>
        </div>

        {/* Real map: Vizag (Visakhapatnam) — Gajuwaka, RK Beach, MVP Colony, Srinagar, Nad Junction. Red = high, Orange = medium, Green = low. */}
        <section className="mb-10 rounded-2xl border border-white/5 bg-[#0a0a0a] p-6">
          <h2 className="mb-1 text-xl font-semibold" style={{ color: "#e8e8e8" }}>Map View · Vizag (Visakhapatnam)</h2>
          <p className="mb-4 text-sm text-slate-400">Complaints by area. Red = high, Orange = medium, Green = low. Hover on circles for details.</p>
          <div className="mb-4 flex flex-wrap gap-4 rounded-lg bg-slate-800/50 px-4 py-3">
            <span className="flex items-center gap-2 text-sm">
              <span className="h-4 w-4 rounded border border-red-500/50 bg-red-500/30" /> Red — high complaints
            </span>
            <span className="flex items-center gap-2 text-sm">
              <span className="h-4 w-4 rounded border border-amber-500/50 bg-amber-500/30" /> Orange — medium
            </span>
            <span className="flex items-center gap-2 text-sm">
              <span className="h-4 w-4 rounded border border-slate-400/50 bg-slate-500/30" /> Silver — low
            </span>
          </div>
          <div className="mb-4">
            <VizagMap locationZones={data?.locationZones ?? []} />
          </div>
          {data?.locationZones && data.locationZones.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.locationZones.filter((z) => z.location !== "Unspecified").map((z) => (
                <div
                  key={z.location}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    z.zone === "red"
                      ? "border-red-500/40 bg-red-500/20 text-red-100"
                      : z.zone === "orange"
                        ? "border-amber-500/40 bg-amber-500/20 text-amber-100"
                        : "border-slate-400/40 bg-slate-500/20 text-slate-200"
                  }`}
                >
                  <span className="font-medium">{z.location}</span> · <span>{z.count}</span> complaint{z.count !== 1 ? "s" : ""}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Workload viz - loaded client-only to avoid recharts server issues */}
        <WorkerWorkloadChart data={workloadData} />

        {data && (
          <>
            {/* Alerts */}
            {data.breachList.length > 0 && (
              <div className="mb-6 flex items-center gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4">
                <span className="text-3xl">⚠</span>
                <div>
                  <p className="font-semibold text-red-300">
                    {data.breachList.length} ticket{data.breachList.length !== 1 ? "s" : ""} breached SLA
                  </p>
                  <p className="text-sm text-red-400/80">Assign or escalate immediately</p>
                </div>
              </div>
            )}

            {data.atRiskList.length > 0 && data.breachList.length === 0 && (
              <div className="mb-6 flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-4">
                <span className="text-3xl">⏱</span>
                <div>
                  <p className="font-semibold text-amber-300">
                    {data.atRiskList.length} ticket{data.atRiskList.length !== 1 ? "s" : ""} at risk (within 4h)
                  </p>
                  <p className="text-sm text-amber-400/80">Review and assign to avoid breach</p>
                </div>
              </div>
            )}

            {/* Breach list */}
            {data.breachList.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 text-lg font-semibold text-red-400">Breached SLA</h2>
                <div className="space-y-3">
                  {data.breachList.map((g) => (
                    <TicketCard
                      key={g.id}
                      g={g}
                      workers={workers}
                      selectedWorker={selectedWorker[g.id]}
                      onSelectWorker={(id) => setSelectedWorker((s) => ({ ...s, [g.id]: id }))}
                      onAssign={() => assign(g.id)}
                      assigning={assigning === g.id}
                      variant="breach"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* At risk */}
            {data.atRiskList.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 text-lg font-semibold text-amber-400">At Risk (within 4h)</h2>
                <div className="space-y-3">
                  {data.atRiskList.map((g) => (
                    <TicketCard
                      key={g.id}
                      g={g}
                      workers={workers}
                      selectedWorker={selectedWorker[g.id]}
                      onSelectWorker={(id) => setSelectedWorker((s) => ({ ...s, [g.id]: id }))}
                      onAssign={() => assign(g.id)}
                      assigning={assigning === g.id}
                      variant="atRisk"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Full queue table */}
            <section>
              <h2 className="mb-4 text-lg font-semibold" style={{ color: "#e8e8e8" }}>Full Queue</h2>
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0a0a0a] shadow-xl">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="px-5 py-4 font-medium">Ticket</th>
                      <th className="px-5 py-4 font-medium">Department</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">SLA</th>
                      <th className="px-5 py-4 font-medium">Assigned</th>
                      <th className="px-5 py-4 font-medium">Assign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.queue ?? []).map((g) => (
                      <tr key={g.id} className="border-b border-white/5 transition hover:bg-white/5">
                        <td className="px-5 py-3 font-mono text-slate-300" style={{ textShadow: "0 0 8px rgba(192, 192, 192, 0.3)" }}>{g.ticketId}</td>
                        <td className="px-5 py-3 text-slate-300">{g.department}</td>
                        <td className="px-5 py-3 text-slate-300">{g.status.replace("_", " ")}</td>
                        <td className="px-5 py-3">
                          {g.breached ? (
                            <span className="text-red-400">Breached</span>
                          ) : g.minutesRemaining != null ? (
                            <span className="text-slate-300">~{Math.floor(g.minutesRemaining / 60)}h left</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-300">{g.assignedTo?.name ?? "—"}</td>
                        <td className="px-5 py-3">
                          <select
                            value={selectedWorker[g.id] ?? ""}
                            onChange={(e) => setSelectedWorker((s) => ({ ...s, [g.id]: e.target.value }))}
                            className="mr-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-white focus:border-slate-400/50 focus:outline-none"
                          >
                            <option value="">Select worker</option>
                            {workers
                              .filter((w) => w.department === g.department)
                              .map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name} ({w.openTickets} open)
                                </option>
                              ))}
                          </select>
                          <button
                            onClick={() => assign(g.id)}
                            disabled={!selectedWorker[g.id] || assigning === g.id}
                            className="rounded-lg bg-slate-500/20 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-500/30 disabled:opacity-50"
                          >
                            {assigning === g.id ? "..." : "Assign"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
    </ClientOnly>
  );
}

function TicketCard({
  g,
  workers,
  selectedWorker,
  onSelectWorker,
  onAssign,
  assigning,
  variant,
}: {
  g: QueueItem;
  workers: Worker[];
  selectedWorker: string;
  onSelectWorker: (id: string) => void;
  onAssign: () => void;
  assigning: boolean;
  variant: "breach" | "atRisk";
}) {
  const isBreach = variant === "breach";
  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 ${
        isBreach ? "border-red-500/20 bg-red-500/5" : "border-amber-500/20 bg-amber-500/5"
      }`}
    >
      <span className="font-mono font-semibold text-white">{g.ticketId}</span>
      <span className="text-slate-400">{g.department}</span>
      <span className="text-slate-400">{g.assignedTo?.name ?? "Unassigned"}</span>
      <span className="text-slate-500">
        {g.minutesRemaining != null ? `~${Math.floor(g.minutesRemaining / 60)}h left` : "—"}
      </span>
      <select
        value={selectedWorker}
        onChange={(e) => onSelectWorker(e.target.value)}
        className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white"
      >
        <option value="">Select worker</option>
        {workers.filter((w) => w.department === g.department).map((w) => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>
      <button
        onClick={onAssign}
        disabled={!selectedWorker || assigning}
        className="rounded-lg px-3 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 100%)", boxShadow: "0 0 10px rgba(192, 192, 192, 0.3)" }}
      >
        {assigning ? "..." : "Assign"}
      </button>
    </div>
  );
}
