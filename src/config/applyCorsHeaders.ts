import type { Request, Response } from "express";
import { env } from "./env.js";

const DEV_HOST_SUFFIXES = [".ngrok-free.app", ".ngrok.io", ".ngrok.app"];

function isNgrokOrLocalhostHostname(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }
  return DEV_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

function isOriginAllowed(origin: string): boolean {
  if (env.NODE_ENV === "development") {
    return true;
  }

  const allowed = env.CORS_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];
  if (allowed.includes(origin)) {
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

/** En respuestas de error, Express no siempre repite CORS; el navegador lo muestra como "CORS failed". */
export function applyCorsHeaders(req: Request, res: Response): void {
  const origin = req.headers.origin;
  if (typeof origin !== "string" || !isOriginAllowed(origin)) {
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, ngrok-skip-browser-warning",
  );
}
