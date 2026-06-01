import type { Response } from "express";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { PacienteServiciosService } from "./paciente-servicios.service.js";
import {
  createPacienteServicioSchema,
  listPacienteServiciosQuerySchema,
  pacienteServicioIdParamSchema,
  updatePacienteServicioSchema,
} from "./paciente-servicios.validation.js";
import type {
  PacienteServicioDisponibilidadDto,
  PaginatedPacienteServiciosDto,
  PacienteServicioDto,
} from "./paciente-servicios.dto.js";

export class PacienteServiciosController {
  constructor(private readonly service: PacienteServiciosService) {}

  list = wrapAsync(async (req, res: Response<ApiSuccess<PaginatedPacienteServiciosDto>>) => {
    const query = parseWithSchema(listPacienteServiciosQuerySchema, req.query);
    const result = await this.service.list(query);
    res.status(200).json({ success: true, data: result });
  });

  getById = wrapAsync(async (req, res: Response<ApiSuccess<PacienteServicioDto>>) => {
    const { id } = parseWithSchema(pacienteServicioIdParamSchema, req.params);
    const row = await this.service.getById(id);
    res.status(200).json({ success: true, data: row });
  });

  getDisponibilidad = wrapAsync(
    async (req, res: Response<ApiSuccess<PacienteServicioDisponibilidadDto>>) => {
      const { id } = parseWithSchema(pacienteServicioIdParamSchema, req.params);
      const disponibilidad = await this.service.getDisponibilidad(id);
      res.status(200).json({ success: true, data: disponibilidad });
    },
  );

  create = wrapAsync(async (req, res: Response<ApiSuccess<PacienteServicioDto>>) => {
    const input = parseWithSchema(createPacienteServicioSchema, req.body);
    const row = await this.service.create(input);
    res.status(201).json({ success: true, data: row });
  });

  update = wrapAsync(async (req, res: Response<ApiSuccess<PacienteServicioDto>>) => {
    const { id } = parseWithSchema(pacienteServicioIdParamSchema, req.params);
    const input = parseWithSchema(updatePacienteServicioSchema, req.body);
    const row = await this.service.update(id, input);
    res.status(200).json({ success: true, data: row });
  });

  remove = wrapAsync(async (req, res: Response<ApiSuccess<null>>) => {
    const { id } = parseWithSchema(pacienteServicioIdParamSchema, req.params);
    await this.service.delete(id);
    res.status(200).json({ success: true, data: null });
  });
}
