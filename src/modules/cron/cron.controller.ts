import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import type { VisitasService } from "../visitas/visitas.service.js";
import type { CerrarVisitasVencidasCronResultDto } from "./cron.dto.js";

export class CronController {
  constructor(private readonly visitasService: VisitasService) {}

  cerrarVisitasVencidas = wrapAsync(
    async (_req, res: Response<ApiSuccess<CerrarVisitasVencidasCronResultDto>>) => {
      const ejecutadoEn = new Date();
      const { cerradas, visitaIds } = await this.visitasService.cerrarVisitasVencidas({
        referencia: ejecutadoEn,
      });

      res.status(200).json({
        success: true,
        data: {
          visitasCerradasAutomaticamente: cerradas,
          visitaIds,
          ejecutadoEn: ejecutadoEn.toISOString(),
        },
      });
    },
  );
}
