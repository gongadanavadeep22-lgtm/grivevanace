"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface WorkloadItem {
  name: string;
  openTickets: number;
  department: string;
}

export default function WorkerWorkloadChart({ data = [] }: { data?: WorkloadItem[] }) {
  const safeData = Array.isArray(data) ? data : [];
  if (safeData.length === 0) return null;
  return (
    <div className="mb-10 rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 shadow-xl">
      <h2 className="mb-4 text-lg font-semibold" style={{ color: "#e8e8e8" }}>Worker Workload</h2>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={safeData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "12px",
              }}
            />
            <Bar dataKey="openTickets" name="Open" fill="#94a3b8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
