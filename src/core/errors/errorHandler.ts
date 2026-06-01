import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { applyCorsHeaders } from "../../config/applyCorsHeaders.js";
import { AppError } from "./AppError.js";
import type { ApiFailure } from "../http/apiResponse.js";

function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): AppError | null {
  if (error.code === "P2002") {
    const target = error.meta?.target;
    const fields = Array.isArray(target) ? target.join(", ") : "campo único";
    return AppError.conflict(`Ya existe un registro con el mismo valor: ${fields}`);
  }
  if (error.code === "P2025") {
    return AppError.notFound("Registro no encontrado");
  }
  return null;
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response<ApiFailure>,
  _next: NextFunction,
): void {
  applyCorsHeaders(req, res);

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Error de validación",
        details: error.flatten(),
      },
    });
    return;
  }

  if (isAppError(error)) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(error);
    if (mapped) {
      res.status(mapped.statusCode).json({
        success: false,
        error: {
          code: mapped.code,
          message: mapped.message,
        },
      });
      return;
    }
  }

  console.error("Error no controlado:", error);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Error interno del servidor",
    },
  });
}
