import type { EvolucionClinica } from "@prisma/client";
import type { EvolucionClinicaDto, PaginatedEvolucionesClinicasDto } from "./evoluciones-clinicas.dto.js";
import type { PaginatedEvolucionesClinicas } from "./evoluciones-clinicas.repository.js";

export function mapEvolucionClinicaToDto(evolucion: EvolucionClinica): EvolucionClinicaDto {
  return {
    id: evolucion.id,
    historiaClinicaId: evolucion.historiaClinicaId,
    fecha: evolucion.fecha.toISOString(),
    observaciones: evolucion.observaciones,
    medicacion: evolucion.medicacion,
    createdAt: evolucion.createdAt.toISOString(),
  };
}

export function mapPaginatedEvolucionesClinicas(
  result: PaginatedEvolucionesClinicas,
): PaginatedEvolucionesClinicasDto {
  return {
    items: result.items.map(mapEvolucionClinicaToDto),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}
