"use client";

import { useEffect, useState } from "react";

interface Task {
  id: string;
  ticketId: string;
  description: string;
  department: string;
  category: string;
  status: string;
  slaDueAt: string | null;
  minutesRemaining: number | null;
  breached: boolean;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "in_progress", label: "In progress", icon: "▶" },
  { value: "pending_dependency", label: "Pending dependency", icon: "⏸" },
  { value: "resolved", label: "Resolved", icon: "✓" },
];

interface WorkerOption {
  id: string;
  name: string;
  department: string;
}

type ViewMode = "kanban" | "list";

export default function WorkerContent() {
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [resolveNote, setResolveNote] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/workers")
      .then((r) => r.json())
      .then((raw: unknown) => {
        const list = Array.isArray(raw) ? raw : [];
        setWorkers(list);
        if (list.length) setWorkerId(list[0].id);
        else setLoading(false);
      })
      .catch(() => {
        setWorkers([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!workerId) return;
    setLoading(true);
    fetch(`/api/worker/my-tasks?workerId=${encodeURIComponent(workerId)}`)
      .then((r) => r.json())
      .then((d: { tasks?: Task[] }) => setTasks(Array.isArray(d?.tasks) ? d.tasks : []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [workerId]);

  const updateStatus = async (grievanceId: string, status: string, note?: string) => {
    setUpdating(grievanceId);
    try {
      await fetch(`/api/grievances/${grievanceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      setTasks((prev) =>
        prev
          .map((t) => (t.id === grievanceId ? { ...t, status } : t))
          .filter((t) => t.status !== "resolved" && t.status !== "closed")
      );
      setResolveNote((n) => ({ ...n, [grievanceId]: "" }));
    } finally {
      setUpdating(null);
    }
  };

  const columns = [
    { status: "assigned", label: "Assigned", color: "bg-slate-500/20 text-slate-300" },
    { status: "in_progress", label: "In progress", color: "bg-cyan-500/20 text-cyan-300" },
    { status: "pending_dependency", label: "Pending", color: "bg-amber-500/20 text-amber-300" },
  ];

  return (
    <div className="min-h-screen gradient-mesh">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#e8e8e8", textShadow: "0 0 12px rgba(192, 192, 192, 0.35)" }}>My Tasks</h1>
            <p className="mt-1" style={{ color: "#b8b8b8" }}>Update status and add proof of work</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm text-slate-400">View as:</label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-800/50 px-4 py-2.5 text-white focus:border-slate-400/50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.department})
                </option>
              ))}
            </select>
            <div className="flex rounded-xl border border-white/10 bg-slate-800/30 p-1">
              <button
                onClick={() => setViewMode("kanban")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === "kanban" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === "list" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" style={{ boxShadow: "0 0 8px rgba(192, 192, 192, 0.25)" }} />
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] py-16 text-center">
            <p className="text-slate-400">No tasks assigned to you.</p>
            <p className="mt-1 text-sm text-slate-500">Tasks will appear here when a supervisor assigns them.</p>
          </div>
        ) : viewMode === "kanban" ? (
          <div className="grid gap-6 md:grid-cols-3">
            {columns.map((col) => (
              <div key={col.status} className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className={`rounded-lg px-2.5 py-1 text-sm font-medium ${col.color}`}>{col.label}</span>
                  <span className="text-xs text-slate-500">{tasks.filter((t) => t.status === col.status).length}</span>
                </div>
                <div className="space-y-3">
                  {tasks
                    .filter((t) => t.status === col.status)
                    .map((t) => (
                      <TaskCard
                        key={t.id}
                        t={t}
                        onUpdate={updateStatus}
                        updating={updating === t.id}
                        resolveNote={resolveNote[t.id] ?? ""}
                        onResolveNoteChange={(v) => setResolveNote((n) => ({ ...n, [t.id]: v }))}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((t) => (
              <TaskCard
                key={t.id}
                t={t}
                onUpdate={updateStatus}
                updating={updating === t.id}
                resolveNote={resolveNote[t.id] ?? ""}
                onResolveNoteChange={(v) => setResolveNote((n) => ({ ...n, [t.id]: v }))}
                listMode
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TaskCard({
  t,
  onUpdate,
  updating,
  resolveNote,
  onResolveNoteChange,
  listMode = false,
}: {
  t: Task;
  onUpdate: (id: string, status: string, note?: string) => void;
  updating: boolean;
  resolveNote: string;
  onResolveNoteChange: (v: string) => void;
  listMode?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        t.breached ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-slate-800/30"
      } ${listMode ? "max-w-3xl" : ""}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono font-semibold text-slate-300" style={{ textShadow: "0 0 8px rgba(192, 192, 192, 0.3)" }}>{t.ticketId}</span>
        <span className="text-slate-400">{t.department} · {t.category}</span>
        {t.slaDueAt && (
          <span className={t.breached ? "text-red-400" : "text-slate-300"}>
            {t.breached ? "Breached" : t.minutesRemaining != null ? `~${Math.floor(t.minutesRemaining / 60)}h ${t.minutesRemaining % 60}m left` : ""}
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-slate-300">{t.description}</p>
      {(t.status === "in_progress" || t.status === "pending_dependency") && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-slate-500">Proof of work (optional note when resolving)</label>
          <input
            type="text"
            value={resolveNote}
            onChange={(e) => onResolveNoteChange(e.target.value)}
            placeholder="e.g. Pipe repaired, photo taken"
            className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-slate-400/50 focus:outline-none"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onUpdate(t.id, opt.value, opt.value === "resolved" ? resolveNote : undefined)}
            disabled={updating || t.status === opt.value}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
              opt.value === "resolved" ? "bg-slate-500/20 text-slate-300 hover:bg-slate-500/30" : "bg-white/10 text-slate-300 hover:bg-white/15"
            }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
