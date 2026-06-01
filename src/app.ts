import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { buildCorsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { errorHandler } from "./core/errors/errorHandler.js";
import { notFoundHandler } from "./core/http/notFoundHandler.js";
import { registerHttpRoutes } from "./routes/index.js";

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");

  // ngrok / reverse proxy envían X-Forwarded-For
  if (env.NODE_ENV === "development" || env.TRUST_PROXY) {
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: "1mb" }));

  if (env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 600,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, data: { status: "ok" } });
  });

  registerHttpRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
