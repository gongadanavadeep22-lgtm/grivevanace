import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, note } = body as { status: string; note?: string };

  const allowed = ["assigned", "in_progress", "pending_dependency", "resolved", "closed"];
  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const grievance = await prisma.grievance.update({
    where: { id },
    data: { status },
  });

  await prisma.grievanceHistory.create({
    data: {
      grievanceId: id,
      status,
      note: note ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, grievance });
}
