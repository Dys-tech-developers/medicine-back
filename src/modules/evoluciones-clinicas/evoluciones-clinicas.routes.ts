import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { EvolucionesClinicasRepository } from "./evoluciones-clinicas.repository.js";
import { EvolucionesClinicasService } from "./evoluciones-clinicas.service.js";
import { EvolucionesClinicasController } from "./evoluciones-clinicas.controller.js";

const evolucionesClinicasRepository = new EvolucionesClinicasRepository(prisma);
const evolucionesClinicasService = new EvolucionesClinicasService(evolucionesClinicasRepository);
const evolucionesClinicasController = new EvolucionesClinicasController(evolucionesClinicasService);

export const evolucionesClinicasRouter = Router();

const readRoles = [ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR] as const;
const writeRoles = [ROLE.ADMIN, ROLE.OPERADOR] as const;

evolucionesClinicasRouter.get(
  "/",
  authenticate,
  authorizeRoles(...readRoles),
  evolucionesClinicasController.list,
);

evolucionesClinicasRouter.get(
  "/:id",
  authenticate,
  authorizeRoles(...readRoles),
  evolucionesClinicasController.getById,
);

evolucionesClinicasRouter.post(
  "/",
  authenticate,
  authorizeRoles(...writeRoles),
  evolucionesClinicasController.create,
);

evolucionesClinicasRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles(...writeRoles),
  evolucionesClinicasController.update,
);

evolucionesClinicasRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  evolucionesClinicasController.remove,
);
