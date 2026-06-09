import type { Localidad } from "@prisma/client";
import type { LocalidadDto } from "./localidades.dto.js";

export function mapLocalidadToDto(row: Localidad): LocalidadDto {
  return {
    id: row.id,
    nombre: row.nombre,
  };
}
