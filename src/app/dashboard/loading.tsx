export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-500/30 border-t-slate-300" style={{ boxShadow: "0 0 8px rgba(192, 192, 192, 0.25)" }} />
      <p className="text-slate-400">Loading dashboard…</p>
    </div>
  );
}
