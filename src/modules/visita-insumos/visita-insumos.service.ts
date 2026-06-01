import { AppError } from "../../core/errors/AppError.js";
import type { VisitaInsumosRepository } from "./visita-insumos.repository.js";
import type { RegisterVisitaInsumosBody } from "./visita-insumos.validation.js";
import { normalizeConsumoItems } from "./visita-insumos.validation.js";
import type { RegisterVisitaInsumosResultDto, VisitaInsumoDto } from "./visita-insumos.dto.js";
import { mapVisitaInsumoToDto } from "./visita-insumos.mapper.js";

export class VisitaInsumosService {
  constructor(private readonly visitaInsumosRepository: VisitaInsumosRepository) {}

  async listByVisita(visitaId: number): Promise<VisitaInsumoDto[]> {
    await this.ensureVisitaExists(visitaId);
    const rows = await this.visitaInsumosRepository.findByVisitaId(visitaId);
    return rows.map(mapVisitaInsumoToDto);
  }

  async register(visitaId: number, body: RegisterVisitaInsumosBody): Promise<RegisterVisitaInsumosResultDto> {
    await this.ensureVisitaExists(visitaId);

    const items = normalizeConsumoItems(body);
    if (items.length === 0) {
      throw AppError.conflict("No se enviaron insumos para registrar");
    }

    const created = await this.visitaInsumosRepository.registerConsumos(visitaId, items);

    return {
      items: created.map(mapVisitaInsumoToDto),
    };
  }

  private async ensureVisitaExists(visitaId: number): Promise<void> {
    const visita = await this.visitaInsumosRepository.findVisitaById(visitaId);
    if (!visita) {
      throw AppError.notFound("Visita no encontrada");
    }
  }
}
