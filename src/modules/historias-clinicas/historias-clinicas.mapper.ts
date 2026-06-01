import type {
  HistoriaClinicaDto,
  HistoriaClinicaListItemDto,
  PaginatedHistoriasClinicasDto,
} from "./historias-clinicas.dto.js";
import type { PaginatedHistoriasClinicas } from "./historias-clinicas.repository.js";
import type {
  HistoriaClinicaDetail,
  HistoriaClinicaWithPaciente,
} from "../../shared/prisma-includes/historia-clinica.include.js";
import { mapEvolucionClinicaToDto } from "../evoluciones-clinicas/evoluciones-clinicas.mapper.js";

function mapHistoriaClinicaBase(historia: HistoriaClinicaWithPaciente): HistoriaClinicaListItemDto {
  return {
    id: historia.id,
    pacienteId: historia.pacienteId,
    fechaCreacion: historia.fechaCreacion.toISOString(),
    antecedentes: historia.antecedentes,
    diagnosticoInicial: historia.diagnosticoInicial,
    medicacion: historia.medicacion,
    alergias: historia.alergias,
    observaciones: historia.observaciones,
    createdAt: historia.createdAt.toISOString(),
    updatedAt: historia.updatedAt.toISOString(),
    paciente: {
      id: historia.paciente.id,
      nombre: historia.paciente.nombre,
      apellido: historia.paciente.apellido,
      numeroDocumento: historia.paciente.numeroDocumento,
      codigoQr: historia.paciente.codigoQr,
    },
  };
}

export function mapHistoriaClinicaToListItem(historia: HistoriaClinicaWithPaciente): HistoriaClinicaListItemDto {
  return mapHistoriaClinicaBase(historia);
}

export function mapHistoriaClinicaToDto(historia: HistoriaClinicaDetail): HistoriaClinicaDto {
  return {
    ...mapHistoriaClinicaBase(historia),
    evoluciones: historia.evoluciones.map(mapEvolucionClinicaToDto),
  };
}

export function mapPaginatedHistoriasClinicas(
  result: PaginatedHistoriasClinicas,
): PaginatedHistoriasClinicasDto {
  return {
    items: result.items.map(mapHistoriaClinicaToListItem),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}
