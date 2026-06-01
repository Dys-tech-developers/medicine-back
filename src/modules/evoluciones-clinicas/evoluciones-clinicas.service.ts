import { AppError } from "../../core/errors/AppError.js";
import type { EvolucionesClinicasRepository } from "./evoluciones-clinicas.repository.js";
import type {
  CreateEvolucionClinicaInput,
  ListEvolucionesClinicasQuery,
  UpdateEvolucionClinicaInput,
} from "./evoluciones-clinicas.validation.js";
import type { EvolucionClinicaDto, PaginatedEvolucionesClinicasDto } from "./evoluciones-clinicas.dto.js";
import { mapEvolucionClinicaToDto, mapPaginatedEvolucionesClinicas } from "./evoluciones-clinicas.mapper.js";

export class EvolucionesClinicasService {
  constructor(private readonly evolucionesClinicasRepository: EvolucionesClinicasRepository) {}

  async list(query: ListEvolucionesClinicasQuery): Promise<PaginatedEvolucionesClinicasDto> {
    const result = await this.evolucionesClinicasRepository.findPaginated(
      query.page,
      query.pageSize,
      { historiaClinicaId: query.historiaClinicaId },
    );
    return mapPaginatedEvolucionesClinicas(result);
  }

  async getById(id: number): Promise<EvolucionClinicaDto> {
    const evolucion = await this.evolucionesClinicasRepository.findById(id);
    if (!evolucion) {
      throw AppError.notFound("Evolución clínica no encontrada");
    }
    return mapEvolucionClinicaToDto(evolucion);
  }

  async create(input: CreateEvolucionClinicaInput): Promise<EvolucionClinicaDto> {
    await this.validateHistoriaClinica(input.historiaClinicaId);

    const evolucion = await this.evolucionesClinicasRepository.create({
      historiaClinicaId: input.historiaClinicaId,
      fecha: input.fecha,
      observaciones: input.observaciones ?? null,
      medicacion: input.medicacion ?? null,
    });

    return mapEvolucionClinicaToDto(evolucion);
  }

  async update(id: number, input: UpdateEvolucionClinicaInput): Promise<EvolucionClinicaDto> {
    const existing = await this.evolucionesClinicasRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Evolución clínica no encontrada");
    }

    const evolucion = await this.evolucionesClinicasRepository.update(id, {
      ...(input.fecha !== undefined ? { fecha: input.fecha } : {}),
      ...(input.observaciones !== undefined ? { observaciones: input.observaciones } : {}),
      ...(input.medicacion !== undefined ? { medicacion: input.medicacion } : {}),
    });

    return mapEvolucionClinicaToDto(evolucion);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.evolucionesClinicasRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Evolución clínica no encontrada");
    }

    await this.evolucionesClinicasRepository.delete(id);
  }

  private async validateHistoriaClinica(historiaClinicaId: number): Promise<void> {
    const historia = await this.evolucionesClinicasRepository.findHistoriaClinicaById(historiaClinicaId);
    if (!historia) {
      throw AppError.notFound("Historia clínica no encontrada");
    }
  }
}
