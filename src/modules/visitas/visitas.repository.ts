import type { Prisma, PrismaClient } from "@prisma/client";
import {
  visitaDetailInclude,
  type VisitaDetail,
} from "../../shared/prisma-includes/visita.include.js";

export interface PaginatedVisitas {
  items: VisitaDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListVisitasFilters {
  prestadorId?: number | undefined;
  pacienteServicioId?: number | undefined;
  fechaDesde?: Date | undefined;
  fechaHasta?: Date | undefined;
}

export interface CreateVisitaFinanzasData {
  modalidadCobro: string;
  tipoJornada: string;
  tipoDia: string;
  valorUnitario: Prisma.Decimal;
  valorAplicado: Prisma.Decimal;
}

export interface CreateVisitaData {
  pacienteServicioId: number;
  prestadorId: number;
  fechaInicio: Date;
  fechaFin: Date;
  tiempoMinutos: number;
  observaciones: string | null;
  finanzas: CreateVisitaFinanzasData;
}

export interface PacienteServicioForVisita {
  id: number;
  estado: string;
  servicioId: number;
  modalidadCobro: string;
}

export class VisitasRepository {
  constructor(private readonly db: PrismaClient) {}

  private buildWhere(filters: ListVisitasFilters): Prisma.VisitaWhereInput {
    const where: Prisma.VisitaWhereInput = {};

    if (filters.prestadorId !== undefined) {
      where.prestadorId = filters.prestadorId;
    }

    if (filters.pacienteServicioId !== undefined) {
      where.pacienteServicioId = filters.pacienteServicioId;
    }

    if (filters.fechaDesde !== undefined || filters.fechaHasta !== undefined) {
      where.fechaInicio = {};
      if (filters.fechaDesde !== undefined) {
        where.fechaInicio.gte = filters.fechaDesde;
      }
      if (filters.fechaHasta !== undefined) {
        where.fechaInicio.lte = filters.fechaHasta;
      }
    }

    return where;
  }

  async findPaginated(
    page: number,
    pageSize: number,
    filters: ListVisitasFilters,
  ): Promise<PaginatedVisitas> {
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(filters);

    const [items, total] = await Promise.all([
      this.db.visita.findMany({
        where,
        include: visitaDetailInclude,
        orderBy: { fechaInicio: "desc" },
        skip,
        take: pageSize,
      }),
      this.db.visita.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: number): Promise<VisitaDetail | null> {
    return this.db.visita.findUnique({
      where: { id },
      include: visitaDetailInclude,
    });
  }

  async findPrestadorByUserId(userId: number): Promise<{ id: number; estado: boolean } | null> {
    return this.db.prestador.findUnique({
      where: { userId },
      select: { id: true, estado: true },
    });
  }

  async findPacienteServicioById(id: number): Promise<{ id: number; estado: string } | null> {
    return this.db.pacienteServicio.findUnique({
      where: { id },
      select: { id: true, estado: true },
    });
  }

  async findPacienteServicioForVisita(id: number): Promise<PacienteServicioForVisita | null> {
    return this.db.pacienteServicio.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        servicioId: true,
        modalidadCobro: true,
      },
    });
  }

  async findTarifaForVisita(
    servicioId: number,
    modalidadCobro: string,
    tipoJornada: string,
    tipoDia: string,
  ): Promise<{ valor: Prisma.Decimal } | null> {
    return this.db.servicioTarifa.findFirst({
      where: {
        servicioId,
        modalidadCobro,
        tipoJornada,
        tipoDia,
      },
      select: { valor: true },
    });
  }

  async findPrestadorById(id: number): Promise<{ id: number; estado: boolean } | null> {
    return this.db.prestador.findUnique({
      where: { id },
      select: { id: true, estado: true },
    });
  }

  async create(data: CreateVisitaData): Promise<VisitaDetail> {
    return this.db.$transaction(async (tx) => {
      const visita = await tx.visita.create({
        data: {
          pacienteServicioId: data.pacienteServicioId,
          prestadorId: data.prestadorId,
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          tiempoMinutos: data.tiempoMinutos,
          observaciones: data.observaciones,
          finanzas: {
            create: {
              modalidadCobro: data.finanzas.modalidadCobro,
              tipoJornada: data.finanzas.tipoJornada,
              tipoDia: data.finanzas.tipoDia,
              valorUnitario: data.finanzas.valorUnitario,
              valorAplicado: data.finanzas.valorAplicado,
            },
          },
        },
      });

      const detail = await tx.visita.findUnique({
        where: { id: visita.id },
        include: visitaDetailInclude,
      });

      if (!detail) {
        throw new Error("Visita creada pero no encontrada");
      }

      return detail;
    });
  }

  async update(id: number, data: Prisma.VisitaUpdateInput): Promise<VisitaDetail> {
    return this.db.visita.update({
      where: { id },
      data,
      include: visitaDetailInclude,
    });
  }

  async delete(id: number): Promise<void> {
    await this.db.visita.delete({ where: { id } });
  }

  async updateFinanzas(
    visitaId: number,
    data: Prisma.VisitaFinanzasUpdateInput,
  ): Promise<VisitaDetail> {
    await this.db.visitaFinanzas.update({
      where: { visitaId },
      data,
    });

    const detail = await this.findById(visitaId);
    if (!detail) {
      throw new Error("Visita no encontrada tras actualizar finanzas");
    }

    return detail;
  }

  async bulkUpdateFinanzas(
    visitaIds: number[],
    buildUpdate: (finanzas: NonNullable<VisitaDetail["finanzas"]>) => Prisma.VisitaFinanzasUpdateInput,
  ): Promise<number> {
    const uniqueIds = [...new Set(visitaIds)];

    return this.db.$transaction(async (tx) => {
      const visitas = await tx.visita.findMany({
        where: { id: { in: uniqueIds } },
        include: { finanzas: true },
      });

      const foundIds = new Set(visitas.map((v) => v.id));
      const missing = uniqueIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new Error(`MISSING:${missing.join(",")}`);
      }

      const sinFinanzas = visitas.filter((v) => v.finanzas === null).map((v) => v.id);
      if (sinFinanzas.length > 0) {
        throw new Error(`NO_FINANZAS:${sinFinanzas.join(",")}`);
      }

      for (const visita of visitas) {
        const finanzas = visita.finanzas;
        if (!finanzas) {
          continue;
        }
        await tx.visitaFinanzas.update({
          where: { visitaId: visita.id },
          data: buildUpdate(finanzas),
        });
      }

      return visitas.length;
    });
  }
}
