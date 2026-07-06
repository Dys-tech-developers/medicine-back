import { SERVICIOS_PLANTILLA_FILENAME } from "./servicios-plantilla.constants.js";
import { buildServiciosPlantillaWorkbook } from "./buildServiciosPlantillaWorkbook.js";

export interface ServiciosPlantillaDownload {
  filename: string;
  buffer: Buffer;
}

export class ServiciosPlantillaService {
  async generatePlantilla(): Promise<ServiciosPlantillaDownload> {
    const buffer = await buildServiciosPlantillaWorkbook();

    return {
      filename: SERVICIOS_PLANTILLA_FILENAME,
      buffer,
    };
  }
}
