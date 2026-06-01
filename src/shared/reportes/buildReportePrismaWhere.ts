import type { Prisma } from "@prisma/client";
import type { ReporteSqlFiltros } from "./buildReporteSqlWhere.js";

/** Filtros de reportes como `VisitaWhereInput` (solo visitas con finanzas). */
export function buildReportePrismaWhere(filtros: ReporteSqlFiltros): Prisma.VisitaWhereInput {
  const where: Prisma.VisitaWhereInput = {
    finanzas: { isNot: null },
  };

  if (filtros.prestadorId !== undefined) {
    where.prestadorId = filtros.prestadorId;
  }

  if (filtros.fechaDesde !== undefined || filtros.fechaHasta !== undefined) {
    where.fechaInicio = {};
    if (filtros.fechaDesde !== undefined) {
      where.fechaInicio.gte = filtros.fechaDesde;
    }
    if (filtros.fechaHasta !== undefined) {
      where.fechaInicio.lte = filtros.fechaHasta;
    }
  }

  if (filtros.servicioId !== undefined) {
    where.pacienteServicio = { servicioId: filtros.servicioId };
  }

  const finanzasWhere: Prisma.VisitaFinanzasWhereInput = {};

  if (filtros.facturado !== undefined) {
    finanzasWhere.facturado = filtros.facturado;
  }

  if (filtros.pagado !== undefined) {
    finanzasWhere.pagado = filtros.pagado;
  }

  if (Object.keys(finanzasWhere).length > 0) {
    where.finanzas = { is: finanzasWhere };
  }

  return where;
}
