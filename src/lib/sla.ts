import { prisma } from "./db";

export async function getSlaHours(department: string, category: string): Promise<number> {
  const rule = await prisma.slaRule.findFirst({
    where: { department, category },
  });
  return rule?.hoursToResolve ?? 120;
}

export function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setTime(d.getTime() + hours * 60 * 60);
  return d;
}

export function isBreached(dueAt: Date | null): boolean {
  return dueAt != null && new Date() > dueAt;
}

export function isAtRisk(dueAt: Date | null, riskHours = 4): boolean {
  if (!dueAt) return false;
  const threshold = new Date();
  threshold.setTime(threshold.getTime() + riskHours * 60 * 60);
  return new Date() <= dueAt && dueAt <= threshold;
}

export function minutesRemaining(dueAt: Date | null): number | null {
  if (!dueAt) return null;
  const now = new Date();
  if (now > dueAt) return 0;
  return Math.round((dueAt.getTime() - now.getTime()) / 60000);
}
