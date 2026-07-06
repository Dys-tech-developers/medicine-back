import type { Response } from "express";
import type { ApiSuccess } from "../../../core/http/apiResponse.js";
import { AppError } from "../../../core/errors/AppError.js";
import { wrapAsync } from "../../../core/http/wrapAsync.js";
import type { StockImportResultDto } from "./stock-import.dto.js";
import type { StockImportService } from "./stock-import.service.js";

export class StockImportController {
  constructor(private readonly stockImportService: StockImportService) {}

  importStock = wrapAsync(async (req, res: Response<ApiSuccess<StockImportResultDto>>) => {
    const file = req.file;

    if (!file) {
      throw AppError.badRequest('Debe enviar un archivo Excel en el campo "file"');
    }

    const result = await this.stockImportService.importFromExcel(file.buffer);
    res.status(200).json({ success: true, data: result });
  });
}
