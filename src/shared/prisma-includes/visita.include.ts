import type { Prisma } from "@prisma/client";

export const visitaDetailInclude = {
  prestador: {
    include: {
      user: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
    },
  },
  pacienteServicio: {
    include: {
      paciente: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          numeroDocumento: true,
          direccion: true,
          localidad: true,
        },
      },
      servicio: {
        select: {
          id: true,
          nombre: true,
          controlHorario: true,
        },
      },
    },
  },
  insumos: {
    include: {
      insumo: true,
    },
    orderBy: { id: "asc" as const },
  },
  finanzas: true,
} satisfies Prisma.VisitaInclude;

export type VisitaDetail = Prisma.VisitaGetPayload<{
  include: typeof visitaDetailInclude;
}>;
