import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { HistoriasClinicasService } from "./historias-clinicas.service.js";
import {
  createHistoriaClinicaSchema,
  historiaClinicaIdParamSchema,
  historiaClinicaPacienteIdParamSchema,
  listHistoriasClinicasQuerySchema,
  updateHistoriaClinicaSchema,
} from "./historias-clinicas.validation.js";
import type {
  HistoriaClinicaDto,
  HistoriaClinicaListItemDto,
  PaginatedHistoriasClinicasDto,
} from "./historias-clinicas.dto.js";

export class HistoriasClinicasController {
  constructor(private readonly historiasClinicasService: HistoriasClinicasService) {}

  list = wrapAsync(async (req, res: Response<ApiSuccess<PaginatedHistoriasClinicasDto>>) => {
    const query = parseWithSchema(listHistoriasClinicasQuerySchema, req.query);
    const result = await this.historiasClinicasService.list(query);
    res.status(200).json({ success: true, data: result });
  });

  getByPacienteId = wrapAsync(async (req, res: Response<ApiSuccess<HistoriaClinicaDto>>) => {
    const { pacienteId } = parseWithSchema(historiaClinicaPacienteIdParamSchema, req.params);
    const historia = await this.historiasClinicasService.getByPacienteId(pacienteId);
    res.status(200).json({ success: true, data: historia });
  });

  getById = wrapAsync(async (req, res: Response<ApiSuccess<HistoriaClinicaDto>>) => {
    const { id } = parseWithSchema(historiaClinicaIdParamSchema, req.params);
    const historia = await this.historiasClinicasService.getById(id);
    res.status(200).json({ success: true, data: historia });
  });

  create = wrapAsync(async (req, res: Response<ApiSuccess<HistoriaClinicaListItemDto>>) => {
    const input = parseWithSchema(createHistoriaClinicaSchema, req.body);
    const historia = await this.historiasClinicasService.create(input);
    res.status(201).json({ success: true, data: historia });
  });

  update = wrapAsync(async (req, res: Response<ApiSuccess<HistoriaClinicaListItemDto>>) => {
    const { id } = parseWithSchema(historiaClinicaIdParamSchema, req.params);
    const input = parseWithSchema(updateHistoriaClinicaSchema, req.body);
    const historia = await this.historiasClinicasService.update(id, input);
    res.status(200).json({ success: true, data: historia });
  });

  remove = wrapAsync(async (req, res) => {
    const { id } = parseWithSchema(historiaClinicaIdParamSchema, req.params);
    await this.historiasClinicasService.delete(id);
    res.status(204).send();
  });
}
