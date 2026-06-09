import type { Prisma } from "@prisma/client";

export const servicioWithTarifasInclude = {
  tarifas: {
    orderBy: [{ tipoJornada: "asc" as const }, { tipoDia: "asc" as const }],
  },
  pacienteServicios: {
    orderBy: [{ estado: "asc" as const }, { createdAt: "desc" as const }],
    include: {
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
    },
  },
} satisfies Prisma.ServicioInclude;

export type ServicioWithTarifasRow = Prisma.ServicioGetPayload<{
  include: typeof servicioWithTarifasInclude;
}>;
