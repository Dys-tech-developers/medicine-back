export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public readonly statusCode: number;

  public readonly code: ErrorCode;

  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: ErrorCode, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static unauthorized(message = "No autenticado"): AppError {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Sin permisos suficientes"): AppError {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(message = "Recurso no encontrado"): AppError {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400, "VALIDATION_ERROR");
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, "CONFLICT");
  }

  static internal(message: string): AppError {
    return new AppError(message, 500, "INTERNAL_ERROR");
  }
}
