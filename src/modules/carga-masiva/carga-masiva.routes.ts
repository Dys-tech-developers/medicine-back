import { Router } from "express";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { uploadExcelSingle } from "../../core/middlewares/uploadExcel.js";
import { ROLE } from "../../shared/constants/roles.js";
import { prisma } from "../../shared/prisma.js";
import { AuthRepository } from "../auth/auth.repository.js";
import { LocalidadesRepository } from "../localidades/localidades.repository.js";
import { ObrasSocialesRepository } from "../obras-sociales/obras-sociales.repository.js";
import { PacientesRepository } from "../pacientes/pacientes.repository.js";
import { PrestadoresRepository } from "../prestadores/prestadores.repository.js";
import { PrestadoresService } from "../prestadores/prestadores.service.js";
import { ReportesRepository } from "../reportes/reportes.repository.js";
import { ServiciosRepository } from "../servicios/servicios.repository.js";
import { PacientesImportController } from "./pacientes/pacientes-import.controller.js";
import { PacientesImportService } from "./pacientes/pacientes-import.service.js";
import { PacientesPlantillaController } from "./pacientes/pacientes-plantilla.controller.js";
import { PacientesPlantillaService } from "./pacientes/pacientes-plantilla.service.js";
import { PrestadoresImportController } from "./prestadores/prestadores-import.controller.js";
import { PrestadoresImportService } from "./prestadores/prestadores-import.service.js";
import { PrestadoresPlantillaController } from "./prestadores/prestadores-plantilla.controller.js";
import { PrestadoresPlantillaService } from "./prestadores/prestadores-plantilla.service.js";

const obrasSocialesRepository = new ObrasSocialesRepository(prisma);
const localidadesRepository = new LocalidadesRepository(prisma);
const pacientesRepository = new PacientesRepository(prisma);
const serviciosRepository = new ServiciosRepository(prisma);
const prestadoresRepository = new PrestadoresRepository(prisma);
const authRepository = new AuthRepository(prisma);
const reportesRepository = new ReportesRepository(prisma);

const pacientesPlantillaService = new PacientesPlantillaService(
  obrasSocialesRepository,
  localidadesRepository,
);
const pacientesImportService = new PacientesImportService(
  pacientesRepository,
  obrasSocialesRepository,
  localidadesRepository,
);
const prestadoresService = new PrestadoresService(
  prestadoresRepository,
  authRepository,
  reportesRepository,
);
const prestadoresPlantillaService = new PrestadoresPlantillaService(serviciosRepository);
const prestadoresImportService = new PrestadoresImportService(prestadoresService, serviciosRepository);

const pacientesPlantillaController = new PacientesPlantillaController(pacientesPlantillaService);
const pacientesImportController = new PacientesImportController(pacientesImportService);
const prestadoresPlantillaController = new PrestadoresPlantillaController(prestadoresPlantillaService);
const prestadoresImportController = new PrestadoresImportController(prestadoresImportService);

export const cargaMasivaRouter = Router();

const pacientesWriteRoles = [ROLE.ADMIN, ROLE.OPERADOR] as const;

cargaMasivaRouter.get(
  "/pacientes/plantilla",
  authenticate,
  authorizeRoles(...pacientesWriteRoles),
  pacientesPlantillaController.downloadPlantilla,
);

cargaMasivaRouter.post(
  "/pacientes",
  authenticate,
  authorizeRoles(...pacientesWriteRoles),
  uploadExcelSingle,
  pacientesImportController.importPacientes,
);

cargaMasivaRouter.get(
  "/prestadores/plantilla",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  prestadoresPlantillaController.downloadPlantilla,
);

cargaMasivaRouter.post(
  "/prestadores",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  uploadExcelSingle,
  prestadoresImportController.importPrestadores,
);
