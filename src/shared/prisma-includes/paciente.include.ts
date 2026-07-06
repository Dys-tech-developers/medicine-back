import type { Prisma } from "@prisma/client";
import { PACIENTE_SERVICIO_ESTADO } from "../constants/paciente-servicio-estado.js";

export const pacienteObraSocialInclude = {
  obraSocial: true,
} satisfies Prisma.PacienteInclude;

export type PacienteWithObraSocialRow = Prisma.PacienteGetPayload<{
  include: typeof pacienteObraSocialInclude;
}>;

export const pacienteListInclude = {
  obraSocial: true,
  historiaClinica: {
    select: { id: true },
  },
  servicios: {
    where: { estado: PACIENTE_SERVICIO_ESTADO.ACTIVA },
    select: {
      servicio: {
        select: { nombre: true },
      },
    },
    orderBy: { createdAt: "desc" as const },
    take: 3,
  },
  _count: {
    select: {
      servicios: {
        where: { estado: PACIENTE_SERVICIO_ESTADO.ACTIVA },
      },
    },
  },
} satisfies Prisma.PacienteInclude;

export type PacienteListRow = Prisma.PacienteGetPayload<{
  include: typeof pacienteListInclude;
}>;

export const pacienteDetailInclude = {
  obraSocial: true,
  historiaClinica: {
    select: { id: true },
  },
  servicios: {
    orderBy: { createdAt: "desc" as const },
    include: {
      prestadoresAsignados: {
        include: {
          prestador: {
            include: {
              user: {
                select: { nombre: true },
              },
            },
          },
        },
        orderBy: { prestadorId: "asc" as const },
      },
      prestador: {
        include: {
          user: {
            select: { nombre: true },
          },
        },
      },
      servicio: {
        include: {
          tarifas: {
            orderBy: [{ tipoJornada: "asc" as const }, { tipoDia: "asc" as const }],
          },
        },
      },
    },
  },
} satisfies Prisma.PacienteInclude;

export type PacienteDetailRow = Prisma.PacienteGetPayload<{
  include: typeof pacienteDetailInclude;
}>;
