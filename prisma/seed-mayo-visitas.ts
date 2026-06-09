/**
 * Seed opcional: 20 visitas en mayo con finanzas según tarifas.
 * Requiere catálogo demo (`npm run db:seed`).
 *
 * Uso: npm run db:seed:mayo-visitas
 */
import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import {
  calcularValorAplicado,
  resolveTipoDia,
  resolveTipoJornada,
} from "../src/shared/visita/visitaTarifa.js";
import type { ModalidadCobro } from "../src/shared/constants/modalidad-cobro.js";
import { seedDemoCatalog } from "./seed-catalog.js";

const prisma = new PrismaClient();

const SEED_MARKER = "seed-mayo-2026";
const MAY_YEAR = 2026;

const MAY_VISIT_DATES = [
  "2026-05-01",
  "2026-05-04",
  "2026-05-05",
  "2026-05-06",
  "2026-05-07",
  "2026-05-08",
  "2026-05-11",
  "2026-05-12",
  "2026-05-13",
  "2026-05-14",
  "2026-05-15",
  "2026-05-18",
  "2026-05-19",
  "2026-05-20",
  "2026-05-21",
  "2026-05-22",
  "2026-05-25",
  "2026-05-26",
  "2026-05-27",
  "2026-05-28",
] as const;

async function buildFinanzas(
  servicioId: number,
  modalidadCobro: string,
  fechaInicio: Date,
  tiempoMinutos: number,
): Promise<{
  modalidadCobro: string;
  tipoJornada: string;
  tipoDia: string;
  valorUnitario: Prisma.Decimal;
  valorAplicado: Prisma.Decimal;
} | null> {
  const tipoJornada = resolveTipoJornada(fechaInicio);
  const tipoDia = resolveTipoDia(fechaInicio);

  const tarifa = await prisma.servicioTarifa.findFirst({
    where: { servicioId, modalidadCobro, tipoJornada, tipoDia },
  });

  if (!tarifa) {
    return null;
  }

  const valorAplicado = calcularValorAplicado(
    modalidadCobro as ModalidadCobro,
    tarifa.valor,
    tiempoMinutos,
  );

  return {
    modalidadCobro,
    tipoJornada,
    tipoDia,
    valorUnitario: tarifa.valor,
    valorAplicado,
  };
}

async function seedMayoVisitas(): Promise<number> {
  const prestadores = await prisma.prestador.findMany({
    where: { estado: true },
    orderBy: { id: "asc" },
  });

  if (prestadores.length === 0) {
    throw new Error("No hay prestadores activos. Ejecutá npm run db:seed primero.");
  }

  const pacienteServicios = await prisma.pacienteServicio.findMany({
    where: { estado: "activa" },
    orderBy: { id: "asc" },
    include: { servicio: true },
  });

  if (pacienteServicios.length === 0) {
    throw new Error("No hay asignaciones paciente-servicio activas. Ejecutá npm run db:seed.");
  }

  const tiempoMinutos = 45;
  let created = 0;

  for (let i = 0; i < MAY_VISIT_DATES.length; i++) {
    const dateIso = MAY_VISIT_DATES[i];
    const observaciones = `${SEED_MARKER}-${dateIso}`;

    const legacyDay = dateIso.slice(8, 10);
    const already =
      (await prisma.visita.findFirst({ where: { observaciones } })) ??
      (await prisma.visita.findFirst({
        where: { observaciones: `${SEED_MARKER}-day-${legacyDay}` },
      }));
    if (already) {
      continue;
    }

    const pacienteServicio = pacienteServicios[i % pacienteServicios.length];
    const prestador = prestadores[i % prestadores.length];
    const fechaInicio = new Date(`${dateIso}T14:00:00.000Z`);
    const fechaFin = new Date(fechaInicio.getTime() + tiempoMinutos * 60_000);

    const finanzas = await buildFinanzas(
      pacienteServicio.servicioId,
      pacienteServicio.modalidadCobro,
      fechaInicio,
      tiempoMinutos,
    );

    if (!finanzas) {
      console.warn(
        `Omitida visita ${dateIso}: sin tarifa (${pacienteServicio.servicio.nombre}, ${pacienteServicio.modalidadCobro})`,
      );
      continue;
    }

    await prisma.visita.create({
      data: {
        pacienteServicioId: pacienteServicio.id,
        prestadorId: prestador.id,
        estado: "finalizada",
        fechaInicio,
        fechaFin,
        tiempoMinutos,
        observaciones,
        finanzas: { create: finanzas },
      },
    });

    created += 1;
  }

  return created;
}

async function main(): Promise<void> {
  await seedDemoCatalog(prisma);
  const created = await seedMayoVisitas();

  const [mayoTotal, seedTotal] = await Promise.all([
    prisma.visita.count({
      where: {
        fechaInicio: {
          gte: new Date(`${MAY_YEAR}-05-01T00:00:00.000Z`),
          lt: new Date(`${MAY_YEAR}-06-01T00:00:00.000Z`),
        },
      },
    }),
    prisma.visita.count({
      where: { observaciones: { startsWith: SEED_MARKER } },
    }),
  ]);

  console.log(
    `Listo: ${created} visita(s) nuevas. Mayo ${MAY_YEAR}: ${mayoTotal} total; ${seedTotal} con marcador "${SEED_MARKER}".`,
  );
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
