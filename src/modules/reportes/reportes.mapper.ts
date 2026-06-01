import type { RangoFechasReporte } from "../../shared/reportes/resolveRangoFechasReporte.js";
import {
  formatMontoReporte,
  minutosAHoras,
  toNumberAgregado,
} from "../../shared/reportes/formatReporteMontos.js";
import {
  mapResumenFinancieroRow,
  type RawResumenFinancieroRow,
  type ResumenFinancieroDto,
} from "../../shared/reportes/mapResumenFinancieroRow.js";
import { resolveEstadoCobro } from "../../shared/reportes/resolveEstadoCobro.js";
import type { VisitaDetail } from "../../shared/prisma-includes/visita.include.js";
import type {
  ReporteMetaDto,
  ReportePrestadorItemDto,
  ReportePrestadoresResponseDto,
  ReporteServicioItemDto,
  ReporteServiciosResponseDto,
  ReporteVisitaItemDto,
  ReporteVisitasResponseDto,
} from "./reportes.dto.js";
import type { ReportesQuery, ReportesVisitasQuery } from "./reportes.validation.js";
import type {
  PaginatedReporteVisitas,
  RawReportePrestadorRow,
  RawReporteServicioRow,
} from "./reportes.repository.js";

function toIsoOrNull(date: Date | undefined): string | null {
  return date !== undefined ? date.toISOString() : null;
}

export function buildReporteMeta(
  query: ReportesQuery,
  rango: RangoFechasReporte,
): ReporteMetaDto {
  return {
    fechaDesde: toIsoOrNull(rango.fechaDesde),
    fechaHasta: toIsoOrNull(rango.fechaHasta),
    periodo: rango.periodoAplicado ?? query.periodo ?? null,
    prestadorId: query.prestadorId ?? null,
    servicioId: query.servicioId ?? null,
    facturado: query.facturado ?? null,
    pagado: query.pagado ?? null,
  };
}

function mapFinanzasFromAggregateRow(
  row: RawResumenFinancieroRow | RawReportePrestadorRow | RawReporteServicioRow,
): ResumenFinancieroDto {
  return mapResumenFinancieroRow(row);
}

function mapPrestadorRow(row: RawReportePrestadorRow): ReportePrestadorItemDto {
  const tiempoMinutos = toNumberAgregado(row.tiempo_minutos_total);

  return {
    prestadorId: row.prestador_id,
    cantidadVisitas: toNumberAgregado(row.cantidad_visitas),
    horasTrabajadas: minutosAHoras(tiempoMinutos),
    finanzas: mapFinanzasFromAggregateRow(row),
  };
}

function mapServicioRow(row: RawReporteServicioRow): ReporteServicioItemDto {
  const tiempoMinutos = toNumberAgregado(row.tiempo_minutos_total);

  return {
    servicioId: row.servicio_id,
    nombreServicio: row.nombre_servicio,
    cantidadVisitas: toNumberAgregado(row.cantidad_visitas),
    horasTotales: minutosAHoras(tiempoMinutos),
    finanzas: mapFinanzasFromAggregateRow(row),
  };
}

function mapVisitaRow(visita: VisitaDetail): ReporteVisitaItemDto {
  if (!visita.finanzas) {
    throw new Error(`Visita ${visita.id} sin finanzas en reporte`);
  }

  const { finanzas } = visita;

  return {
    id: visita.id,
    fechaInicio: visita.fechaInicio.toISOString(),
    tiempoMinutos: visita.tiempoMinutos,
    horas: minutosAHoras(visita.tiempoMinutos),
    prestadorId: visita.prestadorId,
    prestadorNombre: visita.prestador.user.nombre,
    servicioId: visita.pacienteServicio.servicio.id,
    servicioNombre: visita.pacienteServicio.servicio.nombre,
    pacienteId: visita.pacienteServicio.paciente.id,
    pacienteNombre: visita.pacienteServicio.paciente.nombre,
    pacienteApellido: visita.pacienteServicio.paciente.apellido,
    finanzas: {
      valorAplicado: formatMontoReporte(finanzas.valorAplicado.toString()),
      facturado: finanzas.facturado,
      pagado: finanzas.pagado,
      fechaFacturacion: finanzas.fechaFacturacion?.toISOString() ?? null,
      fechaPago: finanzas.fechaPago?.toISOString() ?? null,
      estadoCobro: resolveEstadoCobro(finanzas.facturado, finanzas.pagado),
    },
  };
}

export function mapReportePrestadores(
  rows: RawReportePrestadorRow[],
  resumenRow: RawResumenFinancieroRow,
  query: ReportesQuery,
  rango: RangoFechasReporte,
): ReportePrestadoresResponseDto {
  return {
    items: rows.map(mapPrestadorRow),
    meta: buildReporteMeta(query, rango),
    resumen: mapResumenFinancieroRow(resumenRow),
  };
}

export function mapReporteServicios(
  rows: RawReporteServicioRow[],
  resumenRow: RawResumenFinancieroRow,
  query: ReportesQuery,
  rango: RangoFechasReporte,
): ReporteServiciosResponseDto {
  return {
    items: rows.map(mapServicioRow),
    meta: buildReporteMeta(query, rango),
    resumen: mapResumenFinancieroRow(resumenRow),
  };
}

export function mapReporteVisitas(
  result: PaginatedReporteVisitas,
  resumenRow: RawResumenFinancieroRow,
  query: ReportesVisitasQuery,
  rango: RangoFechasReporte,
): ReporteVisitasResponseDto {
  return {
    items: result.items.map(mapVisitaRow),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    meta: buildReporteMeta(query, rango),
    resumen: mapResumenFinancieroRow(resumenRow),
  };
}
