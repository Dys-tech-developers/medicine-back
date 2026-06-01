import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { EvolucionesClinicasService } from "./evoluciones-clinicas.service.js";
import {
  createEvolucionClinicaSchema,
  evolucionClinicaIdParamSchema,
  listEvolucionesClinicasQuerySchema,
  updateEvolucionClinicaSchema,
} from "./evoluciones-clinicas.validation.js";
import type { EvolucionClinicaDto, PaginatedEvolucionesClinicasDto } from "./evoluciones-clinicas.dto.js";

export class EvolucionesClinicasController {
  constructor(private readonly evolucionesClinicasService: EvolucionesClinicasService) {}

  list = wrapAsync(async (req, res: Response<ApiSuccess<PaginatedEvolucionesClinicasDto>>) => {
    const query = parseWithSchema(listEvolucionesClinicasQuerySchema, req.query);
    const result = await this.evolucionesClinicasService.list(query);
    res.status(200).json({ success: true, data: result });
  });

  getById = wrapAsync(async (req, res: Response<ApiSuccess<EvolucionClinicaDto>>) => {
    const { id } = parseWithSchema(evolucionClinicaIdParamSchema, req.params);
    const evolucion = await this.evolucionesClinicasService.getById(id);
    res.status(200).json({ success: true, data: evolucion });
  });

  create = wrapAsync(async (req, res: Response<ApiSuccess<EvolucionClinicaDto>>) => {
    const input = parseWithSchema(createEvolucionClinicaSchema, req.body);
    const evolucion = await this.evolucionesClinicasService.create(input);
    res.status(201).json({ success: true, data: evolucion });
  });

  update = wrapAsync(async (req, res: Response<ApiSuccess<EvolucionClinicaDto>>) => {
    const { id } = parseWithSchema(evolucionClinicaIdParamSchema, req.params);
    const input = parseWithSchema(updateEvolucionClinicaSchema, req.body);
    const evolucion = await this.evolucionesClinicasService.update(id, input);
    res.status(200).json({ success: true, data: evolucion });
  });

  remove = wrapAsync(async (req, res) => {
    const { id } = parseWithSchema(evolucionClinicaIdParamSchema, req.params);
    await this.evolucionesClinicasService.delete(id);
    res.status(204).send();
  });
}
