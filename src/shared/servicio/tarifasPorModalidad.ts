import type { ServicioTarifa } from "@prisma/client";
import type { ServicioTarifaDto } from "../../modules/servicio-tarifas/servicio-tarifas.dto.js";
import { mapServicioTarifaToDto } from "../../modules/servicio-tarifas/servicio-tarifas.mapper.js";

export function mapTarifasPorModalidadCobro(
  tarifas: ServicioTarifa[],
  modalidadCobro: string,
): ServicioTarifaDto[] {
  return tarifas
    .filter((tarifa) => tarifa.modalidadCobro === modalidadCobro)
    .map(mapServicioTarifaToDto);
}
