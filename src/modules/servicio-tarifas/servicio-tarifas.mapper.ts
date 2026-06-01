import type { ServicioTarifa } from "@prisma/client";
import type { ServicioTarifaDto } from "./servicio-tarifas.dto.js";
import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import type { TipoDia, TipoJornada } from "../../shared/constants/tarifa.js";

export function mapServicioTarifaToDto(row: ServicioTarifa): ServicioTarifaDto {
  return {
    id: row.id,
    servicioId: row.servicioId,
    modalidadCobro: row.modalidadCobro as ModalidadCobro,
    tipoJornada: row.tipoJornada as TipoJornada,
    tipoDia: row.tipoDia as TipoDia,
    valor: row.valor.toString(),
    createdAt: row.createdAt.toISOString(),
  };
}
