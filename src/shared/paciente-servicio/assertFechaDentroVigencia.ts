import { AppError } from "../../core/errors/AppError.js";

/** La visita debe caer dentro de [fechaInicioAsignacion, fechaFinAsignacion] de la asignación. */
export function assertFechaDentroVigenciaAsignacion(
  fechaVisita: Date,
  fechaInicioAsignacion: Date,
  fechaFinAsignacion: Date | null,
): void {
  if (fechaVisita < fechaInicioAsignacion) {
    throw AppError.conflict("La fecha de la visita es anterior al inicio de la asignación");
  }

  if (fechaFinAsignacion !== null && fechaVisita > fechaFinAsignacion) {
    throw AppError.conflict("La fecha de la visita es posterior al fin de la asignación");
  }
}
