import { AppError } from "../../../core/errors/AppError.js";
import type { LocalidadesRepository } from "../../localidades/localidades.repository.js";
import type { ObrasSocialesRepository } from "../../obras-sociales/obras-sociales.repository.js";
import { PACIENTES_PLANTILLA_FILENAME } from "./pacientes-plantilla.constants.js";
import { buildPacientesPlantillaWorkbook } from "./buildPacientesPlantillaWorkbook.js";

export interface PacientesPlantillaDownload {
  filename: string;
  buffer: Buffer;
}

export class PacientesPlantillaService {
  constructor(
    private readonly obrasSocialesRepository: ObrasSocialesRepository,
    private readonly localidadesRepository: LocalidadesRepository,
  ) {}

  async generatePlantilla(): Promise<PacientesPlantillaDownload> {
    const [obrasSociales, localidades] = await Promise.all([
      this.obrasSocialesRepository.findAllActivasOrderedByNombre(),
      this.localidadesRepository.findAllOrderedByNombre(),
    ]);

    if (obrasSociales.length === 0) {
      throw AppError.conflict(
        "No hay obras sociales activas para generar la plantilla. Cargá al menos una obra social.",
      );
    }

    if (localidades.length === 0) {
      throw AppError.conflict(
        "No hay localidades cargadas para generar la plantilla. Ejecutá el seed de localidades.",
      );
    }

    const buffer = await buildPacientesPlantillaWorkbook({
      obrasSociales: obrasSociales.map((obraSocial) => obraSocial.nombre),
      localidades: localidades.map((localidad) => localidad.nombre),
    });

    return {
      filename: PACIENTES_PLANTILLA_FILENAME,
      buffer,
    };
  }
}
