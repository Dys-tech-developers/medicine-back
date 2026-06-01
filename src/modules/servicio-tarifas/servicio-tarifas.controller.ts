import type { Response } from "express";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { ServicioTarifasService } from "./servicio-tarifas.service.js";
import {
  createServicioTarifaSchema,
  servicioIdParamSchema,
  servicioTarifaIdParamSchema,
  updateServicioTarifaSchema,
} from "./servicio-tarifas.validation.js";
import type { ServicioTarifaDto } from "./servicio-tarifas.dto.js";

export class ServicioTarifasController {
  constructor(private readonly service: ServicioTarifasService) {}

  list = wrapAsync(async (req, res: Response<ApiSuccess<ServicioTarifaDto[]>>) => {
    const { servicioId } = parseWithSchema(servicioIdParamSchema, req.params);
    const rows = await this.service.listByServicio(servicioId);
    res.status(200).json({ success: true, data: rows });
  });

  create = wrapAsync(async (req, res: Response<ApiSuccess<ServicioTarifaDto>>) => {
    const { servicioId } = parseWithSchema(servicioIdParamSchema, req.params);
    const input = parseWithSchema(createServicioTarifaSchema, req.body);
    const row = await this.service.create(servicioId, input);
    res.status(201).json({ success: true, data: row });
  });

  update = wrapAsync(async (req, res: Response<ApiSuccess<ServicioTarifaDto>>) => {
    const { servicioId, id } = parseWithSchema(servicioTarifaIdParamSchema, req.params);
    const input = parseWithSchema(updateServicioTarifaSchema, req.body);
    const row = await this.service.update(servicioId, id, input);
    res.status(200).json({ success: true, data: row });
  });

  remove = wrapAsync(async (req, res: Response<ApiSuccess<null>>) => {
    const { servicioId, id } = parseWithSchema(servicioTarifaIdParamSchema, req.params);
    await this.service.delete(servicioId, id);
    res.status(200).json({ success: true, data: null });
  });
}
