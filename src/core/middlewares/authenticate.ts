import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../shared/prisma.js";
import { extractBearerToken } from "../../shared/http/extractBearerToken.js";
import { verifyAccessToken } from "../../shared/jwt.js";
import { AppError } from "../errors/AppError.js";
import { wrapAsync } from "../http/wrapAsync.js";

export const authenticate = wrapAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw AppError.unauthorized("Token no enviado");
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw AppError.unauthorized("Token inválido o expirado");
    }

    const revoked = await prisma.revokedToken.findUnique({
      where: { jti: payload.jti },
      select: { jti: true },
    });
    if (revoked) {
      throw AppError.unauthorized("Sesión cerrada");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw AppError.unauthorized("Usuario no encontrado");
    }

    if (!user.estado) {
      throw AppError.unauthorized("Usuario inactivo");
    }

    req.auth = {
      userId: user.id,
      email: user.email,
      roles: user.roles.map((ur) => ur.role.nombre),
    };

    next();
  },
);
