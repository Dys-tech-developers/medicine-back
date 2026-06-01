import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { PacienteServiciosRepository } from "./paciente-servicios.repository.js";
import { PacienteServiciosService } from "./paciente-servicios.service.js";
import { PacienteServiciosController } from "./paciente-servicios.controller.js";

const repository = new PacienteServiciosRepository(prisma);
const service = new PacienteServiciosService(repository);
const controller = new PacienteServiciosController(service);

export const pacienteServiciosRouter = Router();

const readRoles = [ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR] as const;
const writeRoles = [ROLE.ADMIN, ROLE.OPERADOR] as const;

pacienteServiciosRouter.get(
  "/",
  authenticate,
  authorizeRoles(...readRoles),
  controller.list,
);

pacienteServiciosRouter.get(
  "/:id/disponibilidad",
  authenticate,
  authorizeRoles(...readRoles),
  controller.getDisponibilidad,
);

pacienteServiciosRouter.get(
  "/:id",
  authenticate,
  authorizeRoles(...readRoles),
  controller.getById,
);

pacienteServiciosRouter.post(
  "/",
  authenticate,
  authorizeRoles(...writeRoles),
  controller.create,
);

pacienteServiciosRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles(...writeRoles),
  controller.update,
);

pacienteServiciosRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  controller.remove,
);
