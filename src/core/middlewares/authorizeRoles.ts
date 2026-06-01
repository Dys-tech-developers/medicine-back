import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export function authorizeRoles(...allowedRoles: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(AppError.unauthorized());
      return;
    }

    const hasRole = req.auth.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      next(AppError.forbidden());
      return;
    }

    next();
  };
}
