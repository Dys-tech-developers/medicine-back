import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { ObrasSocialesRepository } from "./obras-sociales.repository.js";
import { ObrasSocialesService } from "./obras-sociales.service.js";
import { ObrasSocialesController } from "./obras-sociales.controller.js";

const repository = new ObrasSocialesRepository(prisma);
const service = new ObrasSocialesService(repository);
const controller = new ObrasSocialesController(service);

export const obrasSocialesRouter = Router();

obrasSocialesRouter.get(
  "/",
  authenticate,
  authorizeRoles(ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR),
  controller.list,
);

obrasSocialesRouter.get(
  "/:id",
  authenticate,
  authorizeRoles(ROLE.ADMIN, ROLE.OPERADOR, ROLE.PRESTADOR),
  controller.getById,
);

obrasSocialesRouter.post("/", authenticate, authorizeRoles(ROLE.ADMIN), controller.create);
obrasSocialesRouter.patch("/:id", authenticate, authorizeRoles(ROLE.ADMIN), controller.update);
obrasSocialesRouter.delete("/:id", authenticate, authorizeRoles(ROLE.ADMIN), controller.remove);
