import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { InsumosService } from "./insumos.service.js";
import {
  createInsumoSchema,
  insumoIdParamSchema,
  listInsumosQuerySchema,
  updateInsumoSchema,
} from "./insumos.validation.js";
import type { InsumoDto, PaginatedInsumosDto } from "./insumos.dto.js";

export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  list = wrapAsync(async (req, res: Response<ApiSuccess<PaginatedInsumosDto>>) => {
    const query = parseWithSchema(listInsumosQuerySchema, req.query);
    const result = await this.insumosService.list(query);
    res.status(200).json({ success: true, data: result });
  });

  getById = wrapAsync(async (req, res: Response<ApiSuccess<InsumoDto>>) => {
    const { id } = parseWithSchema(insumoIdParamSchema, req.params);
    const insumo = await this.insumosService.getById(id);
    res.status(200).json({ success: true, data: insumo });
  });

  create = wrapAsync(async (req, res: Response<ApiSuccess<InsumoDto>>) => {
    const input = parseWithSchema(createInsumoSchema, req.body);
    const insumo = await this.insumosService.create(input);
    res.status(201).json({ success: true, data: insumo });
  });

  update = wrapAsync(async (req, res: Response<ApiSuccess<InsumoDto>>) => {
    const { id } = parseWithSchema(insumoIdParamSchema, req.params);
    const input = parseWithSchema(updateInsumoSchema, req.body);
    const insumo = await this.insumosService.update(id, input);
    res.status(200).json({ success: true, data: insumo });
  });

  remove = wrapAsync(async (req, res) => {
    const { id } = parseWithSchema(insumoIdParamSchema, req.params);
    await this.insumosService.delete(id);
    res.status(204).send();
  });
}
