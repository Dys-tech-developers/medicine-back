import type { PrismaClient } from "@prisma/client";
import { AppError } from "../../core/errors/AppError.js";
import {
  visitaInsumoWithInsumoInclude,
  type VisitaInsumoWithInsumo,
} from "../../shared/prisma-includes/visita-insumo.include.js";
import type { ConsumoItem } from "./visita-insumos.validation.js";

export class VisitaInsumosRepository {
  constructor(private readonly db: PrismaClient) {}

  async findVisitaById(visitaId: number): Promise<{ id: number } | null> {
    return this.db.visita.findUnique({
      where: { id: visitaId },
      select: { id: true },
    });
  }

  async findByVisitaId(visitaId: number): Promise<VisitaInsumoWithInsumo[]> {
    return this.db.visitaInsumo.findMany({
      where: { visitaId },
      include: visitaInsumoWithInsumoInclude,
      orderBy: { id: "asc" },
    });
  }

  async registerConsumos(visitaId: number, items: ConsumoItem[]): Promise<VisitaInsumoWithInsumo[]> {
    return this.db.$transaction(async (tx) => {
      const created: VisitaInsumoWithInsumo[] = [];

      for (const item of items) {
        const insumo = await tx.insumo.findUnique({ where: { id: item.insumoId } });

        if (!insumo) {
          throw AppError.notFound(`Insumo ${item.insumoId} no encontrado`);
        }

        if (!insumo.estado) {
          throw AppError.conflict(`El insumo "${insumo.nombre}" está inactivo`);
        }

        if (insumo.stockActual < item.cantidad) {
          throw AppError.conflict(
            `Stock insuficiente para "${insumo.nombre}" (disponible: ${insumo.stockActual}, solicitado: ${item.cantidad})`,
          );
        }

        if (insumo.requiereVencimiento && insumo.fechaVencimiento) {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          if (insumo.fechaVencimiento < hoy) {
            throw AppError.conflict(`El insumo "${insumo.nombre}" está vencido`);
          }
        }

        const visitaInsumo = await tx.visitaInsumo.create({
          data: {
            visitaId,
            insumoId: item.insumoId,
            cantidad: item.cantidad,
          },
          include: visitaInsumoWithInsumoInclude,
        });

        await tx.insumo.update({
          where: { id: item.insumoId },
          data: { stockActual: { decrement: item.cantidad } },
        });

        const insumoActualizado = await tx.insumo.findUniqueOrThrow({
          where: { id: item.insumoId },
        });

        created.push({
          ...visitaInsumo,
          insumo: insumoActualizado,
        });
      }

      return created;
    });
  }
}
