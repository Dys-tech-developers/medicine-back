import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import type { TipoDia, TipoJornada } from "../../shared/constants/tarifa.js";
import type { VisitaEstado } from "../../shared/constants/visita-estado.js";

export interface VisitaPacienteResumenDto {
  id: number;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  direccion: string;
  localidad: string;
}

export interface VisitaServicioResumenDto {
  id: number;
  nombre: string;
}

export interface VisitaPacienteServicioResumenDto {
  id: number;
  estado: string;
  paciente: VisitaPacienteResumenDto;
  servicio: VisitaServicioResumenDto;
}

export interface VisitaPrestadorResumenDto {
  id: number;
  nombre: string;
  email: string;
}

export interface VisitaInsumoResumenDto {
  id: number;
  insumoId: number;
  cantidad: number;
  insumoNombre: string;
  insumoCodigo: string;
}

export interface VisitaFinanzasDto {
  id: number;
  visitaId: number;
  modalidadCobro: ModalidadCobro;
  tipoJornada: TipoJornada;
  tipoDia: TipoDia;
  valorUnitario: string;
  valorAplicado: string;
  facturado: boolean;
  pagado: boolean;
  fechaFacturacion: string | null;
  fechaPago: string | null;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VisitaPendienteResumenDto {
  id: number;
  fechaInicio: string;
  estado: VisitaEstado;
  /** ISO; null si la asignación no tiene `cantidadHoras`. */
  fechaLimite: string | null;
}

export interface CoberturaActivaDto {
  visitaId: number;
  prestadorId: number;
  fechaInicio: string;
}

export interface VisitaPendienteDto {
  tieneVisitaPendiente: boolean;
  visita: VisitaPendienteResumenDto | null;
  /** Visitas cerradas automáticamente en esta consulta por superar el límite de horas. */
  visitasCerradasAutomaticamente: number;
  modoRelevo?: boolean;
  coberturaActiva?: CoberturaActivaDto | null;
}

export interface RelevarVisitaDto {
  huboRelevo: boolean;
  visitaAnterior: VisitaDto | null;
  visita: VisitaDto;
}

export type GestionarTramoAdminAccion = "iniciar" | "finalizar" | "cancelar";

export interface GestionarTramoAdminDto {
  accion: GestionarTramoAdminAccion;
  visita: VisitaDto;
}

export interface VisitaDto {
  id: number;
  pacienteServicioId: number;
  prestadorId: number;
  estado: VisitaEstado;
  fechaInicio: string;
  fechaFin: string | null;
  tiempoMinutos: number | null;
  observaciones: string | null;
  cierreAutomatico: boolean;
  cierrePorRelevo: boolean;
  prestadorRelevoId: number | null;
  createdAt: string;
  updatedAt: string;
  pacienteServicio: VisitaPacienteServicioResumenDto;
  prestador: VisitaPrestadorResumenDto;
  insumos: VisitaInsumoResumenDto[];
  finanzas: VisitaFinanzasDto | null;
}

export interface PaginatedVisitasDto {
  items: VisitaDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BulkUpdateVisitaFinanzasResultDto {
  actualizadas: number;
  visitaIds: number[];
}
