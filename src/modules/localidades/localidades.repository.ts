import type { Localidad, PrismaClient } from "@prisma/client";

export class LocalidadesRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAllOrderedByNombre(): Promise<Localidad[]> {
    return this.db.localidad.findMany({
      orderBy: { nombre: "asc" },
    });
  }
}
