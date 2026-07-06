import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { LocalidadesRepository } from "../localidades/localidades.repository.js";
import { PacientesRepository } from "./pacientes.repository.js";
import { PacienteServiciosRepository } from "../paciente-servicios/paciente-servicios.repository.js";
import { PacienteServiciosService } from "../paciente-servicios/paciente-servicios.service.js";
import { VisitasRepository } from "../visitas/visitas.repository.js";
import { VisitasService } from "../visitas/visitas.service.js";
import { PacientesService } from "./pacientes.service.js";
import { PacientesController } from "./pacientes.controller.js";

const pacientesRepository = new PacientesRepository(prisma);
const localidadesRepository = new LocalidadesRepository(prisma);
const pacienteServiciosRepository = new PacienteServiciosRepository(prisma);
const pacienteServiciosService = new PacienteServiciosService(pacienteServiciosRepository);
const visitasRepository = new VisitasRepository(prisma);
const visitasService = new VisitasService(visitasRepository);
const pacientesService = new PacientesService(
  pacientesRepository,
  localidadesRepository,
  pacienteServiciosService,
  visitasRepository,
  visitasService,
);
const pacientesController = new PacientesController(pacientesService);

export const pacientesRouter = Router();

const readRoles = [ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR] as const;
const writeRoles = [ROLE.ADMIN, ROLE.OPERADOR] as const;

pacientesRouter.get("/", authenticate, authorizeRoles(...readRoles), pacientesController.list);

pacientesRouter.get(
  "/qr/:codigoQr",
  authenticate,
  authorizeRoles(...readRoles),
  pacientesController.getByCodigoQr,
);

pacientesRouter.get("/:id", authenticate, authorizeRoles(...readRoles), pacientesController.getById);

pacientesRouter.post("/", authenticate, authorizeRoles(...writeRoles), pacientesController.create);

pacientesRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles(...writeRoles),
  pacientesController.update,
);

pacientesRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  pacientesController.remove,
);
