import { mapInsumoToDto } from "../insumos/insumos.mapper.js";
import type { VisitaInsumoDto } from "./visita-insumos.dto.js";
import type { VisitaInsumoWithInsumo } from "../../shared/prisma-includes/visita-insumo.include.js";

export function mapVisitaInsumoToDto(row: VisitaInsumoWithInsumo): VisitaInsumoDto {
  return {
    id: row.id,
    visitaId: row.visitaId,
    insumoId: row.insumoId,
    cantidad: row.cantidad,
    createdAt: row.createdAt.toISOString(),
    insumo: mapInsumoToDto(row.insumo),
  };
}
