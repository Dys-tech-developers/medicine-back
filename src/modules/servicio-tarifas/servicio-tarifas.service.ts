import { AppError } from "../../core/errors/AppError.js";
import type { ServicioTarifasRepository } from "./servicio-tarifas.repository.js";
import type {
  CreateServicioTarifaInput,
  UpdateServicioTarifaInput,
} from "./servicio-tarifas.validation.js";
import type { ServicioTarifaDto } from "./servicio-tarifas.dto.js";
import { mapServicioTarifaToDto } from "./servicio-tarifas.mapper.js";

export class ServicioTarifasService {
  constructor(private readonly repository: ServicioTarifasRepository) {}

  async listByServicio(servicioId: number): Promise<ServicioTarifaDto[]> {
    await this.ensureServicio(servicioId);
    const rows = await this.repository.findByServicioId(servicioId);
    return rows.map(mapServicioTarifaToDto);
  }

  async create(servicioId: number, input: CreateServicioTarifaInput): Promise<ServicioTarifaDto> {
    await this.ensureServicio(servicioId);
    const row = await this.repository.create({
      servicio: { connect: { id: servicioId } },
      modalidadCobro: input.modalidadCobro,
      tipoJornada: input.tipoJornada,
      tipoDia: input.tipoDia,
      valor: input.valor,
    });
    return mapServicioTarifaToDto(row);
  }

  async update(
    servicioId: number,
    id: number,
    input: UpdateServicioTarifaInput,
  ): Promise<ServicioTarifaDto> {
    const existing = await this.getOwnedTarifa(servicioId, id);
    const row = await this.repository.update(existing.id, {
      ...(input.modalidadCobro !== undefined ? { modalidadCobro: input.modalidadCobro } : {}),
      ...(input.tipoJornada !== undefined ? { tipoJornada: input.tipoJornada } : {}),
      ...(input.tipoDia !== undefined ? { tipoDia: input.tipoDia } : {}),
      ...(input.valor !== undefined ? { valor: input.valor } : {}),
    });
    return mapServicioTarifaToDto(row);
  }

  async delete(servicioId: number, id: number): Promise<void> {
    const existing = await this.getOwnedTarifa(servicioId, id);
    await this.repository.delete(existing.id);
  }

  private async ensureServicio(servicioId: number): Promise<void> {
    const exists = await this.repository.servicioExists(servicioId);
    if (!exists) {
      throw AppError.notFound("Servicio no encontrado");
    }
  }

  private async getOwnedTarifa(servicioId: number, id: number) {
    const row = await this.repository.findById(id);
    if (!row || row.servicioId !== servicioId) {
      throw AppError.notFound("Tarifa no encontrada");
    }
    return row;
  }
}
