import type { Response } from "express";
import { wrapAsync } from "../../../core/http/wrapAsync.js";
import type { ServiciosPlantillaService } from "./servicios-plantilla.service.js";

export class ServiciosPlantillaController {
  constructor(private readonly serviciosPlantillaService: ServiciosPlantillaService) {}

  downloadPlantilla = wrapAsync(async (_req, res: Response) => {
    const { filename, buffer } = await this.serviciosPlantillaService.generatePlantilla();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(buffer);
  });
}
