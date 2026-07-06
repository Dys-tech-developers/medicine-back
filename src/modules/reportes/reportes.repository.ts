import { Prisma, type PrismaClient } from "@prisma/client";
import {
  buildReporteVisitaWhere,
  type ReporteSqlFiltros,
} from "../../shared/reportes/buildReporteSqlWhere.js";
import { buildReportePrismaWhere } from "../../shared/reportes/buildReportePrismaWhere.js";
import type { RawResumenFinancieroRow } from "../../shared/reportes/mapResumenFinancieroRow.js";
import {
  visitaDetailInclude,
  type VisitaDetail,
} from "../../shared/prisma-includes/visita.include.js";

export interface RawReportePrestadorRow {
  prestador_id: number;
  cantidad_visitas: number | bigint;
  tiempo_minutos_total: number | bigint | null;
  total_generado: number | string | null;
  pendiente_facturacion: number | string | null;
  facturado_pendiente_pago: number | string | null;
  pagado: number | string | null;
  cantidad_pendiente_facturacion: number | bigint | null;
  cantidad_facturado_pendiente_pago: number | bigint | null;
  cantidad_pagado: number | bigint | null;
}

export interface RawReporteServicioRow {
  servicio_id: number;
  nombre_servicio: string;
  cantidad_visitas: number | bigint;
  tiempo_minutos_total: number | bigint | null;
  total_generado: number | string | null;
  pendiente_facturacion: number | string | null;
  facturado_pendiente_pago: number | string | null;
  pagado: number | string | null;
  cantidad_pendiente_facturacion: number | bigint | null;
  cantidad_facturado_pendiente_pago: number | bigint | null;
  cantidad_pagado: number | bigint | null;
}

export interface PaginatedReporteVisitas {
  items: VisitaDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export class ReportesRepository {
  constructor(private readonly db: PrismaClient) {}

  private joinPacienteServicio(filtros: ReporteSqlFiltros): Prisma.Sql {
    return filtros.servicioId !== undefined
      ? Prisma.sql`INNER JOIN paciente_servicios ps ON ps.id = v.paciente_servicio_id`
      : Prisma.empty;
  }

  private baseFromJoin(filtros: ReporteSqlFiltros): Prisma.Sql {
    const joinPs = this.joinPacienteServicio(filtros);
    return Prisma.sql`
      FROM visitas v
      INNER JOIN visita_finanzas vf ON vf.visita_id = v.id
      ${joinPs}
    `;
  }

  async aggregateResumenGlobal(filtros: ReporteSqlFiltros): Promise<RawResumenFinancieroRow> {
    const where = buildReporteVisitaWhere(filtros);
    const fromJoin = this.baseFromJoin(filtros);

    const rows = await this.db.$queryRaw<RawResumenFinancieroRow[]>`
      SELECT
        CAST(COALESCE(SUM(vf.valor_aplicado), 0) AS TEXT) AS total_generado,
        CAST(COALESCE(SUM(CASE WHEN NOT vf.facturado THEN vf.valor_aplicado ELSE 0 END), 0) AS TEXT) AS pendiente_facturacion,
        CAST(COALESCE(SUM(CASE WHEN vf.facturado AND NOT vf.pagado THEN vf.valor_aplicado ELSE 0 END), 0) AS TEXT) AS facturado_pendiente_pago,
        CAST(COALESCE(SUM(CASE WHEN vf.pagado THEN vf.valor_aplicado ELSE 0 END), 0) AS TEXT) AS pagado,
        COUNT(CASE WHEN NOT vf.facturado THEN 1 END) AS cantidad_pendiente_facturacion,
        COUNT(CASE WHEN vf.facturado AND NOT vf.pagado THEN 1 END) AS cantidad_facturado_pendiente_pago,
        COUNT(CASE WHEN vf.pagado THEN 1 END) AS cantidad_pagado
      ${fromJoin}
      WHERE ${where}
    `;

    return (
      rows[0] ?? {
        total_generado: 0,
        pendiente_facturacion: 0,
        facturado_pendiente_pago: 0,
        pagado: 0,
        cantidad_pendiente_facturacion: 0,
        cantidad_facturado_pendiente_pago: 0,
        cantidad_pagado: 0,
      }
    );
  }

  async findVisitasPaginated(
    page: number,
    pageSize: number,
    filtros: ReporteSqlFiltros,
  ): Promise<PaginatedReporteVisitas> {
    const where = buildReportePrismaWhere(filtros);
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.db.visita.findMany({
        where,
        include: visitaDetailInclude,
        orderBy: { fechaInicio: "desc" },
        skip,
        take: pageSize,
      }),
      this.db.visita.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async aggregatePorPrestador(filtros: ReporteSqlFiltros): Promise<RawReportePrestadorRow[]> {
    const where = buildReporteVisitaWhere(filtros);
    const fromJoin = this.baseFromJoin(filtros);

    return this.db.$queryRaw<RawReportePrestadorRow[]>`
      SELECT
        v.prestador_id AS prestador_id,
        COUNT(v.id) AS cantidad_visitas,
        COALESCE(SUM(v.tiempo_minutos), 0) AS tiempo_minutos_total,
        CAST(COALESCE(SUM(vf.valor_aplicado), 0) AS TEXT) AS total_generado,
        CAST(COALESCE(SUM(CASE WHEN NOT vf.facturado THEN vf.valor_aplicado ELSE 0 END), 0) AS TEXT) AS pendiente_facturacion,
        CAST(COALESCE(SUM(CASE WHEN vf.facturado AND NOT vf.pagado THEN vf.valor_aplicado ELSE 0 END), 0) AS TEXT) AS facturado_pendiente_pago,
        CAST(COALESCE(SUM(CASE WHEN vf.pagado THEN vf.valor_aplicado ELSE 0 END), 0) AS TEXT) AS pagado,
        COUNT(CASE WHEN NOT vf.facturado THEN 1 END) AS cantidad_pendiente_facturacion,
        COUNT(CASE WHEN vf.facturado AND NOT vf.pagado THEN 1 END) AS cantidad_facturado_pendiente_pago,
        COUNT(CASE WHEN vf.pagado THEN 1 END) AS cantidad_pagado
      ${fromJoin}
      WHERE ${where}
      GROUP BY v.prestador_id
      ORDER BY v.prestador_id ASC
    `;
  }

  async aggregatePorServicio(filtros: ReporteSqlFiltros): Promise<RawReporteServicioRow[]> {
    const where = buildReporteVisitaWhere(filtros);

    return this.db.$queryRaw<RawReporteServicioRow[]>`
      SELECT
        s.id AS servicio_id,
        s.nombre AS nombre_servicio,
        COUNT(v.id) AS cantidad_visitas,
        COALESCE(SUM(v.tiempo_minutos), 0) AS tiempo_minutos_total,
        CAST(COALESCE(SUM(vf.valor_aplicado), 0) AS TEXT) AS total_generado,
        CAST(COALESCE(SUM(CASE WHEN NOT vf.facturado THEN vf.valor_aplicado ELSE 0 END), 0) AS TEXT) AS pendiente_facturacion,
        CAST(COALESCE(SUM(CASE WHEN vf.facturado AND NOT vf.pagado THEN vf.valor_aplicado ELSE 0 END), 0) AS TEXT) AS facturado_pendiente_pago,
        CAST(COALESCE(SUM(CASE WHEN vf.pagado THEN vf.valor_aplicado ELSE 0 END), 0) AS TEXT) AS pagado,
        COUNT(CASE WHEN NOT vf.facturado THEN 1 END) AS cantidad_pendiente_facturacion,
        COUNT(CASE WHEN vf.facturado AND NOT vf.pagado THEN 1 END) AS cantidad_facturado_pendiente_pago,
        COUNT(CASE WHEN vf.pagado THEN 1 END) AS cantidad_pagado
      FROM visitas v
      INNER JOIN visita_finanzas vf ON vf.visita_id = v.id
      INNER JOIN paciente_servicios ps ON ps.id = v.paciente_servicio_id
      INNER JOIN servicios s ON s.id = ps.servicio_id
      WHERE ${where}
      GROUP BY s.id, s.nombre
      ORDER BY s.nombre ASC
    `;
  }
}
