import type { PeriodoControl } from "../../shared/constants/periodo-control.js";
import {
  emptyEstadoCuentaPrestador,
  mapEstadoCuentaFromResumenRow,
} from "../../shared/reportes/mapEstadoCuentaPrestador.js";
import type { RangoFechasReporte } from "../../shared/reportes/resolveRangoFechasReporte.js";
import type { PrestadorWithUser } from "../../shared/prisma-includes/prestador.include.js";
import type { RawReportePrestadorRow } from "../reportes/reportes.repository.js";
import type {
  PaginatedPrestadoresDto,
  PrestadorListItemDto,
  PrestadoresListMetaDto,
} from "./prestadores.dto.js";
import type { PaginatedPrestadores } from "./prestadores.repository.js";

function toIsoOrNull(date: Date | undefined): string | null {
  return date !== undefined ? date.toISOString() : null;
}

export function buildPrestadoresListMeta(
  rango: RangoFechasReporte,
  periodoQuery: PeriodoControl | undefined,
): PrestadoresListMetaDto {
  return {
    fechaDesde: toIsoOrNull(rango.fechaDesde),
    fechaHasta: toIsoOrNull(rango.fechaHasta),
    periodo: rango.periodoAplicado ?? periodoQuery ?? null,
  };
}

export function mapPrestadorToDto(prestador: PrestadorWithUser): PrestadorListItemDto {
  return {
    id: prestador.id,
    userId: prestador.userId,
    nombre: prestador.user.nombre,
    email: prestador.user.email,
    telefono: prestador.telefono,
    lugarResidencia: prestador.lugarResidencia,
    documento: prestador.documento,
    matricula: prestador.matricula,
    cuit: prestador.cuit,
    cbu: prestador.cbu,
    regimenIva: prestador.regimenIva,
    estado: prestador.estado,
    usuarioEstado: prestador.user.estado,
    createdAt: prestador.createdAt.toISOString(),
    updatedAt: prestador.updatedAt.toISOString(),
  };
}

export function mapPaginatedPrestadores(result: PaginatedPrestadores): PaginatedPrestadoresDto {
  return {
    items: result.items.map(mapPrestadorToDto),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}

export function mapPaginatedPrestadoresConEstadoCuenta(
  result: PaginatedPrestadores,
  aggregatesByPrestadorId: Map<number, RawReportePrestadorRow>,
  rango: RangoFechasReporte,
  periodoQuery: PeriodoControl | undefined,
): PaginatedPrestadoresDto {
  return {
    items: result.items.map((prestador) => {
      const base = mapPrestadorToDto(prestador);
      const row = aggregatesByPrestadorId.get(prestador.id);
      return {
        ...base,
        estadoCuenta: row ? mapEstadoCuentaFromResumenRow(row) : emptyEstadoCuentaPrestador(),
      };
    }),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    meta: buildPrestadoresListMeta(rango, periodoQuery),
  };
}
