import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { grievanceId, workerId } = body as { grievanceId: string; workerId: string };

    if (!grievanceId || !workerId) {
      return NextResponse.json(
        { error: "grievanceId and workerId are required" },
        { status: 400 }
      );
    }

    const grievance = await prisma.grievance.update({
      where: { id: grievanceId },
      data: { assignedToId: workerId, status: "assigned" },
    });

    await prisma.grievanceHistory.create({
      data: {
        grievanceId: grievance.id,
        status: "assigned",
        note: `Assigned to worker ${workerId}`,
      },
    });

    return NextResponse.json({ ok: true, grievance });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Assignment failed" }, { status: 500 });
  }
}
