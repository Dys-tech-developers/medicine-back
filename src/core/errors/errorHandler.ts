import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { applyCorsHeaders } from "../../config/applyCorsHeaders.js";
import { AppError } from "./AppError.js";
import type { ApiFailure } from "../http/apiResponse.js";

function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

const UNIQUE_CONSTRAINT_MESSAGES: Record<string, string> = {
  numero_documento: "Ya existe un paciente con ese número de documento.",
  numeroDocumento: "Ya existe un paciente con ese número de documento.",
  email: "El email ya está registrado.",
  codigo: "Ya existe un insumo con ese código.",
  codigo_qr: "El código QR del paciente ya está en uso.",
  codigoQr: "El código QR del paciente ya está en uso.",
  paciente_id: "El paciente ya tiene una historia clínica registrada.",
  pacienteId: "El paciente ya tiene una historia clínica registrada.",
  visita_id: "Esta visita ya tiene datos financieros registrados.",
  visitaId: "Esta visita ya tiene datos financieros registrados.",
  nombre: "Ya existe un registro con ese nombre.",
};

const UNIQUE_FIELD_LABELS: Record<string, string> = {
  numero_documento: "número de documento",
  numeroDocumento: "número de documento",
  email: "email",
  codigo: "código",
  codigo_qr: "código QR",
  codigoQr: "código QR",
  paciente_id: "paciente",
  pacienteId: "paciente",
  visita_id: "visita",
  visitaId: "visita",
  nombre: "nombre",
};

function uniqueConstraintFields(target: unknown): string[] {
  if (Array.isArray(target)) {
    return target.map(String);
  }
  if (typeof target === "string") {
    return [target];
  }
  return [];
}

function mapUniqueConstraintMessage(target: unknown): string {
  const fields = uniqueConstraintFields(target);

  for (const field of fields) {
    const message = UNIQUE_CONSTRAINT_MESSAGES[field];
    if (message) {
      return message;
    }
  }

  const indexField = fields.find((field) => field.includes("numero_documento"));
  if (indexField) {
    return UNIQUE_CONSTRAINT_MESSAGES.numero_documento!;
  }

  const labels = fields
    .map((field) => UNIQUE_FIELD_LABELS[field] ?? field.replaceAll("_", " "))
    .join(", ");

  if (labels.length > 0) {
    return `Ya existe un registro con el mismo ${labels}.`;
  }

  return "Ya existe un registro con el mismo valor.";
}

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): AppError | null {
  if (error.code === "P2002") {
    return AppError.conflict(mapUniqueConstraintMessage(error.meta?.target));
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
