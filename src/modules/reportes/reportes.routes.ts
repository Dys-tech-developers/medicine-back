import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { ReportesRepository } from "./reportes.repository.js";
import { ReportesService } from "./reportes.service.js";
import { ReportesController } from "./reportes.controller.js";

const reportesRepository = new ReportesRepository(prisma);
const reportesService = new ReportesService(reportesRepository);
const reportesController = new ReportesController(reportesService);

export const reportesRouter = Router();

const reportesRoles = [ROLE.ADMIN, ROLE.OPERADOR] as const;

reportesRouter.get(
  "/visitas",
  authenticate,
  authorizeRoles(...reportesRoles),
  reportesController.visitas,
);

reportesRouter.get(
  "/prestadores",
  authenticate,
  authorizeRoles(...reportesRoles),
  reportesController.prestadores,
);

reportesRouter.get(
  "/servicios",
  authenticate,
  authorizeRoles(...reportesRoles),
  reportesController.servicios,
);
