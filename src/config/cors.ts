import type { CorsOptions } from "cors";
import { env } from "./env.js";

/** Orígenes del frontend en túnel ngrok u otros hosts fijos (además de CORS_ORIGINS y *.ngrok-free.app). */
export const STATIC_ALLOWED_ORIGINS = [
  "https://8a41-181-230-197-220.ngrok-free.app",
];

const DEFAULT_DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

const DEV_HOST_SUFFIXES = [".ngrok-free.app", ".ngrok.io", ".ngrok.app"];

function parseOriginsFromEnv(raw: string): string[] {
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function resolveAllowedOrigins(): string[] {
  const fromEnv =
    env.CORS_ORIGINS !== undefined ? parseOriginsFromEnv(env.CORS_ORIGINS) : [];
  const base = [...STATIC_ALLOWED_ORIGINS, ...fromEnv];

  if (env.NODE_ENV === "development") {
    return [...new Set([...DEFAULT_DEV_ORIGINS, ...base])];
  }

  return [...new Set(base)];
}

function isNgrokOrLocalhostHostname(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }
  return DEV_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

export function isRequestOriginAllowed(origin: string): boolean {
  if (env.NODE_ENV === "development") {
    return true;
  }

  return isOriginAllowed(origin, resolveAllowedOrigins());
}

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") {
      return false;
    }
    return isNgrokOrLocalhostHostname(hostname);
  } catch {
    return false;
  }
}

export function buildCorsOptions(): CorsOptions {
  const allowedOrigins = resolveAllowedOrigins();
  const isDevelopment = env.NODE_ENV === "development";

  // En dev: reflejar el Origin del request (ngrok, localhost, etc.) sin listas frágiles
  if (isDevelopment) {
    return {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
    };
  }

  return {
    origin(origin, callback) {
      if (origin === undefined) {
        callback(null, true);
        return;
      }

      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      console.warn(`[CORS] Origen rechazado: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
  };
}
