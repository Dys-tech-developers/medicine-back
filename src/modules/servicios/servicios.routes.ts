import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { ServiciosRepository } from "./servicios.repository.js";
import { ServiciosService } from "./servicios.service.js";
import { ServiciosController } from "./servicios.controller.js";
import { servicioTarifasRouter } from "../servicio-tarifas/servicio-tarifas.routes.js";

const serviciosRepository = new ServiciosRepository(prisma);
const serviciosService = new ServiciosService(serviciosRepository);
const serviciosController = new ServiciosController(serviciosService);

export const serviciosRouter = Router();

const readRoles = [ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR] as const;
const writeRoles = [ROLE.ADMIN, ROLE.OPERADOR] as const;

serviciosRouter.get("/", authenticate, authorizeRoles(...readRoles), serviciosController.list);

serviciosRouter.post("/", authenticate, authorizeRoles(...writeRoles), serviciosController.create);

serviciosRouter.use("/:servicioId/tarifas", servicioTarifasRouter);

serviciosRouter.patch(
  "/:id/estado",
  authenticate,
  authorizeRoles(...writeRoles),
  serviciosController.updateEstado,
);

serviciosRouter.get("/:id", authenticate, authorizeRoles(...readRoles), serviciosController.getById);

serviciosRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles(...writeRoles),
  serviciosController.update,
);

serviciosRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  serviciosController.remove,
);
