import type { ServiciosRepository } from "../../servicios/servicios.repository.js";
import { PRESTADORES_PLANTILLA_FILENAME } from "./prestadores-plantilla.constants.js";
import { buildPrestadoresPlantillaWorkbook } from "./buildPrestadoresPlantillaWorkbook.js";

export interface PrestadoresPlantillaDownload {
  filename: string;
  buffer: Buffer;
}

export class PrestadoresPlantillaService {
  constructor(private readonly serviciosRepository: ServiciosRepository) {}

  async generatePlantilla(): Promise<PrestadoresPlantillaDownload> {
    const servicios = await this.serviciosRepository.findAllActivosOrderedByNombre();

    const buffer = await buildPrestadoresPlantillaWorkbook({
      servicios: servicios.map((servicio) => servicio.nombre),
    });

    return {
      filename: PRESTADORES_PLANTILLA_FILENAME,
      buffer,
    };
  }
}
