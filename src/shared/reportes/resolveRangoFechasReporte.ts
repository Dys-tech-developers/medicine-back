import type { PeriodoControl } from "../constants/periodo-control.js";
import { obtenerVentanaTemporal } from "../paciente-servicio/obtenerVentanaTemporal.js";

export interface RangoFechasReporte {
  fechaDesde?: Date;
  fechaHasta?: Date;
  periodoAplicado?: PeriodoControl;
}

export interface ResolverRangoFechasInput {
  periodo?: PeriodoControl | undefined;
  fechaDesde?: Date | undefined;
  fechaHasta?: Date | undefined;
  /** Fecha de referencia para `periodo` (por defecto: ahora). */
  referencia?: Date | undefined;
}

/**
 * Resuelve el rango de fechas del reporte.
 * Las fechas explícitas (`fechaDesde` / `fechaHasta`) tienen prioridad sobre `periodo`.
 */
export function resolveRangoFechasReporte(input: ResolverRangoFechasInput): RangoFechasReporte {
  if (input.fechaDesde !== undefined || input.fechaHasta !== undefined) {
    return {
      fechaDesde: input.fechaDesde,
      fechaHasta: input.fechaHasta,
    };
  }

  if (input.periodo !== undefined) {
    const referencia = input.referencia ?? new Date();
    const ventana = obtenerVentanaTemporal(input.periodo, referencia);
    return {
      fechaDesde: ventana.inicio,
      fechaHasta: ventana.fin,
      periodoAplicado: input.periodo,
    };
  }

  return {};
}

export function assertRangoFechasValido(rango: RangoFechasReporte): void {
  if (
    rango.fechaDesde !== undefined &&
    rango.fechaHasta !== undefined &&
    rango.fechaDesde > rango.fechaHasta
  ) {
    throw new Error("fechaDesde no puede ser posterior a fechaHasta");
  }
}
