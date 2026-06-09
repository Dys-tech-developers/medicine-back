import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError.js";

const EXCEL_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: EXCEL_MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith(".xlsx")) {
      cb(null, true);
      return;
    }
    cb(new Error("INVALID_FILE_TYPE"));
  },
}).single("file");

export function uploadExcelSingle(req: Request, res: Response, next: NextFunction): void {
  excelUpload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(AppError.badRequest("El archivo no puede superar 5 MB"));
        return;
      }
      next(AppError.badRequest(err.message));
      return;
    }

    if (err instanceof Error && err.message === "INVALID_FILE_TYPE") {
      next(AppError.badRequest('Solo se permiten archivos con extensión ".xlsx"'));
      return;
    }

    if (err) {
      next(err);
      return;
    }

    next();
  });
}
