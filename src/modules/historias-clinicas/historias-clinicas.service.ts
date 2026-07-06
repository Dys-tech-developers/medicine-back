import { AppError } from "../../core/errors/AppError.js";
import {
  hasClinicalData,
  HISTORIA_CLINICA_SIN_DATOS_MESSAGE,
} from "../../shared/historia-clinica/hasClinicalData.js";
import type { HistoriasClinicasRepository } from "./historias-clinicas.repository.js";
import type {
  CreateHistoriaClinicaInput,
  ListHistoriasClinicasQuery,
  UpdateHistoriaClinicaInput,
} from "./historias-clinicas.validation.js";
import type {
  HistoriaClinicaDto,
  HistoriaClinicaListItemDto,
  PaginatedHistoriasClinicasDto,
} from "./historias-clinicas.dto.js";
import {
  mapHistoriaClinicaToDto,
  mapHistoriaClinicaToListItem,
  mapPaginatedHistoriasClinicas,
} from "./historias-clinicas.mapper.js";

export class HistoriasClinicasService {
  constructor(private readonly historiasClinicasRepository: HistoriasClinicasRepository) {}

  async list(query: ListHistoriasClinicasQuery): Promise<PaginatedHistoriasClinicasDto> {
    const result = await this.historiasClinicasRepository.findPaginated(
      query.page,
      query.pageSize,
      query.pacienteId,
    );
    return mapPaginatedHistoriasClinicas(result);
  }

  async getById(id: number): Promise<HistoriaClinicaDto> {
    const historia = await this.historiasClinicasRepository.findById(id);
    if (!historia) {
      throw AppError.notFound("Historia clínica no encontrada");
    }
    return mapHistoriaClinicaToDto(historia);
  }

  async getByPacienteId(pacienteId: number): Promise<HistoriaClinicaDto> {
    const pacienteExists = await this.historiasClinicasRepository.pacienteExists(pacienteId);
    if (!pacienteExists) {
      throw AppError.notFound("Paciente no encontrado");
    }

    const historia = await this.historiasClinicasRepository.findByPacienteId(pacienteId);
    if (!historia) {
      throw AppError.notFound("El paciente no tiene historia clínica registrada");
    }

    return mapHistoriaClinicaToDto(historia);
  }

  async create(input: CreateHistoriaClinicaInput): Promise<HistoriaClinicaListItemDto> {
    const pacienteExists = await this.historiasClinicasRepository.pacienteExists(input.pacienteId);
    if (!pacienteExists) {
      throw AppError.notFound("Paciente no encontrado");
    }

    const existing = await this.historiasClinicasRepository.findByPacienteId(input.pacienteId);
    if (existing) {
      throw AppError.conflict("El paciente ya tiene una historia clínica. Usá PATCH para actualizarla.");
    }

    const historia = await this.historiasClinicasRepository.create({
      pacienteId: input.pacienteId,
      fechaCreacion: input.fechaCreacion,
      antecedentes: input.antecedentes ?? null,
      diagnosticoInicial: input.diagnosticoInicial ?? null,
      medicacion: input.medicacion ?? null,
      alergias: input.alergias ?? null,
      observaciones: input.observaciones ?? null,
    });

    return mapHistoriaClinicaToListItem(historia);
  }

  async update(id: number, input: UpdateHistoriaClinicaInput): Promise<HistoriaClinicaListItemDto> {
    const existing = await this.historiasClinicasRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Historia clínica no encontrada");
    }

    const merged = {
      antecedentes:
        input.antecedentes !== undefined ? input.antecedentes : existing.antecedentes,
      diagnosticoInicial:
        input.diagnosticoInicial !== undefined
          ? input.diagnosticoInicial
          : existing.diagnosticoInicial,
      medicacion: input.medicacion !== undefined ? input.medicacion : existing.medicacion,
      alergias: input.alergias !== undefined ? input.alergias : existing.alergias,
      observaciones:
        input.observaciones !== undefined ? input.observaciones : existing.observaciones,
    };

    if (!hasClinicalData(merged)) {
      throw AppError.badRequest(HISTORIA_CLINICA_SIN_DATOS_MESSAGE);
    }

    const historia = await this.historiasClinicasRepository.update(id, {
      ...(input.fechaCreacion !== undefined ? { fechaCreacion: input.fechaCreacion } : {}),
      ...(input.antecedentes !== undefined ? { antecedentes: input.antecedentes } : {}),
      ...(input.diagnosticoInicial !== undefined
        ? { diagnosticoInicial: input.diagnosticoInicial }
        : {}),
      ...(input.medicacion !== undefined ? { medicacion: input.medicacion } : {}),
      ...(input.alergias !== undefined ? { alergias: input.alergias } : {}),
      ...(input.observaciones !== undefined ? { observaciones: input.observaciones } : {}),
    });

    return mapHistoriaClinicaToListItem(historia);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.historiasClinicasRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Historia clínica no encontrada");
    }

    await this.historiasClinicasRepository.delete(id);
  }
}
