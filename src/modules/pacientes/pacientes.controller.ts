import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { AppError } from "../../core/errors/AppError.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { PacientesService } from "./pacientes.service.js";
import {
  createPacienteSchema,
  listPacientesQuerySchema,
  pacienteCodigoQrParamSchema,
  pacienteIdParamSchema,
  updatePacienteSchema,
} from "./pacientes.validation.js";
import type { PacienteDto, PaginatedPacientesDto } from "./pacientes.dto.js";

export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  list = wrapAsync(async (req, res: Response<ApiSuccess<PaginatedPacientesDto>>) => {
    const query = parseWithSchema(listPacientesQuerySchema, req.query);
    const result = await this.pacientesService.list(query);
    res.status(200).json({ success: true, data: result });
  });

  getByCodigoQr = wrapAsync(async (req, res: Response<ApiSuccess<PacienteDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const { codigoQr } = parseWithSchema(pacienteCodigoQrParamSchema, req.params);
    const paciente = await this.pacientesService.getByCodigoQr(codigoQr, req.auth);
    res.status(200).json({ success: true, data: paciente });
  });

  getById = wrapAsync(async (req, res: Response<ApiSuccess<PacienteDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const { id } = parseWithSchema(pacienteIdParamSchema, req.params);
    const paciente = await this.pacientesService.getById(id, req.auth);
    res.status(200).json({ success: true, data: paciente });
  });

  create = wrapAsync(async (req, res: Response<ApiSuccess<PacienteDto>>) => {
    const input = parseWithSchema(createPacienteSchema, req.body);
    const paciente = await this.pacientesService.create(input);
    res.status(201).json({ success: true, data: paciente });
  });

  update = wrapAsync(async (req, res: Response<ApiSuccess<PacienteDto>>) => {
    const { id } = parseWithSchema(pacienteIdParamSchema, req.params);
    const input = parseWithSchema(updatePacienteSchema, req.body);
    const paciente = await this.pacientesService.update(id, input);
    res.status(200).json({ success: true, data: paciente });
  });

  remove = wrapAsync(async (req, res: Response<ApiSuccess<null>>) => {
    const { id } = parseWithSchema(pacienteIdParamSchema, req.params);
    await this.pacientesService.delete(id);
    res.status(200).json({ success: true, data: null });
  });
}
