import type { Response } from "express";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { ObrasSocialesService } from "./obras-sociales.service.js";
import {
  createObraSocialSchema,
  listObrasSocialesQuerySchema,
  obraSocialIdParamSchema,
  updateObraSocialSchema,
} from "./obras-sociales.validation.js";
import type { ObraSocialDto, PaginatedObrasSocialesDto } from "./obras-sociales.dto.js";

export class ObrasSocialesController {
  constructor(private readonly service: ObrasSocialesService) {}

  list = wrapAsync(async (req, res: Response<ApiSuccess<PaginatedObrasSocialesDto>>) => {
    const query = parseWithSchema(listObrasSocialesQuerySchema, req.query);
    const result = await this.service.list(query);
    res.status(200).json({ success: true, data: result });
  });

  getById = wrapAsync(async (req, res: Response<ApiSuccess<ObraSocialDto>>) => {
    const { id } = parseWithSchema(obraSocialIdParamSchema, req.params);
    const row = await this.service.getById(id);
    res.status(200).json({ success: true, data: row });
  });

  create = wrapAsync(async (req, res: Response<ApiSuccess<ObraSocialDto>>) => {
    const input = parseWithSchema(createObraSocialSchema, req.body);
    const row = await this.service.create(input);
    res.status(201).json({ success: true, data: row });
  });

  update = wrapAsync(async (req, res: Response<ApiSuccess<ObraSocialDto>>) => {
    const { id } = parseWithSchema(obraSocialIdParamSchema, req.params);
    const input = parseWithSchema(updateObraSocialSchema, req.body);
    const row = await this.service.update(id, input);
    res.status(200).json({ success: true, data: row });
  });

  remove = wrapAsync(async (req, res: Response<ApiSuccess<null>>) => {
    const { id } = parseWithSchema(obraSocialIdParamSchema, req.params);
    await this.service.delete(id);
    res.status(200).json({ success: true, data: null });
  });
}
