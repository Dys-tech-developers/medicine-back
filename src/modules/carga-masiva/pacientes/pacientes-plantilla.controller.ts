import type { Response } from "express";
import { wrapAsync } from "../../../core/http/wrapAsync.js";
import type { PacientesPlantillaService } from "./pacientes-plantilla.service.js";

export class PacientesPlantillaController {
  constructor(private readonly pacientesPlantillaService: PacientesPlantillaService) {}

  downloadPlantilla = wrapAsync(async (_req, res: Response) => {
    const { filename, buffer } = await this.pacientesPlantillaService.generatePlantilla();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(buffer);
  });
}
