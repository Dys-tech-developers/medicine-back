import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { VisitasRepository } from "./visitas.repository.js";
import { VisitasService } from "./visitas.service.js";
import { VisitasController } from "./visitas.controller.js";

const visitasRepository = new VisitasRepository(prisma);
const visitasService = new VisitasService(visitasRepository);
const visitasController = new VisitasController(visitasService);

export const visitasRouter = Router();

const readRoles = [ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR] as const;
const writeRoles = [ROLE.ADMIN, ROLE.PRESTADOR] as const;

visitasRouter.get("/", authenticate, authorizeRoles(...readRoles), visitasController.list);

visitasRouter.patch(
  "/finanzas/bulk",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  visitasController.bulkUpdateFinanzas,
);

visitasRouter.get("/:id", authenticate, authorizeRoles(...readRoles), visitasController.getById);

visitasRouter.post("/", authenticate, authorizeRoles(...writeRoles), visitasController.create);

visitasRouter.patch("/:id", authenticate, authorizeRoles(...writeRoles), visitasController.update);

visitasRouter.patch(
  "/:id/finanzas",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  visitasController.updateFinanzas,
);

visitasRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles(ROLE.ADMIN, ROLE.PRESTADOR),
  visitasController.remove,
);
