import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { ServicioTarifasRepository } from "./servicio-tarifas.repository.js";
import { ServicioTarifasService } from "./servicio-tarifas.service.js";
import { ServicioTarifasController } from "./servicio-tarifas.controller.js";

const repository = new ServicioTarifasRepository(prisma);
const service = new ServicioTarifasService(repository);
const controller = new ServicioTarifasController(service);

export const servicioTarifasRouter = Router({ mergeParams: true });

servicioTarifasRouter.get(
  "/",
  authenticate,
  authorizeRoles(ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR),
  controller.list,
);

servicioTarifasRouter.post(
  "/",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  controller.create,
);

servicioTarifasRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  controller.update,
);

servicioTarifasRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  controller.remove,
);
