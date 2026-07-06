import type { Insumo, Prisma, PrismaClient } from "@prisma/client";

export interface PaginatedInsumos {
  items: Insumo[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListInsumosFilters {
  estado?: boolean | undefined;
  bajoStock?: boolean | undefined;
}

export interface CreateInsumoData {
  nombre: string;
  descripcion: string | null;
  codigo: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  requiereVencimiento: boolean;
  fechaVencimiento: Date | null;
  estado: boolean;
}

export class InsumosRepository {
  constructor(private readonly db: PrismaClient) {}

  private buildWhere(filters: ListInsumosFilters): Prisma.InsumoWhereInput {
    const where: Prisma.InsumoWhereInput = {};

    if (filters.estado !== undefined) {
      where.estado = filters.estado;
    }

    return where;
  }

  async findPaginated(
    page: number,
    pageSize: number,
    filters: ListInsumosFilters,
  ): Promise<PaginatedInsumos> {
    const skip = (page - 1) * pageSize;

    if (filters.bajoStock === true) {
      const candidates = await this.db.insumo.findMany({
        where: this.buildWhere(filters),
        orderBy: { id: "asc" },
      });
      const filtered = candidates.filter((i) => i.stockActual <= i.stockMinimo);
      return {
        items: filtered.slice(skip, skip + pageSize),
        total: filtered.length,
        page,
        pageSize,
      };
    }

    const where = this.buildWhere(filters);

    const [items, total] = await Promise.all([
      this.db.insumo.findMany({
        where,
        orderBy: { id: "asc" },
        skip,
        take: pageSize,
      }),
      this.db.insumo.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: number): Promise<Insumo | null> {
    return this.db.insumo.findUnique({ where: { id } });
  }

  async findByCodigo(codigo: string): Promise<Insumo | null> {
    return this.db.insumo.findUnique({ where: { codigo } });
  }

  async create(data: CreateInsumoData): Promise<Insumo> {
    return this.db.insumo.create({ data });
  }

  async update(id: number, data: Prisma.InsumoUpdateInput): Promise<Insumo> {
    return this.db.insumo.update({ where: { id }, data });
  }

  async findManyByIds(ids: number[]): Promise<Insumo[]> {
    return this.db.insumo.findMany({
      where: { id: { in: ids } },
      orderBy: { id: "asc" },
    });
  }

  async countConsumosEnVisitas(insumoIds: number[]): Promise<number> {
    return this.db.visitaInsumo.count({
      where: { insumoId: { in: insumoIds } },
    });
  }

  async delete(id: number): Promise<Insumo> {
    return this.db.insumo.delete({ where: { id } });
  }

  async deleteMany(ids: number[]): Promise<number> {
    const result = await this.db.insumo.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }
}
