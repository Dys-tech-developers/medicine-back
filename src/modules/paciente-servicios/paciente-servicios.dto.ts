import type { PacienteServicioEstado } from "../../shared/constants/paciente-servicio-estado.js";
import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import type { PeriodoControl } from "../../shared/constants/periodo-control.js";

export interface PacienteServicioPacienteResumenDto {
  id: number;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  codigoQr: string;
  direccion: string;
  localidad: string;
}

export interface PacienteServicioServicioResumenDto {
  id: number;
  nombre: string;
  estado: boolean;
}

export interface PacienteServicioPrestadorResumenDto {
  id: number;
  nombre: string;
  email: string;
}

export type { PacienteServicioDisponibilidadDto } from "../../shared/paciente-servicio/asDisponibilidadDto.js";

export interface PacienteServicioDto {
  id: number;
  pacienteId: number;
  servicioId: number;
  prestadorId: number | null;
  fechaInicio: string;
  fechaFin: string | null;
  periodoControl: PeriodoControl;
  cantidadPermitida: number;
  cantidadHoras: number | null;
  modalidadCobro: ModalidadCobro;
  estado: PacienteServicioEstado;
  createdAt: string;
  updatedAt: string;
  paciente: PacienteServicioPacienteResumenDto;
  servicio: PacienteServicioServicioResumenDto;
  prestador: PacienteServicioPrestadorResumenDto | null;
}

export interface PaginatedPacienteServiciosDto {
  items: PacienteServicioDto[];
  total: number;
  page: number;
  pageSize: number;
}
