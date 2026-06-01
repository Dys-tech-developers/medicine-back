import { randomUUID } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenClaims {
  sub: number;
  email: string;
  jti: string;
}

export interface VerifiedAccessToken extends AccessTokenClaims {
  exp: number;
}

export function signAccessToken(payload: Pick<AccessTokenClaims, "sub" | "email">): string {
  const jti = randomUUID();
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "medicine-back",
    audience: "medicine-api",
  };

  return jwt.sign({ sub: payload.sub, email: payload.email, jti }, env.JWT_SECRET, options);
}

function parseUserId(sub: unknown): number {
  if (typeof sub === "number" && Number.isInteger(sub) && sub > 0) {
    return sub;
  }
  if (typeof sub === "string") {
    const parsed = Number.parseInt(sub, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  throw new Error("Identificador de usuario inválido en el token");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Buffer.isBuffer(value);
}

export function verifyAccessToken(token: string): VerifiedAccessToken {
  const decodedUnknown: unknown = jwt.verify(token, env.JWT_SECRET, {
    issuer: "medicine-back",
    audience: "medicine-api",
  });

  if (typeof decodedUnknown === "string" || Buffer.isBuffer(decodedUnknown)) {
    throw new Error("Token inválido");
  }

  if (!isPlainObject(decodedUnknown)) {
    throw new Error("Token inválido");
  }

  const emailUnknown: unknown = decodedUnknown.email;
  if (typeof emailUnknown !== "string") {
    throw new Error("Payload JWT incompleto");
  }

  const jtiUnknown: unknown = decodedUnknown.jti;
  if (typeof jtiUnknown !== "string" || jtiUnknown.length === 0) {
    throw new Error("Payload JWT incompleto");
  }

  const expUnknown: unknown = decodedUnknown.exp;
  if (typeof expUnknown !== "number") {
    throw new Error("Payload JWT incompleto");
  }

  const sub = parseUserId(decodedUnknown.sub);

  return { sub, email: emailUnknown, jti: jtiUnknown, exp: expUnknown };
}
