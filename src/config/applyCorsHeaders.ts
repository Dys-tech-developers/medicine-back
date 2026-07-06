import type { Request, Response } from "express";
import { isRequestOriginAllowed } from "./cors.js";

/** En respuestas de error, Express no siempre repite CORS; el navegador lo muestra como "CORS failed". */
export function applyCorsHeaders(req: Request, res: Response): void {
  const origin = req.headers.origin;
  if (typeof origin !== "string" || !isRequestOriginAllowed(origin)) {
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, ngrok-skip-browser-warning",
  );
}
