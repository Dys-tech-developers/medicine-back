export interface PacienteObraSocialDto {
  id: number;
  nombre: string;
  codigo: string;
  estado: boolean;
}

export interface PacienteListItemDto {
  id: number;
  obraSocial: PacienteObraSocialDto;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  codigoQr: string;
  fechaNacimiento: string;
  sexo: "M" | "F" | "X";
  telefono: string;
  direccion: string;
  localidad: string;
  numeroAfiliado: string;
  createdAt: string;
}

import type { ServicioTarifaDto } from "../servicio-tarifas/servicio-tarifas.dto.js";
import type { PacienteServicioEstado } from "../../shared/constants/paciente-servicio-estado.js";
import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import type { PeriodoControl } from "../../shared/constants/periodo-control.js";
import type { PacienteServicioDisponibilidadDto } from "../../shared/paciente-servicio/asDisponibilidadDto.js";

export interface VisitaPendienteEnAsignacionDto {
  id: number;
  fechaInicio: string;
}

export interface PacienteServicioAsignadoDto {
  pacienteServicioId: number;
  servicioId: number;
  servicioNombre: string;
  controlHorario: boolean;
  visitaPendiente?: VisitaPendienteEnAsignacionDto;
  modalidadCobro: ModalidadCobro;
  periodoControl: PeriodoControl;
  cantidadPermitida: number;
  cantidadHoras: number | null;
  estado: PacienteServicioEstado;
  fechaInicio: string;
  fechaFin: string | null;
  tarifas: ServicioTarifaDto[];
  /** Omitido cuando `modalidadCobro` es `por_hora`. */
  disponibilidad?: PacienteServicioDisponibilidadDto;
}

export interface PacienteDto extends PacienteListItemDto {
  updatedAt: string;
  qrDataUrl: string;
  servicios: PacienteServicioAsignadoDto[];
}

export interface PaginatedPacientesDto {
  items: PacienteListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}
