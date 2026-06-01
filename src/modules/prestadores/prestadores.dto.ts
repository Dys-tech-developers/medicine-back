import type { PeriodoControl } from "../../shared/constants/periodo-control.js";
import type { PrestadorEstadoCuentaDto } from "../../shared/reportes/mapEstadoCuentaPrestador.js";

export type { PrestadorEstadoCuentaDto };

export interface PrestadorListItemDto {
  id: number;
  userId: number;
  nombre: string;
  email: string;
  telefono: string;
  lugarResidencia: string;
  documento: string;
  matricula: string;
  cuit: string;
  cbu: string;
  regimenIva: string;
  estado: boolean;
  usuarioEstado: boolean;
  createdAt: string;
  updatedAt: string;
  estadoCuenta?: PrestadorEstadoCuentaDto;
}

export interface PrestadoresListMetaDto {
  fechaDesde: string | null;
  fechaHasta: string | null;
  periodo: PeriodoControl | null;
}

export interface PaginatedPrestadoresDto {
  items: PrestadorListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  meta?: PrestadoresListMetaDto;
}
