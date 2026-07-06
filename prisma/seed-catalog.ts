import bcrypt from "bcrypt";
import type { PrismaClient } from "@prisma/client";
import {
  DEV_INSUMOS,
  DEV_OBRAS_SOCIALES,
  DEV_PACIENTES,
  DEV_PRESTADORES,
  DEV_SEED_PASSWORD,
  DEV_SERVICIOS,
  DEV_TARIFA_VARIANTES,
} from "./seed-data.js";

const ROLES = ["ADMIN", "OPERADOR", "PRESTADOR"] as const;

const DEV_USERS = [
  { email: "admin@medicine.local", nombre: "Admin de prueba", roleName: "ADMIN" as const },
  { email: "operador@medicine.local", nombre: "Operador de prueba", roleName: "OPERADOR" as const },
  ...DEV_PRESTADORES.map((p) => ({
    email: p.email,
    nombre: p.nombre,
    roleName: "PRESTADOR" as const,
  })),
];

export async function seedRoles(prisma: PrismaClient): Promise<void> {
  for (const nombre of ROLES) {
    const existing = await prisma.role.findFirst({ where: { nombre } });
    if (!existing) {
      await prisma.role.create({ data: { nombre } });
    }
  }
}

async function ensureUserWithRole(
  prisma: PrismaClient,
  input: {
    email: string;
    nombre: string;
    password: string;
    roleName: (typeof ROLES)[number];
  },
): Promise<void> {
  const role = await prisma.role.findFirst({ where: { nombre: input.roleName } });
  if (!role) {
    throw new Error(`Rol ${input.roleName} no encontrado`);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    include: { roles: true },
  });

  if (existing) {
    if (!existing.roles.some((ur) => ur.rolId === role.id)) {
      await prisma.userRole.create({ data: { userId: existing.id, rolId: role.id } });
    }
    return;
  }

  await prisma.user.create({
    data: {
      nombre: input.nombre,
      email: input.email,
      passwordHash,
      roles: { create: { rolId: role.id } },
    },
  });
}

export async function seedDevUsers(prisma: PrismaClient): Promise<void> {
  for (const u of DEV_USERS) {
    await ensureUserWithRole(prisma, {
      email: u.email,
      nombre: u.nombre,
      password: DEV_SEED_PASSWORD,
      roleName: u.roleName,
    });
  }
}

export async function seedObrasSociales(prisma: PrismaClient): Promise<Map<string, number>> {
  const ids = new Map<string, number>();
  for (const os of DEV_OBRAS_SOCIALES) {
    const row =
      (await prisma.obraSocial.findFirst({ where: { codigo: os.codigo } })) ??
      (await prisma.obraSocial.create({
        data: { codigo: os.codigo, nombre: os.nombre, estado: true },
      }));
    ids.set(os.codigo, row.id);
  }
  return ids;
}

export async function seedServiciosConTarifas(prisma: PrismaClient): Promise<Map<string, number>> {
  const ids = new Map<string, number>();

  for (const item of DEV_SERVICIOS) {
    let servicio = await prisma.servicio.findFirst({ where: { nombre: item.nombre } });
    servicio ??= await prisma.servicio.create({
      data: { nombre: item.nombre, descripcion: item.descripcion, estado: true },
    });

    ids.set(item.nombre, servicio.id);

    for (const variante of DEV_TARIFA_VARIANTES) {
      const existing = await prisma.servicioTarifa.findFirst({
        where: {
          servicioId: servicio.id,
          modalidadCobro: variante.modalidadCobro,
          tipoJornada: variante.tipoJornada,
          tipoDia: variante.tipoDia,
        },
      });

      if (!existing) {
        const factor = variante.tipoDia === "no_habil" ? 1.25 : 1;
        const jornadaFactor = variante.tipoJornada === "nocturno" ? 1.2 : 1;

        await prisma.servicioTarifa.create({
          data: {
            servicioId: servicio.id,
            modalidadCobro: variante.modalidadCobro,
            tipoJornada: variante.tipoJornada,
            tipoDia: variante.tipoDia,
            valor: Math.round(item.valorBase * factor * jornadaFactor),
          },
        });
      }
    }
  }

  return ids;
}

export async function seedPrestadores(
  prisma: PrismaClient,
  servicioIds: Map<string, number>,
): Promise<void> {
  for (const item of DEV_PRESTADORES) {
    const user = await prisma.user.findUnique({
      where: { email: item.email },
      include: { prestador: true },
    });

    if (!user) {
      continue;
    }

    const prestador =
      user.prestador ??
      (await prisma.prestador.create({
        data: {
          userId: user.id,
          telefono: item.telefono,
          lugarResidencia: "Ciudad Autónoma de Buenos Aires",
          documento: item.documento,
          matricula: item.matricula,
          cuit: item.cuit,
          cbu: item.cbu,
          regimenIva: "monotributo",
          estado: true,
        },
      }));

    for (const servicioNombre of item.servicios) {
      const servicioId = servicioIds.get(servicioNombre);
      if (!servicioId) {
        continue;
      }

      await prisma.prestadorServicio.upsert({
        where: {
          prestadorId_servicioId: {
            prestadorId: prestador.id,
            servicioId,
          },
        },
        update: {},
        create: { prestadorId: prestador.id, servicioId },
      });
    }
  }
}

export async function seedPacientesConServicios(
  prisma: PrismaClient,
  obraSocialIds: Map<string, number>,
  servicioIds: Map<string, number>,
): Promise<void> {
  for (const item of DEV_PACIENTES) {
    const obraSocialId = obraSocialIds.get(item.obraSocialCodigo);
    const servicioId = servicioIds.get(item.servicioNombre);
    if (obraSocialId === undefined || servicioId === undefined) {
      continue;
    }

    const paciente = await prisma.paciente.upsert({
      where: { codigoQr: item.codigoQr },
      update: {
        nombre: item.nombre,
        apellido: item.apellido,
        obraSocialId,
        localidad: item.localidad,
      },
      create: {
        obraSocialId,
        codigoQr: item.codigoQr,
        nombre: item.nombre,
        apellido: item.apellido,
        numeroDocumento: item.numeroDocumento,
        fechaNacimiento: new Date("1980-05-20"),
        sexo: item.sexo,
        telefono: "1144556677",
        direccion: "Av. Demo 1234",
        localidad: item.localidad,
        numeroAfiliado: item.numeroAfiliado,
      },
    });

    await prisma.historiaClinica.upsert({
      where: { pacienteId: paciente.id },
      update: {},
      create: {
        pacienteId: paciente.id,
        fechaCreacion: new Date("2026-01-01"),
        antecedentes: "Sin antecedentes relevantes (demo)",
        observaciones: "Paciente de prueba — seed catálogo",
      },
    });

    const prestadorServicio = await prisma.prestadorServicio.findFirst({
      where: { servicioId },
      select: { prestadorId: true },
      orderBy: { prestadorId: "asc" },
    });

    if (!prestadorServicio) {
      continue;
    }

    const existingPs = await prisma.pacienteServicio.findFirst({
      where: {
        pacienteId: paciente.id,
        servicioId,
        estado: "activa",
      },
    });

    if (!existingPs) {
      await prisma.pacienteServicio.create({
        data: {
          pacienteId: paciente.id,
          servicioId,
          prestadorId: prestadorServicio.prestadorId,
          fechaInicio: new Date("2026-01-01"),
          periodoControl: "mensual",
          cantidadPermitida: 12,
          cantidadHoras: null,
          modalidadCobro: "por_servicio",
          estado: "activa",
        },
      });
    }
  }
}

export async function seedInsumos(prisma: PrismaClient): Promise<void> {
  for (const item of DEV_INSUMOS) {
    await prisma.insumo.upsert({
      where: { codigo: item.codigo },
      update: {},
      create: {
        nombre: item.nombre,
        descripcion: item.descripcion,
        codigo: item.codigo,
        stockActual: item.stockActual,
        stockMinimo: item.stockMinimo,
        unidadMedida: item.unidadMedida,
        requiereVencimiento: false,
      },
    });
  }
}

/** Catálogo mínimo para probar el flujo: roles → usuarios → OS → servicios/tarifas → prestadores → pacientes. */
export async function seedDemoCatalog(prisma: PrismaClient): Promise<void> {
  await seedRoles(prisma);
  await seedDevUsers(prisma);
  const obraSocialIds = await seedObrasSociales(prisma);
  const servicioIds = await seedServiciosConTarifas(prisma);
  await seedPrestadores(prisma, servicioIds);
  await seedPacientesConServicios(prisma, obraSocialIds, servicioIds);
  await seedInsumos(prisma);
}
