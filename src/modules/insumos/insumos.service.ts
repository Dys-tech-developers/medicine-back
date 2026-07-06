import { AppError } from "../../core/errors/AppError.js";
import type { InsumosRepository } from "./insumos.repository.js";
import type {
  CreateInsumoInput,
  DeleteInsumosBulkBody,
  ListInsumosQuery,
  UpdateInsumoInput,
} from "./insumos.validation.js";
import type { InsumoDto, PaginatedInsumosDto } from "./insumos.dto.js";
import { mapInsumoToDto, mapPaginatedInsumos } from "./insumos.mapper.js";

export class InsumosService {
  constructor(private readonly insumosRepository: InsumosRepository) {}

  async list(query: ListInsumosQuery): Promise<PaginatedInsumosDto> {
    const result = await this.insumosRepository.findPaginated(query.page, query.pageSize, {
      estado: query.estado,
      bajoStock: query.bajoStock,
    });
    return mapPaginatedInsumos(result);
  }

  async getById(id: number): Promise<InsumoDto> {
    const insumo = await this.insumosRepository.findById(id);
    if (!insumo) {
      throw AppError.notFound("Insumo no encontrado");
    }
    return mapInsumoToDto(insumo);
  }

  async create(input: CreateInsumoInput): Promise<InsumoDto> {
    const codigo = input.codigo.trim();
    const existing = await this.insumosRepository.findByCodigo(codigo);
    if (existing) {
      throw AppError.conflict("Ya existe un insumo con ese código");
    }

    const insumo = await this.insumosRepository.create({
      nombre: input.nombre.trim(),
      descripcion: input.descripcion ?? null,
      codigo,
      stockActual: input.stockActual,
      stockMinimo: input.stockMinimo,
      unidadMedida: input.unidadMedida.trim(),
      requiereVencimiento: input.requiereVencimiento,
      fechaVencimiento: input.requiereVencimiento ? (input.fechaVencimiento ?? null) : null,
      estado: input.estado,
    });

    return mapInsumoToDto(insumo);
  }

  async update(id: number, input: UpdateInsumoInput): Promise<InsumoDto> {
    const existing = await this.insumosRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Insumo no encontrado");
    }

    if (input.codigo !== undefined) {
      const codigo = input.codigo.trim();
      const duplicate = await this.insumosRepository.findByCodigo(codigo);
      if (duplicate && duplicate.id !== id) {
        throw AppError.conflict("Ya existe un insumo con ese código");
      }
    }

    const requiereVencimiento = input.requiereVencimiento ?? existing.requiereVencimiento;
    const fechaVencimiento =
      input.fechaVencimiento !== undefined
        ? input.fechaVencimiento
        : requiereVencimiento
          ? existing.fechaVencimiento
          : null;

    if (requiereVencimiento && !fechaVencimiento) {
      throw AppError.badRequest("fechaVencimiento es obligatoria cuando el insumo requiere vencimiento");
    }

    const insumo = await this.insumosRepository.update(id, {
      ...(input.nombre !== undefined ? { nombre: input.nombre.trim() } : {}),
      ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
      ...(input.codigo !== undefined ? { codigo: input.codigo.trim() } : {}),
      ...(input.stockActual !== undefined ? { stockActual: input.stockActual } : {}),
      ...(input.stockMinimo !== undefined ? { stockMinimo: input.stockMinimo } : {}),
      ...(input.unidadMedida !== undefined ? { unidadMedida: input.unidadMedida.trim() } : {}),
      ...(input.requiereVencimiento !== undefined
        ? { requiereVencimiento: input.requiereVencimiento }
        : {}),
      fechaVencimiento: requiereVencimiento ? fechaVencimiento : null,
      ...(input.estado !== undefined ? { estado: input.estado } : {}),
    });

    return mapInsumoToDto(insumo);
  }

  async delete(id: number): Promise<void> {
    await this.deleteMany({ ids: [id] });
  }

  async deleteMany(input: DeleteInsumosBulkBody): Promise<void> {
    const uniqueIds = [...new Set(input.ids)];
    const existing = await this.insumosRepository.findManyByIds(uniqueIds);

    if (existing.length !== uniqueIds.length) {
      const foundIds = new Set(existing.map((i) => i.id));
      const missing = uniqueIds.filter((id) => !foundIds.has(id));
      throw AppError.notFound(`Insumos no encontrados: ${missing.join(", ")}`);
    }

    const consumos = await this.insumosRepository.countConsumosEnVisitas(uniqueIds);
    if (consumos > 0) {
      throw AppError.conflict(
        "No se puede eliminar porque uno o más insumos tienen consumos registrados en visitas",
      );
    }

    await this.insumosRepository.deleteMany(uniqueIds);
  }
}
