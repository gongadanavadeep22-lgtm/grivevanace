"use client";

import ClientOnly from "@/components/ClientOnly";
import WorkerContent from "./WorkerContent";

const Spinner = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" style={{ boxShadow: "0 0 8px rgba(192, 192, 192, 0.25)" }} />
  </div>
);

export default function WorkerPage() {
  return (
    <ClientOnly fallback={<Spinner />}>
      <WorkerContent />
    </ClientOnly>
  );
}
