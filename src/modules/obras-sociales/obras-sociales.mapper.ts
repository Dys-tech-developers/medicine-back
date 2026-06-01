import type { ObraSocial } from "@prisma/client";
import type { ObraSocialDto, PaginatedObrasSocialesDto } from "./obras-sociales.dto.js";
import type { PaginatedObrasSociales } from "./obras-sociales.repository.js";

export function mapObraSocialToDto(row: ObraSocial): ObraSocialDto {
  return {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
    estado: row.estado,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapPaginatedObrasSociales(result: PaginatedObrasSociales): PaginatedObrasSocialesDto {
  return {
    items: result.items.map(mapObraSocialToDto),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}
