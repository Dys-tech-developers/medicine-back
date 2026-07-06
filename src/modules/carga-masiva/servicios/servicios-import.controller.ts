import type { Response } from "express";
import type { ApiSuccess } from "../../../core/http/apiResponse.js";
import { AppError } from "../../../core/errors/AppError.js";
import { wrapAsync } from "../../../core/http/wrapAsync.js";
import type { ServiciosImportResultDto } from "./servicios-import.dto.js";
import type { ServiciosImportService } from "./servicios-import.service.js";

export class ServiciosImportController {
  constructor(private readonly serviciosImportService: ServiciosImportService) {}

  importServicios = wrapAsync(async (req, res: Response<ApiSuccess<ServiciosImportResultDto>>) => {
    const file = req.file;

    if (!file) {
      throw AppError.badRequest('Debe enviar un archivo Excel en el campo "file"');
    }

    const result = await this.serviciosImportService.importFromExcel(file.buffer);
    res.status(200).json({ success: true, data: result });
  });
}
