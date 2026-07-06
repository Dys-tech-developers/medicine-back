import type { Express } from "express";
import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { historiasClinicasRouter } from "../modules/historias-clinicas/historias-clinicas.routes.js";
import { evolucionesClinicasRouter } from "../modules/evoluciones-clinicas/evoluciones-clinicas.routes.js";
import { pacientesRouter } from "../modules/pacientes/pacientes.routes.js";
import { pacienteServiciosRouter } from "../modules/paciente-servicios/paciente-servicios.routes.js";
import { obrasSocialesRouter } from "../modules/obras-sociales/obras-sociales.routes.js";
import { serviciosRouter } from "../modules/servicios/servicios.routes.js";
import { insumosRouter } from "../modules/insumos/insumos.routes.js";
import { prestadoresRouter } from "../modules/prestadores/prestadores.routes.js";
import { visitasRouter } from "../modules/visitas/visitas.routes.js";
import { visitaInsumosRouter } from "../modules/visita-insumos/visita-insumos.routes.js";
import { reportesRouter } from "../modules/reportes/reportes.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";
import { localidadesRouter } from "../modules/localidades/localidades.routes.js";
import { cargaMasivaRouter } from "../modules/carga-masiva/carga-masiva.routes.js";
import { cronRouter } from "../modules/cron/cron.routes.js";

export function buildApiRouter(): Router {
  const router = Router();
  router.use("/auth", authRouter);
  router.use("/users", usersRouter);
  router.use("/prestadores", prestadoresRouter);
  router.use("/obras-sociales", obrasSocialesRouter);
  router.use("/pacientes", pacientesRouter);
  router.use("/historias-clinicas", historiasClinicasRouter);
  router.use("/evoluciones-clinicas", evolucionesClinicasRouter);
  router.use("/servicios", serviciosRouter);
  router.use("/paciente-servicios", pacienteServiciosRouter);
  router.use("/insumos", insumosRouter);
  router.use("/visitas/:visitaId/insumos", visitaInsumosRouter);
  router.use("/visitas", visitasRouter);
  router.use("/reportes", reportesRouter);
  router.use("/localidades", localidadesRouter);
  router.use("/carga-masiva", cargaMasivaRouter);
  router.use("/internal/cron", cronRouter);
  return router;
}

export function registerHttpRoutes(app: Express): void {
  app.use("/api/v1", buildApiRouter());
}
