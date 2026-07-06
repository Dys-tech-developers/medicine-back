import type { Response } from "express";
import { wrapAsync } from "../../../core/http/wrapAsync.js";
import type { StockPlantillaService } from "./stock-plantilla.service.js";

export class StockPlantillaController {
  constructor(private readonly stockPlantillaService: StockPlantillaService) {}

  downloadPlantilla = wrapAsync(async (_req, res: Response) => {
    const { filename, buffer } = await this.stockPlantillaService.generatePlantilla();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(buffer);
  });
}
