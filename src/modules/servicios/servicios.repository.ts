import type { Prisma, PrismaClient, Servicio, ServicioTarifa } from "@prisma/client";
import {
  servicioWithTarifasInclude,
  type ServicioWithTarifasRow,
} from "../../shared/prisma-includes/servicio.include.js";

export interface CreateServicioTarifaData {
  modalidadCobro: string;
  tipoJornada: string;
  tipoDia: string;
  valor: number;
}

export interface CreateServicioWithTarifasData {
  nombre: string;
  estado: boolean;
  descripcion: string | null;
  tarifas: CreateServicioTarifaData[];
}

export interface ServicioWithTarifas {
  servicio: Servicio;
  tarifas: ServicioTarifa[];
}

export interface PaginatedServicios {
  items: ServicioWithTarifasRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListServiciosFilters {
  search?: string | undefined;
  estado?: boolean | undefined;
}

export class ServiciosRepository {
  constructor(private readonly db: PrismaClient) {}

  private buildWhere(filters: ListServiciosFilters): Prisma.ServicioWhereInput {
    const where: Prisma.ServicioWhereInput = {};

    if (filters.search !== undefined) {
      where.nombre = { contains: filters.search };
    }

    if (filters.estado !== undefined) {
      where.estado = filters.estado;
    }

    return where;
  }

  async findPaginated(
    page: number,
    pageSize: number,
    filters: ListServiciosFilters,
  ): Promise<PaginatedServicios> {
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(filters);

    const [items, total] = await Promise.all([
      this.db.servicio.findMany({
        where,
        include: servicioWithTarifasInclude,
        orderBy: { nombre: "asc" },
        skip,
        take: pageSize,
      }),
      this.db.servicio.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: number): Promise<ServicioWithTarifasRow | null> {
    return this.db.servicio.findUnique({
      where: { id },
      include: servicioWithTarifasInclude,
    });
  }

  async findByNombre(nombre: string): Promise<Servicio | null> {
    return this.db.servicio.findFirst({
      where: { nombre: { equals: nombre } },
    });
  }

  async countPacienteServicioUsage(servicioId: number): Promise<number> {
    return this.db.pacienteServicio.count({ where: { servicioId } });
  }

  async createWithTarifas(data: CreateServicioWithTarifasData): Promise<ServicioWithTarifas> {
    return this.db.$transaction(async (tx) => {
      const servicio = await tx.servicio.create({
        data: {
          nombre: data.nombre,
          estado: data.estado,
          descripcion: data.descripcion,
        },
      });

      const tarifas = await Promise.all(
        data.tarifas.map((tarifa) =>
          tx.servicioTarifa.create({
            data: {
              servicioId: servicio.id,
              modalidadCobro: tarifa.modalidadCobro,
              tipoJornada: tarifa.tipoJornada,
              tipoDia: tarifa.tipoDia,
              valor: tarifa.valor,
            },
          }),
        ),
      );

      return { servicio, tarifas };
    });
  }

  async updateEstado(id: number, estado: boolean): Promise<Servicio> {
    return this.db.servicio.update({ where: { id }, data: { estado } });
  }

  async update(id: number, data: Prisma.ServicioUpdateInput): Promise<Servicio> {
    return this.db.servicio.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.db.servicio.delete({ where: { id } });
  }
}
