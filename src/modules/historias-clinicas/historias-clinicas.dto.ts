import type { EvolucionClinicaDto } from "../evoluciones-clinicas/evoluciones-clinicas.dto.js";

export interface HistoriaClinicaPacienteResumenDto {
  id: number;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  codigoQr: string;
}

export interface HistoriaClinicaListItemDto {
  id: number;
  pacienteId: number;
  fechaCreacion: string;
  antecedentes: string | null;
  diagnosticoInicial: string | null;
  medicacion: string | null;
  alergias: string | null;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
  paciente: HistoriaClinicaPacienteResumenDto;
}

export interface HistoriaClinicaDto extends HistoriaClinicaListItemDto {
  evoluciones: EvolucionClinicaDto[];
}

export interface PaginatedHistoriasClinicasDto {
  items: HistoriaClinicaListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}
