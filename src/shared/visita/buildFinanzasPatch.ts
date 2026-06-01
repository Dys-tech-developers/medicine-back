import type { Prisma, VisitaFinanzas } from "@prisma/client";

export interface FinanzasPatchInput {
  facturado?: boolean | undefined;
  pagado?: boolean | undefined;
}

export function buildFinanzasPatch(
  input: FinanzasPatchInput,
  existing: VisitaFinanzas,
  now: Date = new Date(),
): Prisma.VisitaFinanzasUpdateInput {
  const data: Prisma.VisitaFinanzasUpdateInput = {};

  if (input.facturado !== undefined) {
    data.facturado = input.facturado;
    data.fechaFacturacion = input.facturado
      ? (existing.fechaFacturacion ?? now)
      : null;
  }

  if (input.pagado !== undefined) {
    data.pagado = input.pagado;
    data.fechaPago = input.pagado ? (existing.fechaPago ?? now) : null;
  }

  return data;
}
