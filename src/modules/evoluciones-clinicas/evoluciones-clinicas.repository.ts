import type { EvolucionClinica, Prisma, PrismaClient } from "@prisma/client";
import {
  evolucionClinicaInclude,
  type EvolucionClinicaRow,
} from "../../shared/prisma-includes/evolucion-clinica.include.js";

export interface PaginatedEvolucionesClinicas {
  items: EvolucionClinica[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListEvolucionesClinicasFilters {
  historiaClinicaId?: number | undefined;
}

export interface CreateEvolucionClinicaData {
  historiaClinicaId: number;
  fecha: Date;
  observaciones: string | null;
  medicacion: string | null;
}

export class EvolucionesClinicasRepository {
  constructor(private readonly db: PrismaClient) {}

  private buildWhere(filters: ListEvolucionesClinicasFilters): Prisma.EvolucionClinicaWhereInput {
    const where: Prisma.EvolucionClinicaWhereInput = {};

    if (filters.historiaClinicaId !== undefined) {
      where.historiaClinicaId = filters.historiaClinicaId;
    }

    return where;
  }

  async findPaginated(
    page: number,
    pageSize: number,
    filters: ListEvolucionesClinicasFilters,
  ): Promise<PaginatedEvolucionesClinicas> {
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(filters);

    const [items, total] = await Promise.all([
      this.db.evolucionClinica.findMany({
        where,
        orderBy: { fecha: "desc" },
        skip,
        take: pageSize,
      }),
      this.db.evolucionClinica.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: number): Promise<EvolucionClinicaRow | null> {
    return this.db.evolucionClinica.findUnique({
      where: { id },
      include: evolucionClinicaInclude,
    });
  }

  async findHistoriaClinicaById(id: number): Promise<{ id: number } | null> {
    return this.db.historiaClinica.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  async create(data: CreateEvolucionClinicaData) {
    return this.db.evolucionClinica.create({ data });
  }

  async update(id: number, data: Prisma.EvolucionClinicaUpdateInput) {
    return this.db.evolucionClinica.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.db.evolucionClinica.delete({ where: { id } });
  }
}
