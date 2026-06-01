import type { Prisma } from "@prisma/client";

export const visitaInsumoWithInsumoInclude = {
  insumo: true,
} satisfies Prisma.VisitaInsumoInclude;

export type VisitaInsumoWithInsumo = Prisma.VisitaInsumoGetPayload<{
  include: typeof visitaInsumoWithInsumoInclude;
}>;
