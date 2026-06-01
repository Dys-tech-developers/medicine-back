import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { ServiciosService } from "./servicios.service.js";
import {
  createServicioSchema,
  listServiciosQuerySchema,
  servicioIdParamSchema,
  updateServicioEstadoSchema,
  updateServicioSchema,
} from "./servicios.validation.js";
import type { PaginatedServiciosDto, ServicioConTarifasDto, ServicioDto } from "./servicios.dto.js";

export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  list = wrapAsync(async (req, res: Response<ApiSuccess<PaginatedServiciosDto>>) => {
    const query = parseWithSchema(listServiciosQuerySchema, req.query);
    const result = await this.serviciosService.list(query);
    res.status(200).json({ success: true, data: result });
  });

  getById = wrapAsync(async (req, res: Response<ApiSuccess<ServicioConTarifasDto>>) => {
    const { id } = parseWithSchema(servicioIdParamSchema, req.params);
    const servicio = await this.serviciosService.getById(id);
    res.status(200).json({ success: true, data: servicio });
  });

  create = wrapAsync(async (req, res: Response<ApiSuccess<ServicioConTarifasDto>>) => {
    const input = parseWithSchema(createServicioSchema, req.body);
    const servicio = await this.serviciosService.create(input);
    res.status(201).json({ success: true, data: servicio });
  });

  update = wrapAsync(async (req, res: Response<ApiSuccess<ServicioDto>>) => {
    const { id } = parseWithSchema(servicioIdParamSchema, req.params);
    const input = parseWithSchema(updateServicioSchema, req.body);
    const servicio = await this.serviciosService.update(id, input);
    res.status(200).json({ success: true, data: servicio });
  });

  updateEstado = wrapAsync(async (req, res: Response<ApiSuccess<ServicioDto>>) => {
    const { id } = parseWithSchema(servicioIdParamSchema, req.params);
    const input = parseWithSchema(updateServicioEstadoSchema, req.body);
    const servicio = await this.serviciosService.updateEstado(id, input);
    res.status(200).json({ success: true, data: servicio });
  });

  remove = wrapAsync(async (req, res) => {
    const { id } = parseWithSchema(servicioIdParamSchema, req.params);
    await this.serviciosService.delete(id);
    res.status(204).send();
  });
}
