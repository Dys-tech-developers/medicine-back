import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { authenticateCron } from "../../core/middlewares/authenticateCron.js";
import { VisitasRepository } from "../visitas/visitas.repository.js";
import { VisitasService } from "../visitas/visitas.service.js";
import { CronController } from "./cron.controller.js";

const visitasRepository = new VisitasRepository(prisma);
const visitasService = new VisitasService(visitasRepository);
const cronController = new CronController(visitasService);

export const cronRouter = Router();

cronRouter.post(
  "/cerrar-visitas-vencidas",
  authenticateCron,
  cronController.cerrarVisitasVencidas,
);
