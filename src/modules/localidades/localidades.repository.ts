import type { Localidad, PrismaClient } from "@prisma/client";

export class LocalidadesRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAllOrderedByNombre(): Promise<Localidad[]> {
    return this.db.localidad.findMany({
      orderBy: { nombre: "asc" },
    });
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    const row = await this.db.localidad.findUnique({
      where: { nombre },
      select: { id: true },
    });
    return row !== null;
  }
}
