import type { PeriodoControl } from "../constants/periodo-control.js";

export interface PacienteServicioDisponibilidadDto {
  pacienteServicioId: number;
  periodoControl: PeriodoControl;
  cantidadPermitida: number;
  cantidadUtilizada: number;
  cantidadDisponible: number;
  fechaInicioPeriodo: string;
  fechaFinPeriodo: string;
  /** Ej. `"0/1"` en diario si aún falta uso; igual esquema `${utilizada}/${permitida}`. */
  utilizadoYPemitido: string;
}

export function asDisponibilidadDto(params: {
  pacienteServicioId: number;
  periodoControl: PeriodoControl;
  cantidadPermitida: number;
  cantidadUtilizada: number;
  inicio: Date;
  fin: Date;
}): PacienteServicioDisponibilidadDto {
  const disponible = params.cantidadPermitida - params.cantidadUtilizada;
  return {
    pacienteServicioId: params.pacienteServicioId,
    periodoControl: params.periodoControl,
    cantidadPermitida: params.cantidadPermitida,
    cantidadUtilizada: params.cantidadUtilizada,
    cantidadDisponible: disponible,
    fechaInicioPeriodo: params.inicio.toISOString(),
    fechaFinPeriodo: params.fin.toISOString(),
    utilizadoYPemitido: `${params.cantidadUtilizada}/${params.cantidadPermitida}`,
  };
}
