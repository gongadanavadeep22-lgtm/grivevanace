import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.slaRule.createMany({
    data: [
      { department: "water", category: "supply", hoursToResolve: 48 },
      { department: "water", category: "quality", hoursToResolve: 24 },
      { department: "water", category: "leak", hoursToResolve: 24 },
      { department: "roads", category: "pothole", hoursToResolve: 72 },
      { department: "roads", category: "repair", hoursToResolve: 96 },
      { department: "sanitation", category: "garbage", hoursToResolve: 24 },
      { department: "sanitation", category: "drain", hoursToResolve: 48 },
      { department: "general", category: "other", hoursToResolve: 120 },
    ],
    skipDuplicates: true,
  });

  await prisma.worker.createMany({
    data: [
      { name: "Raj Kumar", email: "raj@gov.in", department: "water", role: "worker" },
      { name: "Priya Singh", email: "priya@gov.in", department: "water", role: "worker" },
      { name: "Amit Sharma", email: "amit@gov.in", department: "roads", role: "worker" },
      { name: "Sita Nair", email: "sita@gov.in", department: "sanitation", role: "supervisor" },
    ],
    skipDuplicates: true,
  });

  // Sample grievances for dashboard demo
  const now = new Date();
  const addHours = (d: Date, h: number) => new Date(d.getTime() + h * 60 * 60 * 1000);
  const sampleGrievances = [
    { desc: "No water supply in Sector 5 for 3 days", dept: "water", cat: "supply", loc: "Sector 5", hoursAgo: 2 },
    { desc: "Water leak near park", dept: "water", cat: "leak", loc: "Central Park", hoursAgo: 5 },
    { desc: "Pothole on main road causing accidents", dept: "roads", cat: "pothole", loc: "Main Street", hoursAgo: 12 },
    { desc: "Garbage not collected for a week", dept: "sanitation", cat: "garbage", loc: "Block A", hoursAgo: 24 },
    { desc: "Drain blockage causing flooding", dept: "sanitation", cat: "drain", loc: "Colony B", hoursAgo: 8 },
    { desc: "Tap water is muddy", dept: "water", cat: "quality", loc: "Ward 3", hoursAgo: 36 },
    { desc: "Street light not working", dept: "roads", cat: "light", loc: "Lane 7", hoursAgo: 48 },
    { desc: "Road repair needed urgently", dept: "roads", cat: "repair", loc: "Highway exit", hoursAgo: 72 },
  ];
  for (const s of sampleGrievances) {
    try {
      const createdAt = new Date(now.getTime() - s.hoursAgo * 60 * 60 * 1000);
      const ticketId = `GRV-DEMO${String(sampleGrievances.indexOf(s) + 1).padStart(4, "0")}`;
      const existing = await prisma.grievance.findUnique({ where: { ticketId } });
      if (!existing) {
        const g = await prisma.grievance.create({
          data: {
            ticketId,
            description: s.desc,
            category: s.cat,
            department: s.dept,
            location: s.loc,
            urgency: "normal",
            status: ["received", "in_progress", "resolved"][sampleGrievances.indexOf(s) % 3],
            slaDueAt: addHours(createdAt, 48),
            createdAt,
          },
        });
        await prisma.grievanceHistory.create({
          data: { grievanceId: g.id, status: g.status, note: "Initial submission" },
        });
      }
    } catch (e) {
      console.warn("Seed sample grievance skipped:", e);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
