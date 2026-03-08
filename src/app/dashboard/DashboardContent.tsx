"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  assigned: "Assigned",
  in_progress: "In progress",
  pending_dependency: "Pending",
  resolved: "Resolved",
  closed: "Closed",
};

const DEPT_COLORS = ["#94a3b8", "#64748b", "#475569", "#f59e0b", "#a78bfa"];

export interface DashboardData {
  totalRegistered?: number;
  totalOpen: number;
  totalClosed: number;
  activeOfficers?: number;
  breachedCount: number;
  slaPercent: number;
  avgResolutionHours: number | null;
  byDepartment: { department: string; open: number; closed: number; breached: number }[];
  trend: { date: string; label: string; created: number; resolved: number }[];
  locationData: { location: string; count: number }[];
  statusPipeline: { status: string; count: number }[];
  recentOpen: {
    id: string;
    ticketId: string;
    department: string;
    status: string;
    slaDueAt: string | null;
    breached: boolean;
    location: string | null;
  }[];
}

export default function DashboardContent({
  data,
  onExport,
}: {
  data: DashboardData;
  onExport: () => void;
}) {
  const pipelineData = (data.statusPipeline || []).map((p) => ({
    name: STATUS_LABELS[p.status] || p.status,
    value: p.count,
  }));
  const pieData = pipelineData.filter((d) => d.value > 0);

  return (
    <div className="min-h-screen gradient-mesh">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#e8e8e8", textShadow: "0 0 12px rgba(192, 192, 192, 0.35)" }}>
              Government Dashboard
            </h1>
            <p className="mt-1" style={{ color: "#b8b8b8" }}>
              Real-time grievance metrics, SLA accountability & geography
            </p>
          </div>
          <button
            onClick={onExport}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10"
            style={{ color: "#c0c0c0" }}
          >
            Export Report (JSON)
          </button>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <KpiCard title="Total Registered" value={data.totalRegistered ?? data.totalOpen + data.totalClosed} icon="📥" className="border-white/5 bg-[#0a0a0a]" />
          <KpiCard title="Solved" value={data.totalClosed} icon="✅" className="border-slate-400/30 bg-slate-500/10" />
          <KpiCard title="Active" value={data.totalOpen} icon="📋" className="border-slate-400/30 bg-slate-500/10" />
          <KpiCard title="Avg resolution" value={data.avgResolutionHours != null ? `${data.avgResolutionHours}h` : "—"} sub="hours" icon="📊" className="border-slate-500/30 bg-slate-600/10" />
          <KpiCard title="Active Officers" value={data.activeOfficers ?? "—"} icon="👤" className="border-slate-400/30 bg-slate-500/10" />
          <KpiCard title="SLA %" value={`${data.slaPercent}%`} sub="on-time" icon="⏱" className="border-amber-500/30 bg-amber-500/10" />
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "#e8e8e8" }}>Trend (Last 7 Days)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend || []}>
                  <defs>
                    <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64748b" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#64748b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #333", borderRadius: "12px" }} labelStyle={{ color: "#e8e8e8" }} />
                  <Legend />
                  <Area type="monotone" dataKey="created" name="Created" stroke="#94a3b8" fill="url(#createdGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#64748b" fill="url(#resolvedGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "#e8e8e8" }}>By Department</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byDepartment || []} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis type="category" dataKey="department" tick={{ fill: "#94a3b8", fontSize: 11 }} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #333", borderRadius: "12px" }} />
                  <Legend />
                  <Bar dataKey="open" name="Open" fill="#64748b" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="closed" name="Closed" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="breached" name="Breached" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "#e8e8e8" }}>Work Progress Pipeline</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #333", borderRadius: "12px" }} />
                  <Bar dataKey="value" name="Tickets" radius={[6, 6, 0, 0]}>
                    {pipelineData.map((_, i) => (
                      <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "#e8e8e8" }}>Geography · Complaints by Location</h2>
            <div className="h-64 overflow-y-auto">
              {(!data.locationData || data.locationData.length === 0) ? (
                <p className="flex h-full items-center justify-center text-slate-500">No location data yet</p>
              ) : (
                <div className="space-y-2">
                  {data.locationData.map((loc) => (
                    <div key={loc.location} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-2">
                      <span className="text-sm text-slate-300">{loc.location}</span>
                      <span className="rounded-full bg-slate-500/20 px-3 py-0.5 text-sm font-semibold text-slate-300" style={{ boxShadow: "0 0 8px rgba(192, 192, 192, 0.25)" }}>{loc.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 shadow-xl lg:col-span-1">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "#e8e8e8" }}>Status Distribution</h2>
            <div className="h-56">
              {pieData.length === 0 ? (
                <p className="flex h-full items-center justify-center text-slate-500">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #333", borderRadius: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 shadow-xl lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "#e8e8e8" }}>Recent Open Tickets</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-3 pr-4 font-medium">Ticket</th>
                    <th className="pb-3 pr-4 font-medium">Department</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Location</th>
                    <th className="pb-3 pr-4 font-medium">SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {(!data.recentOpen || data.recentOpen.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No open tickets</td>
                    </tr>
                  ) : (
                    data.recentOpen.map((t) => (
                      <tr key={t.id} className="border-b border-white/5">
                        <td className="py-3 pr-4 font-mono text-slate-300" style={{ textShadow: "0 0 8px rgba(192, 192, 192, 0.3)" }}>{t.ticketId}</td>
                        <td className="py-3 pr-4 text-slate-300">{t.department}</td>
                        <td className="py-3 pr-4 text-slate-300">{STATUS_LABELS[t.status] ?? t.status}</td>
                        <td className="py-3 pr-4 text-slate-400">{t.location || "—"}</td>
                        <td className="py-3 pr-4">{t.breached ? <span className="text-amber-400">Breached</span> : <span className="text-slate-400">On track</span>}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon,
  className = "",
  valueClass = "",
}: {
  title: string;
  value: number | string;
  sub?: string;
  icon: string;
  className?: string;
  valueClass?: string;
}) {
  return (
    <div className={`rounded-2xl border p-6 shadow-lg transition hover:shadow-xl ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "#b8b8b8" }}>{title}</p>
          <p className={`mt-1 text-2xl font-bold ${valueClass}`} style={!valueClass ? { color: "#e8e8e8" } : undefined}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
        <span className="text-2xl opacity-80">{icon}</span>
      </div>
    </div>
  );
}
