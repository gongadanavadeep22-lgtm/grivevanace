import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { minutesRemaining, isBreached } from "@/lib/sla";

export async function GET(req: NextRequest) {
  const workerId = req.nextUrl.searchParams.get("workerId");
  if (!workerId) {
    return NextResponse.json({ error: "workerId required" }, { status: 400 });
  }

  const grievances = await prisma.grievance.findMany({
    where: {
      assignedToId: workerId,
      status: { notIn: ["resolved", "closed"] },
    },
    orderBy: { slaDueAt: "asc" },
  });

  const withMeta = grievances.map((g) => ({
    id: g.id,
    ticketId: g.ticketId,
    description: g.description,
    department: g.department,
    category: g.category,
    status: g.status,
    slaDueAt: g.slaDueAt?.toISOString() ?? null,
    minutesRemaining: minutesRemaining(g.slaDueAt),
    breached: isBreached(g.slaDueAt),
    createdAt: g.createdAt.toISOString(),
  }));

  return NextResponse.json({ tasks: withMeta });
}
