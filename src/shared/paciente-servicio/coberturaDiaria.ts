import { ARGENTINA_TIME_ZONE } from "../date/calendarDate.js";

const HORA_MINUTO_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function esHoraMinutoValida(value: string): boolean {
  return HORA_MINUTO_REGEX.test(value);
}

export function parseHoraMinutos(hora: string): number {
  const [horasStr, minutosStr] = hora.split(":");
  const horas = Number(horasStr);
  const minutos = Number(minutosStr);
  return horas * 60 + minutos;
}

export function getMinutosDelDiaEnZona(
  date: Date,
  timeZone: string = ARGENTINA_TIME_ZONE,
): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hourPart = parts.find((p) => p.type === "hour");
  const minutePart = parts.find((p) => p.type === "minute");
  if (!hourPart || !minutePart) {
    throw new Error("No se pudo obtener la hora en la zona horaria indicada");
  }
  return Number(hourPart.value) * 60 + Number(minutePart.value);
}

/** Ambos null = cobertura las 24 h del día (dentro de la vigencia de fechas). */
export function tieneVentanaDiariaConfigurada(
  inicio: string | null | undefined,
  fin: string | null | undefined,
): boolean {
  return inicio != null && fin != null;
}

/**
 * Indica si `referencia` cae dentro del horario diario autorizado.
 * Soporta ventanas que cruzan medianoche (ej. 22:00–06:00).
 */
export function estaDentroVentanaCoberturaDiaria(
  inicio: string | null | undefined,
  fin: string | null | undefined,
  referencia: Date = new Date(),
  timeZone: string = ARGENTINA_TIME_ZONE,
): boolean {
  if (!tieneVentanaDiariaConfigurada(inicio, fin)) {
    return true;
  }

  const minutosAhora = getMinutosDelDiaEnZona(referencia, timeZone);
  const minInicio = parseHoraMinutos(inicio!);
  const minFin = parseHoraMinutos(fin!);

  if (minInicio === minFin) {
    return false;
  }

  if (minInicio < minFin) {
    return minutosAhora >= minInicio && minutosAhora < minFin;
  }

  return minutosAhora >= minInicio || minutosAhora < minFin;
}

export function validarCoberturaDiaria(
  inicio: string | null | undefined,
  fin: string | null | undefined,
): string | null {
  const tieneInicio = inicio != null && inicio !== "";
  const tieneFin = fin != null && fin !== "";

  if (!tieneInicio && !tieneFin) {
    return null;
  }

  if (tieneInicio !== tieneFin) {
    return "Debe indicar hora de inicio y fin de la cobertura diaria, o dejar ambas vacías para 24 horas.";
  }

  if (!esHoraMinutoValida(inicio!)) {
    return "La hora de inicio debe tener formato HH:mm (00:00–23:59).";
  }

  if (!esHoraMinutoValida(fin!)) {
    return "La hora de fin debe tener formato HH:mm (00:00–23:59).";
  }

  if (inicio === fin) {
    return "La hora de inicio y fin no pueden ser iguales; dejá ambas vacías si la cobertura es las 24 horas.";
  }

  return null;
}

export function normalizarCoberturaDiaria(
  inicio: string | null | undefined,
  fin: string | null | undefined,
): { coberturaDiariaInicio: string | null; coberturaDiariaFin: string | null } {
  if (inicio == null || inicio === "" || fin == null || fin === "") {
    return { coberturaDiariaInicio: null, coberturaDiariaFin: null };
  }
  return { coberturaDiariaInicio: inicio, coberturaDiariaFin: fin };
}
