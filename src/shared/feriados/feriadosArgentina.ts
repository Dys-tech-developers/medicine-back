import {
  addCalendarDays,
  ARGENTINA_TIME_ZONE,
  getCalendarPartsInTimeZone,
  getDayOfWeek,
  toDateKey,
  type CalendarDateParts,
} from "../date/calendarDate.js";
import { calcularDomingoDePascua } from "./calcularPascua.js";
import { getPuentesTuristicosForYear } from "./puentesTuristicos.js";

/** Mes 0-indexado, según Ley 27.399 (feriados inamovibles). */
const FERIADOS_INAMOVIBLES_FIJOS = [
  [0, 1],
  [2, 24],
  [3, 2],
  [4, 1],
  [4, 25],
  [5, 20],
  [6, 9],
  [11, 8],
  [11, 25],
] as const;

/** Feriados trasladables (art. 6 Ley 27.399). */
const FERIADOS_TRASLADABLES_FIJOS = [
  [5, 17],
  [7, 17],
  [9, 12],
  [10, 20],
] as const;

function trasladarFeriado(parts: CalendarDateParts): CalendarDateParts {
  const dayOfWeek = getDayOfWeek(parts);

  if (dayOfWeek === 2) {
    return addCalendarDays(parts, -1);
  }
  if (dayOfWeek === 3) {
    return addCalendarDays(parts, -2);
  }
  if (dayOfWeek === 4) {
    return addCalendarDays(parts, 4);
  }
  if (dayOfWeek === 5) {
    return addCalendarDays(parts, 3);
  }

  return parts;
}

function buildFeriadosForYear(year: number): Set<string> {
  const feriados = new Set<string>();

  for (const [month, day] of FERIADOS_INAMOVIBLES_FIJOS) {
    feriados.add(toDateKey({ year, month, day }));
  }

  for (const [month, day] of FERIADOS_TRASLADABLES_FIJOS) {
    feriados.add(toDateKey(trasladarFeriado({ year, month, day })));
  }

  const pascua = calcularDomingoDePascua(year);
  feriados.add(toDateKey(addCalendarDays(pascua, -48)));
  feriados.add(toDateKey(addCalendarDays(pascua, -47)));
  feriados.add(toDateKey(addCalendarDays(pascua, -3)));
  feriados.add(toDateKey(addCalendarDays(pascua, -2)));

  for (const puente of getPuentesTuristicosForYear(year)) {
    feriados.add(puente);
  }

  return feriados;
}

const feriadosPorAnio = new Map<number, Set<string>>();

function getFeriadosForYear(year: number): Set<string> {
  let feriados = feriadosPorAnio.get(year);
  if (!feriados) {
    feriados = buildFeriadosForYear(year);
    feriadosPorAnio.set(year, feriados);
  }
  return feriados;
}

/** `true` si la fecha cae en un feriado o día no laborable nacional argentino. */
export function isFeriadoArgentina(fecha: Date): boolean {
  const parts = getCalendarPartsInTimeZone(fecha, ARGENTINA_TIME_ZONE);
  return getFeriadosForYear(parts.year).has(toDateKey(parts));
}
