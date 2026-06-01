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
        },
      },
      servicio: {
        select: {
          id: true,
          nombre: true,
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
