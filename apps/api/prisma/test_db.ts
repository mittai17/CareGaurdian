import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const patients = await prisma.patient.findMany({ select: { id: true, firstName: true } });
  console.log(patients);
}
main().finally(() => prisma.$disconnect());
