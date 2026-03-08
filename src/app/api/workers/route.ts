import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const department = req.nextUrl.searchParams.get("department") ?? undefined;
  const workers = await prisma.worker.findMany({
    where: department ? { department } : {},
    include: {
      _count: { select: { grievances: true } },
    },
  });

  const openByWorker = await prisma.grievance.groupBy({
    by: ["assignedToId"],
    where: {
      status: { notIn: ["resolved", "closed"] },
      assignedToId: { not: null },
    },
    _count: true,
  });
  const openMap = new Map(openByWorker.map((o) => [o.assignedToId, o._count]));

  return NextResponse.json(
    workers.map((w) => ({
      id: w.id,
      name: w.name,
      email: w.email,
      department: w.department,
      role: w.role,
      openTickets: openMap.get(w.id) ?? 0,
    }))
  );
}
