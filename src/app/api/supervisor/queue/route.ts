import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isBreached, isAtRisk, minutesRemaining } from "@/lib/sla";

export async function GET(req: NextRequest) {
  const department = req.nextUrl.searchParams.get("department") ?? undefined;

  const where = department ? { department } : {};
  const grievances = await prisma.grievance.findMany({
    where: {
      ...where,
      status: { notIn: ["resolved", "closed"] },
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
    orderBy: { slaDueAt: "asc" },
  });

  const withMeta = grievances.map((g) => {
    const breached = isBreached(g.slaDueAt);
    const atRisk = isAtRisk(g.slaDueAt);
    const mins = minutesRemaining(g.slaDueAt);
    return {
      id: g.id,
      ticketId: g.ticketId,
      description: g.description,
      department: g.department,
      category: g.category,
      status: g.status,
      slaDueAt: g.slaDueAt?.toISOString() ?? null,
      breached,
      atRisk,
      minutesRemaining: mins,
      assignedTo: g.assignedTo,
      createdAt: g.createdAt.toISOString(),
    };
  });

  const breachList = withMeta.filter((g) => g.breached);
  const atRiskList = withMeta.filter((g) => g.atRisk && !g.breached);

  const VIZAG_AREAS = ["Gajuwaka", "RK Beach", "MVP Colony", "Srinagar", "Nad Junction"];
  const normalizeLoc = (loc: string) => {
    const l = loc.toLowerCase();
    if (l.includes("gajuwaka")) return "Gajuwaka";
    if (l.includes("rk beach") || l.includes("r.k beach")) return "RK Beach";
    if (l.includes("mvp") || l.includes("conoly") || l.includes("colony")) return "MVP Colony";
    if (l.includes("srinagar")) return "Srinagar";
    if (l.includes("nad")) return "Nad Junction";
    return loc || "Unspecified";
  };
  const byLocation: Record<string, number> = {};
  for (const g of grievances) {
    const raw = (g.location && g.location.trim()) || "Unspecified";
    const loc = normalizeLoc(raw);
    byLocation[loc] = (byLocation[loc] || 0) + 1;
  }
  for (const area of VIZAG_AREAS) {
    if (!(area in byLocation)) byLocation[area] = 0;
  }
  const maxCount = Math.max(...Object.values(byLocation), 1);
  const locationZones = Object.entries(byLocation).map(([location, count]) => ({
    location,
    count,
    zone: count >= maxCount * 0.6 ? "red" : count >= maxCount * 0.3 ? "orange" : "green",
  }));

  return NextResponse.json({
    queue: withMeta,
    breachList,
    atRiskList,
    locationZones,
  });
}
