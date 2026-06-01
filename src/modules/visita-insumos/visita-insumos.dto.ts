import type { InsumoDto } from "../insumos/insumos.dto.js";

export interface VisitaInsumoDto {
  id: number;
  visitaId: number;
  insumoId: number;
  cantidad: number;
  createdAt: string;
  insumo: InsumoDto;
}

export interface RegisterVisitaInsumosResultDto {
  items: VisitaInsumoDto[];
}
