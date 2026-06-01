import type { Prisma } from "@prisma/client";

export const evolucionClinicaInclude = {
  historiaClinica: {
    select: {
      id: true,
      pacienteId: true,
    },
  },
} satisfies Prisma.EvolucionClinicaInclude;

export type EvolucionClinicaRow = Prisma.EvolucionClinicaGetPayload<{
  include: typeof evolucionClinicaInclude;
}>;
