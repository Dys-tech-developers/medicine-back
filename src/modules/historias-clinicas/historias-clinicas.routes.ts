import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { HistoriasClinicasRepository } from "./historias-clinicas.repository.js";
import { HistoriasClinicasService } from "./historias-clinicas.service.js";
import { HistoriasClinicasController } from "./historias-clinicas.controller.js";

const historiasClinicasRepository = new HistoriasClinicasRepository(prisma);
const historiasClinicasService = new HistoriasClinicasService(historiasClinicasRepository);
const historiasClinicasController = new HistoriasClinicasController(historiasClinicasService);

export const historiasClinicasRouter = Router();

const readRoles = [ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR] as const;
const writeRoles = [ROLE.ADMIN, ROLE.OPERADOR] as const;

historiasClinicasRouter.get(
  "/",
  authenticate,
  authorizeRoles(...readRoles),
  historiasClinicasController.list,
);

historiasClinicasRouter.get(
  "/paciente/:pacienteId",
  authenticate,
  authorizeRoles(...readRoles),
  historiasClinicasController.getByPacienteId,
);

historiasClinicasRouter.get(
  "/:id",
  authenticate,
  authorizeRoles(...readRoles),
  historiasClinicasController.getById,
);

historiasClinicasRouter.post(
  "/",
  authenticate,
  authorizeRoles(...writeRoles),
  historiasClinicasController.create,
);

historiasClinicasRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles(...writeRoles),
  historiasClinicasController.update,
);

historiasClinicasRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  historiasClinicasController.remove,
);
