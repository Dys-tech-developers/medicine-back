import type { Prisma } from "@prisma/client";

export const pacienteServicioDetailInclude = {
  paciente: {
    select: {
      id: true,
      nombre: true,
      apellido: true,
      numeroDocumento: true,
      codigoQr: true,
      direccion: true,
      localidad: true,
    },
  },
  servicio: {
    select: {
      id: true,
      nombre: true,
      estado: true,
      controlHorario: true,
      modoRelevo: true,
    },
  },
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
  prestadoresAsignados: {
    include: {
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
    },
    orderBy: { prestadorId: "asc" as const },
  },
} satisfies Prisma.PacienteServicioInclude;

export type PacienteServicioDetail = Prisma.PacienteServicioGetPayload<{
  include: typeof pacienteServicioDetailInclude;
}>;
