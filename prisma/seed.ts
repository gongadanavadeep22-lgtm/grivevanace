import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.slaRule.createMany({
    data: [
      { department: "water", category: "supply", hoursToResolve: 48 },
      { department: "water", category: "quality", hoursToResolve: 24 },
      { department: "roads", category: "pothole", hoursToResolve: 72 },
      { department: "sanitation", category: "garbage", hoursToResolve: 24 },
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
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
