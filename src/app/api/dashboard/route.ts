import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isBreached } from "@/lib/sla";

interface GrievanceRow {
  id: string;
  status: string;
  slaDueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  department: string;
  location: string | null;
  ticketId: string;
  assignedTo: { name: string } | null;
}

export async function GET() {
  try {
  const grievances = await prisma.grievance.findMany({
    include: { assignedTo: { select: { name: true } } },
  }) as GrievanceRow[];

  const open = grievances.filter((g: GrievanceRow) => g.status !== "resolved" && g.status !== "closed");
  const closed = grievances.filter((g: GrievanceRow) => g.status === "resolved" || g.status === "closed");
  const breached = open.filter((g: GrievanceRow) => isBreached(g.slaDueAt));
  const hist = await prisma.grievanceHistory.findMany({
    where: { grievanceId: { in: closed.map((c: GrievanceRow) => c.id) }, status: "resolved" },
  });
  type HistRow = { grievanceId: string; createdAt: Date };
  const resolvedAtMap = new Map<string, Date>(hist.map((h: HistRow) => [h.grievanceId, h.createdAt]));
  const closedWithinSlaCount = closed.filter((g: GrievanceRow) => {
    const resolvedAt = resolvedAtMap.get(g.id);
    return g.slaDueAt && resolvedAt && resolvedAt <= g.slaDueAt;
  }).length;

  const byDepartment: Record<string, { open: number; closed: number; breached: number }> = {};
  for (const g of grievances as GrievanceRow[]) {
    if (!byDepartment[g.department]) {
      byDepartment[g.department] = { open: 0, closed: 0, breached: 0 };
    }
    if (g.status === "resolved" || g.status === "closed") {
      byDepartment[g.department].closed++;
    } else {
      byDepartment[g.department].open++;
      if (isBreached(g.slaDueAt)) byDepartment[g.department].breached++;
    }
  }

  const slaPercent =
    closed.length === 0 ? 100 : Math.round((closedWithinSlaCount / closed.length) * 100);

  // Trend: last 7 days (created + resolved per day)
  const now = new Date();
  const trendDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const trend = trendDays.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const created = grievances.filter(
      (g: GrievanceRow) => g.createdAt >= day && g.createdAt < nextDay
    ).length;
    const resolved = closed.filter((g: GrievanceRow) => {
      const resolvedAt = resolvedAtMap.get(g.id);
      return resolvedAt && resolvedAt >= day && resolvedAt < nextDay;
    }).length;
    return {
      date: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      created,
      resolved,
    };
  });

  // By location (for map/geo viz)
  const byLocation: Record<string, number> = {};
  for (const g of grievances as GrievanceRow[]) {
    const loc = (g.location && g.location.trim()) || "Unspecified";
    byLocation[loc] = (byLocation[loc] || 0) + 1;
  }
  const locationData = Object.entries(byLocation)
    .map(([name, count]: [string, number]) => ({ location: name, count }))
    .sort((a: { location: string; count: number }, b: { location: string; count: number }) => b.count - a.count)
    .slice(0, 15);

  // Status pipeline (for work progress)
  const statusOrder = ["received", "assigned", "in_progress", "pending_dependency", "resolved", "closed"];
  const statusPipeline = statusOrder.map((status) => ({
    status,
    count: grievances.filter((g: GrievanceRow) => g.status === status).length,
  }));

  const activeOfficers = await prisma.worker.count();

  return NextResponse.json({
    totalRegistered: grievances.length,
    totalOpen: open.length,
    totalClosed: closed.length,
    activeOfficers,
    breachedCount: breached.length,
    slaPercent,
    avgResolutionHours: closed.length
      ? Math.round(
          closed.reduce((acc: number, g: GrievanceRow) => {
            const resolvedAt: Date | undefined = resolvedAtMap.get(g.id) ?? g.updatedAt;
            if (!resolvedAt || !g.createdAt) return acc;
            const hours = (resolvedAt.getTime() - g.createdAt.getTime()) / (1000 * 60 * 60);
            return acc + hours;
          }, 0) / closed.length
        )
      : null,
    byDepartment: Object.entries(byDepartment).map(([name, d]) => ({
      department: name,
      ...d,
    })),
    trend,
    locationData,
    statusPipeline,
    recentOpen: open
      .sort((a: GrievanceRow, b: GrievanceRow) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((g: GrievanceRow) => ({
        id: g.id,
        ticketId: g.ticketId,
        department: g.department,
        status: g.status,
        slaDueAt: g.slaDueAt?.toISOString(),
        breached: isBreached(g.slaDueAt),
        location: g.location,
      })),
  });
  } catch (err) {
    console.error("Dashboard API error:", err);
    const emptyTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return {
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
        created: 0,
        resolved: 0,
      };
    });
    return NextResponse.json(
      {
        error: "Failed to load dashboard data",
        totalRegistered: 0,
        totalOpen: 0,
        totalClosed: 0,
        activeOfficers: 0,
        breachedCount: 0,
        slaPercent: 0,
        avgResolutionHours: null,
        byDepartment: [],
        trend: emptyTrend,
        locationData: [],
        statusPipeline: [
          { status: "received", count: 0 },
          { status: "assigned", count: 0 },
          { status: "in_progress", count: 0 },
          { status: "pending_dependency", count: 0 },
          { status: "resolved", count: 0 },
          { status: "closed", count: 0 },
        ],
        recentOpen: [],
      },
      { status: 200 }
    );
  }
}
