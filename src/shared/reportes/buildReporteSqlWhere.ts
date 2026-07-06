import { Prisma } from "@prisma/client";

export interface ReporteSqlFiltros {
  fechaDesde?: Date | undefined;
  fechaHasta?: Date | undefined;
  prestadorId?: number | undefined;
  prestadorIds?: number[] | undefined;
  servicioId?: number | undefined;
  facturado?: boolean | undefined;
  pagado?: boolean | undefined;
}

/**
 * Construye la cláusula WHERE para agregaciones de reportes sobre visitas + visita_finanzas.
 * Requiere alias `v` (visitas), `vf` (visita_finanzas) y, si aplica filtro por servicio, join con `ps`.
 */
export function buildReporteVisitaWhere(filtros: ReporteSqlFiltros): Prisma.Sql {
  const clauses: Prisma.Sql[] = [];

  if (filtros.fechaDesde !== undefined) {
    clauses.push(Prisma.sql`v.fecha_inicio >= ${filtros.fechaDesde}`);
  }

  if (filtros.fechaHasta !== undefined) {
    clauses.push(Prisma.sql`v.fecha_inicio <= ${filtros.fechaHasta}`);
  }

  if (filtros.prestadorId !== undefined) {
    clauses.push(Prisma.sql`v.prestador_id = ${filtros.prestadorId}`);
  }

  if (filtros.prestadorIds !== undefined && filtros.prestadorIds.length > 0) {
    clauses.push(Prisma.sql`v.prestador_id IN (${Prisma.join(filtros.prestadorIds)})`);
  }

  if (filtros.servicioId !== undefined) {
    clauses.push(Prisma.sql`ps.servicio_id = ${filtros.servicioId}`);
  }

  if (filtros.facturado !== undefined) {
    clauses.push(Prisma.sql`vf.facturado = ${filtros.facturado}`);
  }

  if (filtros.pagado !== undefined) {
    clauses.push(Prisma.sql`vf.pagado = ${filtros.pagado}`);
  }

  if (clauses.length === 0) {
    return Prisma.sql`1 = 1`;
  }

  return Prisma.join(clauses, " AND ");
}
