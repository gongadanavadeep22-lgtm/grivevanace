export default function SupervisorLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" style={{ boxShadow: "0 0 8px rgba(192, 192, 192, 0.25)" }} />
    </div>
  );
}
