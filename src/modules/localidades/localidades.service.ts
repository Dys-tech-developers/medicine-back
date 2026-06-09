import type { LocalidadesRepository } from "./localidades.repository.js";
import type { LocalidadDto } from "./localidades.dto.js";
import { mapLocalidadToDto } from "./localidades.mapper.js";

export class LocalidadesService {
  constructor(private readonly repository: LocalidadesRepository) {}

  async list(): Promise<LocalidadDto[]> {
    const rows = await this.repository.findAllOrderedByNombre();
    return rows.map(mapLocalidadToDto);
  }
}
