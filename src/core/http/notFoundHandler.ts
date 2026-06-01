import type { RequestHandler } from "express";
import type { ApiFailure } from "../http/apiResponse.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ApiFailure = {
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Ruta no encontrada",
    },
  };
  res.status(404).json(body);
};
