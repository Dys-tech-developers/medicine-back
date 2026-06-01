import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { authorizeRoles } from "../../core/middlewares/authorizeRoles.js";
import { ROLE } from "../../shared/constants/roles.js";
import { UserRepository } from "./users.repository.js";
import { UserService } from "./users.service.js";
import { UserController } from "./users.controller.js";

const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

export const usersRouter = Router();

usersRouter.get(
  "/",
  authenticate,
  authorizeRoles(ROLE.ADMIN, ROLE.OPERADOR),
  userController.list,
);

usersRouter.get("/:id", authenticate, userController.getById);

usersRouter.patch(
  "/:id/estado",
  authenticate,
  authorizeRoles(ROLE.ADMIN),
  userController.updateEstado,
);
