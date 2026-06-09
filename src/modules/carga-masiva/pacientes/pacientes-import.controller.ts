import type { Response } from "express";
import type { ApiSuccess } from "../../../core/http/apiResponse.js";
import { AppError } from "../../../core/errors/AppError.js";
import { wrapAsync } from "../../../core/http/wrapAsync.js";
import type { PacientesImportResultDto } from "./pacientes-import.dto.js";
import type { PacientesImportService } from "./pacientes-import.service.js";

export class PacientesImportController {
  constructor(private readonly pacientesImportService: PacientesImportService) {}

  importPacientes = wrapAsync(async (req, res: Response<ApiSuccess<PacientesImportResultDto>>) => {
    const file = req.file;

    if (!file) {
      throw AppError.badRequest('Debe enviar un archivo Excel en el campo "file"');
    }

    const result = await this.pacientesImportService.importFromExcel(file.buffer);
    res.status(200).json({ success: true, data: result });
  });
}
