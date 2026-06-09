import type { Response } from "express";
import type { ApiSuccess } from "../../../core/http/apiResponse.js";
import { AppError } from "../../../core/errors/AppError.js";
import { wrapAsync } from "../../../core/http/wrapAsync.js";
import type { PrestadoresImportResultDto } from "./prestadores-import.dto.js";
import type { PrestadoresImportService } from "./prestadores-import.service.js";

export class PrestadoresImportController {
  constructor(private readonly prestadoresImportService: PrestadoresImportService) {}

  importPrestadores = wrapAsync(async (req, res: Response<ApiSuccess<PrestadoresImportResultDto>>) => {
    const file = req.file;

    if (!file) {
      throw AppError.badRequest('Debe enviar un archivo Excel en el campo "file"');
    }

    const result = await this.prestadoresImportService.importFromExcel(file.buffer);
    res.status(200).json({ success: true, data: result });
  });
}
