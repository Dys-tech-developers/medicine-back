import type { ServicioTarifaDto } from "../servicio-tarifas/servicio-tarifas.dto.js";
import type { PacienteServicioEstado } from "../../shared/constants/paciente-servicio-estado.js";
import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import type { PeriodoControl } from "../../shared/constants/periodo-control.js";

export interface ServicioPacienteAsignadoDto {
  pacienteServicioId: number;
  pacienteId: number;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  codigoQr: string;
  modalidadCobro: ModalidadCobro;
  periodoControl: PeriodoControl;
  cantidadPermitida: number;
  cantidadHoras: number | null;
  estado: PacienteServicioEstado;
  fechaInicio: string;
  fechaFin: string | null;
  /** Tarifas del servicio que coinciden con la modalidad de cobro de la asignación */
  tarifas: ServicioTarifaDto[];
}

export interface ServicioDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  createdAt: string;
}

export interface ServicioConTarifasDto extends ServicioDto {
  tarifas: ServicioTarifaDto[];
  pacientes: ServicioPacienteAsignadoDto[];
}

export interface PaginatedServiciosDto {
  items: ServicioConTarifasDto[];
  total: number;
  page: number;
  pageSize: number;
}
