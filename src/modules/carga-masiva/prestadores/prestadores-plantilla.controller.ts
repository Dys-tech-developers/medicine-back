import type { Response } from "express";
import { wrapAsync } from "../../../core/http/wrapAsync.js";
import type { PrestadoresPlantillaService } from "./prestadores-plantilla.service.js";

export class PrestadoresPlantillaController {
  constructor(private readonly prestadoresPlantillaService: PrestadoresPlantillaService) {}

  downloadPlantilla = wrapAsync(async (_req, res: Response) => {
    const { filename, buffer } = await this.prestadoresPlantillaService.generatePlantilla();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(buffer);
  });
}
