import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { LocalidadesRepository } from "./localidades.repository.js";
import { LocalidadesService } from "./localidades.service.js";
import { LocalidadesController } from "./localidades.controller.js";

const localidadesRepository = new LocalidadesRepository(prisma);
const localidadesService = new LocalidadesService(localidadesRepository);
const localidadesController = new LocalidadesController(localidadesService);

export const localidadesRouter = Router();

localidadesRouter.get(
  "/",
  authenticate,
  authorizeRoles(ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR),
  localidadesController.list,
);
