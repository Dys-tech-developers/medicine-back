import { addMinutesToDate } from "./visitaTarifa.js";

const OBSERVACION_CIERRE_AUTOMATICO =
  "Cierre automático: se superó el límite de horas autorizadas de la asignación.";

/** Fecha/hora en que vence una visita según las horas autorizadas de la asignación. */
export function calcularFechaLimiteVisita(fechaInicio: Date, cantidadHoras: number): Date {
  return addMinutesToDate(fechaInicio, cantidadHoras * 60);
}

/** Indica si la visita superó el límite de horas (requiere `cantidadHoras` configurada). */
export function estaVisitaVencida(
  fechaInicio: Date,
  cantidadHoras: number | null,
  referencia: Date = new Date(),
): boolean {
  if (cantidadHoras == null || cantidadHoras < 1) {
    return false;
  }
  return referencia.getTime() >= calcularFechaLimiteVisita(fechaInicio, cantidadHoras).getTime();
}

export function calcularFechaLimiteVisitaOpcional(
  fechaInicio: Date,
  cantidadHoras: number | null,
): Date | null {
  if (cantidadHoras == null || cantidadHoras < 1) {
    return null;
  }
  return calcularFechaLimiteVisita(fechaInicio, cantidadHoras);
}

/** Minutos máximos facturables según `cantidadHoras` de la asignación. */
export function maxMinutosAutorizados(cantidadHoras: number | null): number | null {
  if (cantidadHoras == null || cantidadHoras < 1) {
    return null;
  }
  return cantidadHoras * 60;
}

export function acotarTiempoMinutos(tiempoMinutos: number, cantidadHoras: number | null): number {
  const max = maxMinutosAutorizados(cantidadHoras);
  if (max == null) {
    return tiempoMinutos;
  }
  return Math.min(tiempoMinutos, max);
}

export function buildObservacionesCierreAutomatico(observacionesExistentes: string | null): string {
  if (observacionesExistentes?.trim()) {
    return `${observacionesExistentes.trim()}\n${OBSERVACION_CIERRE_AUTOMATICO}`;
  }
  return OBSERVACION_CIERRE_AUTOMATICO;
}
