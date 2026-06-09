import { AppError } from "../../core/errors/AppError.js";
import { PERIODOS_CONTROL } from "../constants/periodo-control.js";
import type { PeriodoControl } from "../constants/periodo-control.js";
import { obtenerVentanaTemporal } from "./obtenerVentanaTemporal.js";

export interface AssertCupoDisponibleParams {
  pacienteServicioId: number;
  periodoControl: string;
  cantidadPermitida: number;
  modalidadCobro: string;
  fechaReferencia: Date;
  countVisitasEnVentana: (
    pacienteServicioId: number,
    desdeInclusive: Date,
    hastaInclusive: Date,
    excludeVisitaId?: number,
  ) => Promise<number>;
  excludeVisitaId?: number | undefined;
}

/**
 * Valida que la asignación tenga cupo en la ventana del período de control
 * correspondiente a `fechaReferencia`. No aplica cuando `modalidadCobro` es `por_hora`.
 */
export async function assertCupoDisponibleParaVisita(
  params: AssertCupoDisponibleParams,
): Promise<void> {
  if (params.modalidadCobro === "por_hora") {
    return;
  }

  if (!(PERIODOS_CONTROL as readonly string[]).includes(params.periodoControl)) {
    throw AppError.badRequest(`Valor de periodoControl no soportado: ${params.periodoControl}`);
  }

  const periodoControl = params.periodoControl as PeriodoControl;
  const { inicio, fin } = obtenerVentanaTemporal(periodoControl, params.fechaReferencia);
  const cantidadUtilizada = await params.countVisitasEnVentana(
    params.pacienteServicioId,
    inicio,
    fin,
    params.excludeVisitaId,
  );

  if (cantidadUtilizada >= params.cantidadPermitida) {
    throw AppError.conflict(
      `Cupo agotado para el período ${periodoControl}: ${cantidadUtilizada}/${params.cantidadPermitida} visitas utilizadas`,
    );
  }
}
