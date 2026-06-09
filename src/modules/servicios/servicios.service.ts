import { AppError } from "../../core/errors/AppError.js";
import type { ServiciosRepository } from "./servicios.repository.js";
import type {
  CreateServicioInput,
  ListServiciosQuery,
  UpdateServicioEstadoInput,
  UpdateServicioInput,
} from "./servicios.validation.js";
import type { PaginatedServiciosDto, ServicioConTarifasDto, ServicioDto } from "./servicios.dto.js";
import {
  mapPaginatedServicios,
  mapServicioConTarifasToDto,
  mapServicioWithTarifasRowToDto,
  mapServicioToDto,
} from "./servicios.mapper.js";

export class ServiciosService {
  constructor(private readonly serviciosRepository: ServiciosRepository) {}

  async list(query: ListServiciosQuery): Promise<PaginatedServiciosDto> {
    const result = await this.serviciosRepository.findPaginated(query.page, query.pageSize, {
      search: query.search,
      estado: query.estado,
    });
    return mapPaginatedServicios(result);
  }

  async getById(id: number): Promise<ServicioConTarifasDto> {
    const servicio = await this.serviciosRepository.findById(id);
    if (!servicio) {
      throw AppError.notFound("Servicio no encontrado");
    }
    return mapServicioWithTarifasRowToDto(servicio);
  }

  async create(input: CreateServicioInput): Promise<ServicioConTarifasDto> {
    const nombre = input.nombre.trim();
    const existing = await this.serviciosRepository.findByNombre(nombre);
    if (existing) {
      throw AppError.conflict("Ya existe un servicio con ese nombre");
    }

    const result = await this.serviciosRepository.createWithTarifas({
      nombre,
      estado: input.estado,
      controlHorario: input.controlHorario,
      descripcion: input.descripcion ?? null,
      tarifas: input.tarifas,
    });

    return mapServicioConTarifasToDto(result);
  }

  async updateEstado(id: number, input: UpdateServicioEstadoInput): Promise<ServicioDto> {
    const existing = await this.serviciosRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Servicio no encontrado");
    }

    const servicio = await this.serviciosRepository.updateEstado(id, input.estado);
    return mapServicioToDto(servicio);
  }

  async update(id: number, input: UpdateServicioInput): Promise<ServicioDto> {
    const existing = await this.serviciosRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Servicio no encontrado");
    }

    if (input.nombre !== undefined) {
      const nombre = input.nombre.trim();
      const duplicate = await this.serviciosRepository.findByNombre(nombre);
      if (duplicate && duplicate.id !== id) {
        throw AppError.conflict("Ya existe un servicio con ese nombre");
      }
    }

    const servicio = await this.serviciosRepository.update(id, {
      ...(input.nombre !== undefined ? { nombre: input.nombre.trim() } : {}),
      ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
      ...(input.controlHorario !== undefined ? { controlHorario: input.controlHorario } : {}),
    });

    return mapServicioToDto(servicio);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.serviciosRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Servicio no encontrado");
    }

    const usage = await this.serviciosRepository.countPacienteServicioUsage(id);
    if (usage > 0) {
      throw AppError.conflict(
        "No se puede eliminar el servicio porque está asignado a uno o más pacientes",
      );
    }

    await this.serviciosRepository.delete(id);
  }
}
