import { AppError } from "../../core/errors/AppError.js";
import type { ObrasSocialesRepository } from "./obras-sociales.repository.js";
import type {
  CreateObraSocialInput,
  ListObrasSocialesQuery,
  UpdateObraSocialInput,
} from "./obras-sociales.validation.js";
import type { ObraSocialDto, PaginatedObrasSocialesDto } from "./obras-sociales.dto.js";
import { mapObraSocialToDto, mapPaginatedObrasSociales } from "./obras-sociales.mapper.js";

export class ObrasSocialesService {
  constructor(private readonly repository: ObrasSocialesRepository) {}

  async list(query: ListObrasSocialesQuery): Promise<PaginatedObrasSocialesDto> {
    const result = await this.repository.findPaginated(query.page, query.pageSize, {
      search: query.search,
      estado: query.estado,
    });
    return mapPaginatedObrasSociales(result);
  }

  async getById(id: number): Promise<ObraSocialDto> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw AppError.notFound("Obra social no encontrada");
    }
    return mapObraSocialToDto(row);
  }

  async create(input: CreateObraSocialInput): Promise<ObraSocialDto> {
    const codigo = input.codigo.trim();
    const existing = await this.repository.findByCodigo(codigo);
    if (existing) {
      throw AppError.conflict("Ya existe una obra social con ese código");
    }

    const row = await this.repository.create({
      nombre: input.nombre.trim(),
      codigo,
      estado: input.estado,
    });
    return mapObraSocialToDto(row);
  }

  async update(id: number, input: UpdateObraSocialInput): Promise<ObraSocialDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw AppError.notFound("Obra social no encontrada");
    }

    if (input.codigo !== undefined) {
      const codigo = input.codigo.trim();
      const duplicate = await this.repository.findByCodigo(codigo);
      if (duplicate && duplicate.id !== id) {
        throw AppError.conflict("Ya existe una obra social con ese código");
      }
    }

    const row = await this.repository.update(id, {
      ...(input.nombre !== undefined ? { nombre: input.nombre.trim() } : {}),
      ...(input.codigo !== undefined ? { codigo: input.codigo.trim() } : {}),
      ...(input.estado !== undefined ? { estado: input.estado } : {}),
    });
    return mapObraSocialToDto(row);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw AppError.notFound("Obra social no encontrada");
    }

    const pacientes = await this.repository.countPacientes(id);
    if (pacientes > 0) {
      throw AppError.conflict("No se puede eliminar porque tiene pacientes asociados");
    }

    await this.repository.delete(id);
  }
}
