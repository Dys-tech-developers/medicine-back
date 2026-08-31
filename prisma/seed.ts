import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@medicine.local";
const ADMIN_NOMBRE = "Administrador";
const ADMIN_PASSWORD = "MedicineTest1!";
const BCRYPT_ROUNDS = 12;

async function main(): Promise<void> {
  const role =
    (await prisma.role.findFirst({ where: { nombre: "ADMIN" } })) ??
    (await prisma.role.create({ data: { nombre: "ADMIN" } }));

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    include: { roles: true },
  });

  if (existing) {
    if (!existing.roles.some((ur) => ur.rolId === role.id)) {
      await prisma.userRole.create({ data: { userId: existing.id, rolId: role.id } });
    }
    console.log(`Admin ya existía: ${ADMIN_EMAIL}`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  await prisma.user.create({
    data: {
      nombre: ADMIN_NOMBRE,
      email: ADMIN_EMAIL,
      passwordHash,
      roles: { create: { rolId: role.id } },
    },
  });

  console.log(`Admin creado: ${ADMIN_EMAIL}`);
  console.log(`Contraseña: ${ADMIN_PASSWORD}`);
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
