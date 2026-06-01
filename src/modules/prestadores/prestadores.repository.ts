import type { PrismaClient } from "@prisma/client";
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
}

export class PrestadoresRepository {
  constructor(private readonly db: PrismaClient) {}

  async findPaginated(page: number, pageSize: number): Promise<PaginatedPrestadores> {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.db.prestador.findMany({
        include: prestadorWithUserInclude,
        orderBy: { id: "asc" },
        skip,
        take: pageSize,
      }),
      this.db.prestador.count(),
    ]);

    return { items, total, page, pageSize };
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

      return tx.prestador.create({
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
        include: prestadorWithUserInclude,
      });
    });
  }
}
