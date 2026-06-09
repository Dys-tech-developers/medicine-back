import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import type { LocalidadesService } from "./localidades.service.js";
import type { LocalidadDto } from "./localidades.dto.js";

export class LocalidadesController {
  constructor(private readonly localidadesService: LocalidadesService) {}

  list = wrapAsync(async (_req, res: Response<ApiSuccess<LocalidadDto[]>>) => {
    const localidades = await this.localidadesService.list();
    res.status(200).json({ success: true, data: localidades });
  });
}
