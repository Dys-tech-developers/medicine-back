import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { AppError } from "../../core/errors/AppError.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { VisitasService } from "./visitas.service.js";
import {
  bulkUpdateVisitaFinanzasSchema,
  createVisitaSchema,
  gestionarTramoAdminSchema,
  finalizarVisitaSchema,
  iniciarVisitaSchema,
  listVisitasQuerySchema,
  relevarVisitaSchema,
  updateVisitaFinanzasSchema,
  updateVisitaSchema,
  visitaIdParamSchema,
  visitaPendienteQuerySchema,
} from "./visitas.validation.js";
import type {
  BulkUpdateVisitaFinanzasResultDto,
  GestionarTramoAdminDto,
  PaginatedVisitasDto,
  RelevarVisitaDto,
  VisitaDto,
  VisitaPendienteDto,
} from "./visitas.dto.js";

export class VisitasController {
  constructor(private readonly visitasService: VisitasService) {}

  list = wrapAsync(async (req, res: Response<ApiSuccess<PaginatedVisitasDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const query = parseWithSchema(listVisitasQuerySchema, req.query);
    const result = await this.visitasService.list(req.auth, query);
    res.status(200).json({ success: true, data: result });
  });

  getPendiente = wrapAsync(async (req, res: Response<ApiSuccess<VisitaPendienteDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const query = parseWithSchema(visitaPendienteQuerySchema, req.query);
    const result = await this.visitasService.getPendiente(req.auth, query);
    res.status(200).json({ success: true, data: result });
  });

  iniciar = wrapAsync(async (req, res: Response<ApiSuccess<VisitaDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const input = parseWithSchema(iniciarVisitaSchema, req.body);
    const visita = await this.visitasService.iniciar(req.auth, input);
    res.status(201).json({ success: true, data: visita });
  });

  relevar = wrapAsync(async (req, res: Response<ApiSuccess<RelevarVisitaDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const input = parseWithSchema(relevarVisitaSchema, req.body);
    const result = await this.visitasService.relevar(req.auth, input);
    res.status(201).json({ success: true, data: result });
  });

  finalizar = wrapAsync(async (req, res: Response<ApiSuccess<VisitaDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const { id } = parseWithSchema(visitaIdParamSchema, req.params);
    const input = parseWithSchema(finalizarVisitaSchema, req.body);
    const visita = await this.visitasService.finalizar(req.auth, id, input);
    res.status(200).json({ success: true, data: visita });
  });

  gestionarTramoAdmin = wrapAsync(
    async (req, res: Response<ApiSuccess<GestionarTramoAdminDto>>) => {
      if (!req.auth) {
        throw AppError.unauthorized();
      }
      const input = parseWithSchema(gestionarTramoAdminSchema, req.body);
      const result = await this.visitasService.gestionarTramoAdmin(req.auth, input);
      res.status(200).json({ success: true, data: result });
    },
  );

  cancelar = wrapAsync(async (req, res: Response<ApiSuccess<VisitaDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const { id } = parseWithSchema(visitaIdParamSchema, req.params);
    const visita = await this.visitasService.cancelar(req.auth, id);
    res.status(200).json({ success: true, data: visita });
  });

  getById = wrapAsync(async (req, res: Response<ApiSuccess<VisitaDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const { id } = parseWithSchema(visitaIdParamSchema, req.params);
    const visita = await this.visitasService.getById(req.auth, id);
    res.status(200).json({ success: true, data: visita });
  });

  create = wrapAsync(async (req, res: Response<ApiSuccess<VisitaDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const input = parseWithSchema(createVisitaSchema, req.body);
    const visita = await this.visitasService.create(req.auth, input);
    res.status(201).json({ success: true, data: visita });
  });

  update = wrapAsync(async (req, res: Response<ApiSuccess<VisitaDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const { id } = parseWithSchema(visitaIdParamSchema, req.params);
    const input = parseWithSchema(updateVisitaSchema, req.body);
    const visita = await this.visitasService.update(req.auth, id, input);
    res.status(200).json({ success: true, data: visita });
  });

  updateFinanzas = wrapAsync(async (req, res: Response<ApiSuccess<VisitaDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const { id } = parseWithSchema(visitaIdParamSchema, req.params);
    const input = parseWithSchema(updateVisitaFinanzasSchema, req.body);
    const visita = await this.visitasService.updateFinanzas(req.auth, id, input);
    res.status(200).json({ success: true, data: visita });
  });

  bulkUpdateFinanzas = wrapAsync(
    async (req, res: Response<ApiSuccess<BulkUpdateVisitaFinanzasResultDto>>) => {
      if (!req.auth) {
        throw AppError.unauthorized();
      }
      const input = parseWithSchema(bulkUpdateVisitaFinanzasSchema, req.body);
      const result = await this.visitasService.bulkUpdateFinanzas(req.auth, input);
      res.status(200).json({ success: true, data: result });
    },
  );

  remove = wrapAsync(async (req, res) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const { id } = parseWithSchema(visitaIdParamSchema, req.params);
    await this.visitasService.delete(req.auth, id);
    res.status(204).send();
  });
}
