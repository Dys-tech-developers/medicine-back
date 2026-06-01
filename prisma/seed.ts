import { PrismaClient } from "@prisma/client";
import { seedDemoCatalog } from "./seed-catalog.js";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seedDemoCatalog(prisma);
  console.log(
    "Seed catálogo demo listo: usuarios, obras sociales, servicios con tarifas, prestadores, pacientes e insumos.",
  );
  console.log("Contraseña de prueba (todos los usuarios): MedicineTest1!");
  console.log("Visitas de mayo (opcional): npm run db:seed:mayo-visitas");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
