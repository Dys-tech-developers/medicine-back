import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { VisitaInsumosService } from "./visita-insumos.service.js";
import {
  registerVisitaInsumosBodySchema,
  visitaIdParamSchema,
} from "./visita-insumos.validation.js";
import type { RegisterVisitaInsumosResultDto, VisitaInsumoDto } from "./visita-insumos.dto.js";

export class VisitaInsumosController {
  constructor(private readonly visitaInsumosService: VisitaInsumosService) {}

  list = wrapAsync(async (req, res: Response<ApiSuccess<VisitaInsumoDto[]>>) => {
    const { visitaId } = parseWithSchema(visitaIdParamSchema, req.params);
    const items = await this.visitaInsumosService.listByVisita(visitaId);
    res.status(200).json({ success: true, data: items });
  });

  register = wrapAsync(async (req, res: Response<ApiSuccess<RegisterVisitaInsumosResultDto>>) => {
    const { visitaId } = parseWithSchema(visitaIdParamSchema, req.params);
    const body = parseWithSchema(registerVisitaInsumosBodySchema, req.body);
    const result = await this.visitaInsumosService.register(visitaId, body);
    res.status(201).json({ success: true, data: result });
  });
}
