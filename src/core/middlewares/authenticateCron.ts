import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../errors/AppError.js";
import { wrapAsync } from "../http/wrapAsync.js";
import { extractBearerToken } from "../../shared/http/extractBearerToken.js";

function secretsMatch(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(providedBuf, expectedBuf);
}

export const authenticateCron = wrapAsync((req: Request, _res: Response, next: NextFunction) => {
  if (!env.CRON_SECRET) {
    throw new AppError(
      "El cierre automático por cron no está configurado en el servidor",
      503,
      "INTERNAL_ERROR",
    );
  }

  const token = extractBearerToken(req.headers.authorization);
  if (!token || !secretsMatch(token, env.CRON_SECRET)) {
    throw AppError.unauthorized("Credencial de cron inválida");
  }

  next();
  return Promise.resolve();
});
