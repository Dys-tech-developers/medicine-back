import type { Insumo } from "@prisma/client";
import type { InsumoDto, PaginatedInsumosDto } from "./insumos.dto.js";
import type { PaginatedInsumos } from "./insumos.repository.js";

export function mapInsumoToDto(insumo: Insumo): InsumoDto {
  return {
    id: insumo.id,
    nombre: insumo.nombre,
    descripcion: insumo.descripcion,
    codigo: insumo.codigo,
    stockActual: insumo.stockActual,
    stockMinimo: insumo.stockMinimo,
    unidadMedida: insumo.unidadMedida,
    requiereVencimiento: insumo.requiereVencimiento,
    fechaVencimiento: insumo.fechaVencimiento?.toISOString() ?? null,
    estado: insumo.estado,
    bajoStock: insumo.stockActual <= insumo.stockMinimo,
    createdAt: insumo.createdAt.toISOString(),
    updatedAt: insumo.updatedAt.toISOString(),
  };
}

export function mapPaginatedInsumos(result: PaginatedInsumos): PaginatedInsumosDto {
  return {
    items: result.items.map(mapInsumoToDto),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}
