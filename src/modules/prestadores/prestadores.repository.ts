import type { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../../core/errors/AppError.js";
import { ROLE } from "../../shared/constants/roles.js";
import {
  prestadorWithUserInclude,
  type PrestadorWithUser,
} from "../../shared/prisma-includes/prestador.include.js";

export interface PaginatedPrestadores {
  items: PrestadorWithUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListPrestadoresFilters {
  servicioId?: number | undefined;
  estado?: boolean | undefined;
}

export interface CreatePrestadorData {
  nombre: string;
  email: string;
  passwordHash: string;
  telefono: string;
  lugarResidencia: string;
  documento: string;
  matricula: string;
  cuit: string;
  cbu: string;
  regimenIva: string;
  estado: boolean;
  servicioIds: number[];
}

export class PrestadoresRepository {
  constructor(private readonly db: PrismaClient) {}

  private buildWhere(filters: ListPrestadoresFilters): Prisma.PrestadorWhereInput {
    const where: Prisma.PrestadorWhereInput = {};

    if (filters.estado !== undefined) {
      where.estado = filters.estado;
    }

    if (filters.servicioId !== undefined) {
      where.servicios = {
        some: { servicioId: filters.servicioId },
      };
    }

    return where;
  }

  async findPaginated(
    page: number,
    pageSize: number,
    filters: ListPrestadoresFilters = {},
  ): Promise<PaginatedPrestadores> {
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(filters);

    const [items, total] = await Promise.all([
      this.db.prestador.findMany({
        where,
        include: prestadorWithUserInclude,
        orderBy: { id: "asc" },
        skip,
        take: pageSize,
      }),
      this.db.prestador.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: number): Promise<PrestadorWithUser | null> {
    return this.db.prestador.findUnique({
      where: { id },
      include: prestadorWithUserInclude,
    });
  }

  async findByUserId(userId: number): Promise<PrestadorWithUser | null> {
    return this.db.prestador.findUnique({
      where: { userId },
      include: prestadorWithUserInclude,
    });
  }

  async findByUserEmail(email: string): Promise<PrestadorWithUser | null> {
    return this.db.prestador.findFirst({
      where: { user: { email: email.toLowerCase() } },
      include: prestadorWithUserInclude,
    });
  }

  async findServiciosByIds(ids: number[]): Promise<Array<{ id: number; nombre: string; estado: boolean }>> {
    if (ids.length === 0) {
      return [];
    }

    return this.db.servicio.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true, estado: true },
    });
  }

  async syncServicios(prestadorId: number, servicioIds: number[]): Promise<PrestadorWithUser> {
    const uniqueIds = [...new Set(servicioIds)];

    await this.db.$transaction(async (tx) => {
      await tx.prestadorServicio.deleteMany({
        where: {
          prestadorId,
          ...(uniqueIds.length > 0 ? { servicioId: { notIn: uniqueIds } } : {}),
        },
      });

      for (const servicioId of uniqueIds) {
        await tx.prestadorServicio.upsert({
          where: {
            prestadorId_servicioId: { prestadorId, servicioId },
          },
          update: {},
          create: { prestadorId, servicioId },
        });
      }
    });

    const prestador = await this.findById(prestadorId);
    if (!prestador) {
      throw AppError.notFound("Prestador no encontrado");
    }

    return prestador;
  }

  async createWithUser(data: CreatePrestadorData): Promise<PrestadorWithUser> {
    return this.db.$transaction(async (tx) => {
      const role = await tx.role.findFirst({
        where: { nombre: ROLE.PRESTADOR },
      });

      if (!role) {
        throw AppError.internal(
          `Rol ${ROLE.PRESTADOR} no encontrado. Ejecutá el seed de roles antes de crear prestadores.`,
        );
      }

      const user = await tx.user.create({
        data: {
          nombre: data.nombre,
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          roles: {
            create: { rolId: role.id },
          },
        },
      });

      const prestador = await tx.prestador.create({
        data: {
          userId: user.id,
          telefono: data.telefono,
          lugarResidencia: data.lugarResidencia,
          documento: data.documento,
          matricula: data.matricula,
          cuit: data.cuit,
          cbu: data.cbu,
          regimenIva: data.regimenIva,
          estado: data.estado,
        },
      });

      const uniqueServicioIds = [...new Set(data.servicioIds)];
      for (const servicioId of uniqueServicioIds) {
        await tx.prestadorServicio.create({
          data: { prestadorId: prestador.id, servicioId },
        });
      }

      const detail = await tx.prestador.findUnique({
        where: { id: prestador.id },
        include: prestadorWithUserInclude,
      });

      if (!detail) {
        throw AppError.internal("Prestador creado pero no encontrado");
      }

      return detail;
    });
  }
}
