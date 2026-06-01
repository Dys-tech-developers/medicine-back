import type { Prisma } from "@prisma/client";

export const pacienteServicioDetailInclude = {
  paciente: {
    select: {
      id: true,
      nombre: true,
      apellido: true,
      numeroDocumento: true,
      codigoQr: true,
    },
  },
  servicio: {
    select: {
      id: true,
      nombre: true,
      estado: true,
    },
  },
} satisfies Prisma.PacienteServicioInclude;

export type PacienteServicioDetail = Prisma.PacienteServicioGetPayload<{
  include: typeof pacienteServicioDetailInclude;
}>;
