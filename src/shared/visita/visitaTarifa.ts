import type { Decimal } from "@prisma/client/runtime/library";
import type { ModalidadCobro } from "../constants/modalidad-cobro.js";
import type { TipoDia, TipoJornada } from "../constants/tarifa.js";

const HORA_INICIO_DIURNO = 6;
const HORA_FIN_DIURNO = 20;

export function addMinutesToDate(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function resolveTipoJornada(fechaInicio: Date): TipoJornada {
  const hour = fechaInicio.getHours();
  if (hour >= HORA_INICIO_DIURNO && hour < HORA_FIN_DIURNO) {
    return "diurno";
  }
  return "nocturno";
}

export function resolveTipoDia(fechaInicio: Date): TipoDia {
  const day = fechaInicio.getDay();
  if (day === 0) {
    return "domingo";
  }
  if (day === 6) {
    return "sabado";
  }
  return "habil";
}

export function calcularValorAplicado(
  modalidadCobro: ModalidadCobro,
  valorUnitario: Decimal,
  tiempoMinutos: number,
): Decimal {
  if (modalidadCobro === "por_hora") {
    return valorUnitario.mul(tiempoMinutos).div(60).toDecimalPlaces(2);
  }
  return valorUnitario.toDecimalPlaces(2);
}

export function resolveFechaFin(
  fechaInicio: Date,
  tiempoMinutos: number,
  fechaFin?: Date,
): Date {
  return fechaFin ?? addMinutesToDate(fechaInicio, tiempoMinutos);
}
