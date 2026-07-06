import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { InsumosRepository } from "./insumos.repository.js";
import { InsumosService } from "./insumos.service.js";
import { InsumosController } from "./insumos.controller.js";

const insumosRepository = new InsumosRepository(prisma);
const insumosService = new InsumosService(insumosRepository);
const insumosController = new InsumosController(insumosService);

export const insumosRouter = Router();

insumosRouter.get(
  "/",
  authenticate,
  authorizeRoles(ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR),
  insumosController.list,
);

insumosRouter.get(
  "/:id",
  authenticate,
  authorizeRoles(ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR),
  insumosController.getById,
);

insumosRouter.post("/", authenticate, authorizeRoles(ROLE.ADMIN), insumosController.create);

insumosRouter.patch("/:id", authenticate, authorizeRoles(ROLE.ADMIN), insumosController.update);

insumosRouter.delete(
  "/bulk",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  insumosController.removeMany,
);

insumosRouter.delete("/:id", authenticate, authorizeRoles(ROLE.ADMIN), insumosController.remove);
