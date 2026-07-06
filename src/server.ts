import "dotenv/config";

import { createServer } from "node:http";
import { bootstrapVisitaScheduler } from "./bootstrap/visitaSchedulerBootstrap.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Servidor HTTP escuchando en 0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
  void bootstrapVisitaScheduler().catch((error: unknown) => {
    console.error("[visitaScheduler] Error al iniciar:", error);
  });
});
