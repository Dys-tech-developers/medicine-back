import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { VisitaInsumosRepository } from "./visita-insumos.repository.js";
import { VisitaInsumosService } from "./visita-insumos.service.js";
import { VisitaInsumosController } from "./visita-insumos.controller.js";

const visitaInsumosRepository = new VisitaInsumosRepository(prisma);
const visitaInsumosService = new VisitaInsumosService(visitaInsumosRepository);
const visitaInsumosController = new VisitaInsumosController(visitaInsumosService);

export const visitaInsumosRouter = Router({ mergeParams: true });

visitaInsumosRouter.get(
  "/",
  authenticate,
  authorizeRoles(ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR),
  visitaInsumosController.list,
);

visitaInsumosRouter.post(
  "/",
  authenticate,
  authorizeRoles(ROLE.ADMIN, ROLE.PRESTADOR),
  visitaInsumosController.register,
);
