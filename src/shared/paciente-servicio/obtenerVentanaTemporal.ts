import type { PeriodoControl } from "../constants/periodo-control.js";

/** Inicio del día calendario en la zona horaria local del proceso (Node). */
function inicioDelDiaLocal(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);
}

/** Fin del día calendario local, inclusive para comparar con `fechaInicio`. */
function finDelDiaLocalInclusive(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999);
}

/** Semana dominical → domingo 00:00 a sábado 23:59:59.999 local. */
function inicioSemanaDominical(ref: Date): Date {
  const día = ref.getDay();
  const base = inicioDelDiaLocal(ref);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() - día);
}

function finSemanaDominicalInclusive(ref: Date): Date {
  const domingo = inicioSemanaDominical(ref);
  return finDelDiaLocalInclusive(new Date(domingo.getFullYear(), domingo.getMonth(), domingo.getDate() + 6));
}

/** Mes calendario local desde el día 1 (00:00) hasta último día (23:59:59.999). */
function inicioMesCalendarioLocal(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
}

function finMesCalendarioLocalInclusive(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Devuelve [inicio, fin] inclusivos para contar visitas con `fechaInicio`
 * dentro del período de control vigente según la fecha de referencia.
 */
export function obtenerVentanaTemporal(
  periodoControl: PeriodoControl,
  referencia: Date,
): { inicio: Date; fin: Date } {
  switch (periodoControl) {
    case "diario":
      return {
        inicio: inicioDelDiaLocal(referencia),
        fin: finDelDiaLocalInclusive(referencia),
      };
    case "semanal":
      return {
        inicio: inicioSemanaDominical(referencia),
        fin: finSemanaDominicalInclusive(referencia),
      };
    case "mensual":
      return {
        inicio: inicioMesCalendarioLocal(referencia),
        fin: finMesCalendarioLocalInclusive(referencia),
      };
  }
}
