import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { AuthRepository } from "../auth/auth.repository.js";
import { ReportesRepository } from "../reportes/reportes.repository.js";
import { PrestadoresRepository } from "./prestadores.repository.js";
import { PrestadoresService } from "./prestadores.service.js";
import { PrestadoresController } from "./prestadores.controller.js";

const prestadoresRepository = new PrestadoresRepository(prisma);
const authRepository = new AuthRepository(prisma);
const reportesRepository = new ReportesRepository(prisma);
const prestadoresService = new PrestadoresService(
  prestadoresRepository,
  authRepository,
  reportesRepository,
);
const prestadoresController = new PrestadoresController(prestadoresService);

export const prestadoresRouter = Router();

prestadoresRouter.get(
  "/me",
  authenticate,
  authorizeRoles(ROLE.PRESTADOR),
  prestadoresController.me,
);

prestadoresRouter.get(
  "/",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  prestadoresController.list,
);

prestadoresRouter.post(
  "/",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  prestadoresController.create,
);
