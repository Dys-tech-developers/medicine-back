/** Partes de una fecha calendario (mes 0-indexado, como `Date`). */
export interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

export { ARGENTINA_TIME_ZONE };

export function getCalendarPartsInTimeZone(date: Date, timeZone: string): CalendarDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const yearPart = parts.find((p) => p.type === "year");
  const monthPart = parts.find((p) => p.type === "month");
  const dayPart = parts.find((p) => p.type === "day");
  if (!yearPart || !monthPart || !dayPart) {
    throw new Error("No se pudo obtener la fecha en la zona horaria indicada");
  }
  return {
    year: Number(yearPart.value),
    month: Number(monthPart.value) - 1,
    day: Number(dayPart.value),
  };
}

/**
 * Fecha civil de hoy en la zona indicada (p. ej. America/Argentina/Buenos_Aires).
 * Usado para validar `fechaNacimiento` enviada como YYYY-MM-DD.
 */
export function getTodayInTimeZone(timeZone: string): CalendarDateParts {
  return getCalendarPartsInTimeZone(new Date(), timeZone);
}

/**
 * Componentes UTC del día civil de un `Date` coercido desde YYYY-MM-DD (medianoche UTC).
 */
export function getUtcCalendarParts(date: Date): CalendarDateParts {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

function compareCalendarDates(a: CalendarDateParts, b: CalendarDateParts): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  if (a.month !== b.month) {
    return a.month - b.month;
  }
  return a.day - b.day;
}

export function toDateKey(parts: CalendarDateParts): string {
  const month = String(parts.month + 1).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

/** 0 = domingo … 6 = sábado, a partir de un día civil sin hora. */
export function getDayOfWeek(parts: CalendarDateParts): number {
  return new Date(Date.UTC(parts.year, parts.month, parts.day)).getUTCDay();
}

export function addCalendarDays(parts: CalendarDateParts, days: number): CalendarDateParts {
  const date = new Date(Date.UTC(parts.year, parts.month, parts.day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

/**
 * `true` si la fecha de nacimiento es posterior a hoy.
 * El día civil del nacimiento se toma en UTC (coerción Zod de YYYY-MM-DD);
 * "hoy" se calcula en hora Argentina.
 */
export function isBirthDateInFuture(fechaNacimiento: Date): boolean {
  const birth = getUtcCalendarParts(fechaNacimiento);
  const today = getTodayInTimeZone(ARGENTINA_TIME_ZONE);
  return compareCalendarDates(birth, today) > 0;
}
