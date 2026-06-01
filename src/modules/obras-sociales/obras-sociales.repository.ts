import type { ObraSocial, Prisma, PrismaClient } from "@prisma/client";

export interface PaginatedObrasSociales {
  items: ObraSocial[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListObrasSocialesFilters {
  search?: string | undefined;
  estado?: boolean | undefined;
}

export class ObrasSocialesRepository {
  constructor(private readonly db: PrismaClient) {}

  private buildWhere(filters: ListObrasSocialesFilters): Prisma.ObraSocialWhereInput {
    const where: Prisma.ObraSocialWhereInput = {};
    if (filters.search !== undefined) {
      where.OR = [
        { nombre: { contains: filters.search } },
        { codigo: { contains: filters.search } },
      ];
    }
    if (filters.estado !== undefined) {
      where.estado = filters.estado;
    }
    return where;
  }

  async findPaginated(
    page: number,
    pageSize: number,
    filters: ListObrasSocialesFilters,
  ): Promise<PaginatedObrasSociales> {
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(filters);
    const [items, total] = await Promise.all([
      this.db.obraSocial.findMany({ where, orderBy: { nombre: "asc" }, skip, take: pageSize }),
      this.db.obraSocial.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findById(id: number): Promise<ObraSocial | null> {
    return this.db.obraSocial.findUnique({ where: { id } });
  }

  async findByCodigo(codigo: string): Promise<ObraSocial | null> {
    return this.db.obraSocial.findFirst({ where: { codigo } });
  }

  async countPacientes(obraSocialId: number): Promise<number> {
    return this.db.paciente.count({ where: { obraSocialId } });
  }

  async create(data: Prisma.ObraSocialCreateInput): Promise<ObraSocial> {
    return this.db.obraSocial.create({ data });
  }

  async update(id: number, data: Prisma.ObraSocialUpdateInput): Promise<ObraSocial> {
    return this.db.obraSocial.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.db.obraSocial.delete({ where: { id } });
  }
}
