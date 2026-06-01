import { AppError } from "../../core/errors/AppError.js";
import type { PeriodoControl } from "../constants/periodo-control.js";
import type { ReporteSqlFiltros } from "./buildReporteSqlWhere.js";
import {
  assertRangoFechasValido,
  resolveRangoFechasReporte,
  type RangoFechasReporte,
} from "./resolveRangoFechasReporte.js";

export interface EstadoCuentaPeriodoQuery {
  periodo?: PeriodoControl | undefined;
  fechaDesde?: Date | undefined;
  fechaHasta?: Date | undefined;
}

export function resolveEstadoCuentaFiltros(query: EstadoCuentaPeriodoQuery): {
  filtros: ReporteSqlFiltros;
  rango: RangoFechasReporte;
} {
  const rango = resolveRangoFechasReporte({
    periodo: query.periodo,
    fechaDesde: query.fechaDesde,
    fechaHasta: query.fechaHasta,
  });

  try {
    assertRangoFechasValido(rango);
  } catch {
    throw AppError.badRequest("fechaDesde no puede ser posterior a fechaHasta");
  }

  const filtros: ReporteSqlFiltros = {
    fechaDesde: rango.fechaDesde,
    fechaHasta: rango.fechaHasta,
  };

  return { filtros, rango };
}
