import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../../shared/prisma.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { AuthRepository } from "./auth.repository.js";
import { UserRepository } from "../users/users.repository.js";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

const authRepository = new AuthRepository(prisma);
const userRepository = new UserRepository(prisma);
const authService = new AuthService(authRepository, userRepository);
const authController = new AuthController(authService);

export const authRouter = Router();

authRouter.post("/register", authLimiter, authController.register);
authRouter.post("/login", authLimiter, authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authenticate, authController.me);
authRouter.patch("/me", authenticate, authController.updateMe);
authRouter.post("/change-password", authLimiter, authenticate, authController.changePassword);
