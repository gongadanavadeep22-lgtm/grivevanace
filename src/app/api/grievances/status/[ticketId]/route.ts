import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { minutesRemaining, isBreached } from "@/lib/sla";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  if (!ticketId) {
    return NextResponse.json({ error: "Ticket ID required" }, { status: 400 });
  }

  const grievance = await prisma.grievance.findUnique({
    where: { ticketId: ticketId.toUpperCase() },
    include: {
      history: { orderBy: { createdAt: "asc" } },
      assignedTo: { select: { name: true, department: true } },
    },
  });

  if (!grievance) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const minutesLeft = minutesRemaining(grievance.slaDueAt);
  const breached = isBreached(grievance.slaDueAt);

  return NextResponse.json({
    ticketId: grievance.ticketId,
    status: grievance.status,
    department: grievance.department,
    category: grievance.category,
    description: grievance.description,
    slaDueAt: grievance.slaDueAt?.toISOString() ?? null,
    minutesRemaining: minutesLeft,
    breached,
    assignedTo: grievance.assignedTo?.name ?? null,
    history: grievance.history.map((h) => ({
      status: h.status,
      note: h.note,
      createdAt: h.createdAt.toISOString(),
    })),
  });
}
