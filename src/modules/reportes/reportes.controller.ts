import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { AppError } from "../../core/errors/AppError.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type {
  ReportePrestadoresResponseDto,
  ReporteServiciosResponseDto,
  ReporteVisitasResponseDto,
} from "./reportes.dto.js";
import type { ReportesService } from "./reportes.service.js";
import { reportesQuerySchema, reportesVisitasQuerySchema } from "./reportes.validation.js";

export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  prestadores = wrapAsync(async (req, res: Response<ApiSuccess<ReportePrestadoresResponseDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const query = parseWithSchema(reportesQuerySchema, req.query);
    const data = await this.reportesService.reportePorPrestadores(query);
    res.status(200).json({ success: true, data });
  });

  servicios = wrapAsync(async (req, res: Response<ApiSuccess<ReporteServiciosResponseDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const query = parseWithSchema(reportesQuerySchema, req.query);
    const data = await this.reportesService.reportePorServicios(query);
    res.status(200).json({ success: true, data });
  });

  visitas = wrapAsync(async (req, res: Response<ApiSuccess<ReporteVisitasResponseDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const query = parseWithSchema(reportesVisitasQuerySchema, req.query);
    const data = await this.reportesService.reporteVisitas(query);
    res.status(200).json({ success: true, data });
  });
}
