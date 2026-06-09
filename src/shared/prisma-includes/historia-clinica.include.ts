import type { Prisma } from "@prisma/client";

export const historiaClinicaWithPacienteInclude = {
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
} satisfies Prisma.HistoriaClinicaInclude;

export const historiaClinicaDetailInclude = {
  ...historiaClinicaWithPacienteInclude,
  evoluciones: {
    orderBy: { fecha: "desc" as const },
  },
} satisfies Prisma.HistoriaClinicaInclude;

export type HistoriaClinicaWithPaciente = Prisma.HistoriaClinicaGetPayload<{
  include: typeof historiaClinicaWithPacienteInclude;
}>;

export type HistoriaClinicaDetail = Prisma.HistoriaClinicaGetPayload<{
  include: typeof historiaClinicaDetailInclude;
}>;
