import type { Prisma, PrismaClient, ServicioTarifa } from "@prisma/client";

export class ServicioTarifasRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByServicioId(servicioId: number): Promise<ServicioTarifa[]> {
    return this.db.servicioTarifa.findMany({
      where: { servicioId },
      orderBy: [{ tipoJornada: "asc" }, { tipoDia: "asc" }],
    });
  }

  async findById(id: number): Promise<ServicioTarifa | null> {
    return this.db.servicioTarifa.findUnique({ where: { id } });
  }

  async servicioExists(servicioId: number): Promise<boolean> {
    const servicio = await this.db.servicio.findUnique({
      where: { id: servicioId },
      select: { id: true },
    });
    return servicio !== null;
  }

  async create(data: Prisma.ServicioTarifaCreateInput): Promise<ServicioTarifa> {
    return this.db.servicioTarifa.create({ data });
  }

  async update(id: number, data: Prisma.ServicioTarifaUpdateInput): Promise<ServicioTarifa> {
    return this.db.servicioTarifa.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.db.servicioTarifa.delete({ where: { id } });
  }
}
