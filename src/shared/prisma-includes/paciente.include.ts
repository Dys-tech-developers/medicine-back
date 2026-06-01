import type { Prisma } from "@prisma/client";

export const pacienteObraSocialInclude = {
  obraSocial: true,
} satisfies Prisma.PacienteInclude;

export type PacienteWithObraSocialRow = Prisma.PacienteGetPayload<{
  include: typeof pacienteObraSocialInclude;
}>;

export const pacienteDetailInclude = {
  obraSocial: true,
  servicios: {
    orderBy: { createdAt: "desc" as const },
    include: {
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
