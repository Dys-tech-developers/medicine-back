import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { AppError } from "../../core/errors/AppError.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { PrestadoresService } from "./prestadores.service.js";
import {
  createPrestadorSchema,
  listPrestadoresQuerySchema,
  prestadorIdParamSchema,
  updatePrestadorServiciosSchema,
} from "./prestadores.validation.js";
import type { PaginatedPrestadoresDto, PrestadorListItemDto } from "./prestadores.dto.js";

export class PrestadoresController {
  constructor(private readonly prestadoresService: PrestadoresService) {}

  me = wrapAsync(async (req, res: Response<ApiSuccess<PrestadorListItemDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const prestador = await this.prestadoresService.getMe(req.auth.userId);
    res.status(200).json({ success: true, data: prestador });
  });

  list = wrapAsync(async (req, res: Response<ApiSuccess<PaginatedPrestadoresDto>>) => {
    const query = parseWithSchema(listPrestadoresQuerySchema, req.query);
    const result = await this.prestadoresService.list(query);
    res.status(200).json({ success: true, data: result });
  });

  getById = wrapAsync(async (req, res: Response<ApiSuccess<PrestadorListItemDto>>) => {
    const { id } = parseWithSchema(prestadorIdParamSchema, req.params);
    const prestador = await this.prestadoresService.getById(id);
    res.status(200).json({ success: true, data: prestador });
  });

  create = wrapAsync(async (req, res: Response<ApiSuccess<PrestadorListItemDto>>) => {
    const input = parseWithSchema(createPrestadorSchema, req.body);
    const prestador = await this.prestadoresService.create(input);
    res.status(201).json({ success: true, data: prestador });
  });

  updateServicios = wrapAsync(async (req, res: Response<ApiSuccess<PrestadorListItemDto>>) => {
    const { id } = parseWithSchema(prestadorIdParamSchema, req.params);
    const input = parseWithSchema(updatePrestadorServiciosSchema, req.body);
    const prestador = await this.prestadoresService.updateServicios(id, input);
    res.status(200).json({ success: true, data: prestador });
  });
}
