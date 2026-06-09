import type { PrismaClient } from "@prisma/client";
import {
  pacienteDetailInclude,
  pacienteObraSocialInclude,
  type PacienteDetailRow,
  type PacienteWithObraSocialRow,
} from "../../shared/prisma-includes/paciente.include.js";
import {
  formatPacienteCodigoQr,
  parsePacienteCodigoQrSequence,
} from "../../shared/paciente/codigoQr.js";

export interface CreatePacienteData {
  obraSocialId: number;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  fechaNacimiento: Date;
  sexo: "M" | "F" | "X";
  telefono: string;
  direccion: string;
  localidad: string;
  numeroAfiliado: string;
}

export type UpdatePacienteData = Partial<CreatePacienteData>;

export interface PaginatedPacientes {
  items: PacienteWithObraSocialRow[];
  total: number;
  page: number;
  pageSize: number;
}

export class PacientesRepository {
  constructor(private readonly db: PrismaClient) {}

  async findPaginated(page: number, pageSize: number): Promise<PaginatedPacientes> {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.db.paciente.findMany({
        include: pacienteObraSocialInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.db.paciente.count(),
    ]);
    return { items, total, page, pageSize };
  }

  async findById(id: number): Promise<PacienteDetailRow | null> {
    return this.db.paciente.findUnique({
      where: { id },
      include: pacienteDetailInclude,
    });
  }

  async findByCodigoQr(codigoQr: string): Promise<PacienteDetailRow | null> {
    return this.db.paciente.findUnique({
      where: { codigoQr },
      include: pacienteDetailInclude,
    });
  }

  async obraSocialExists(obraSocialId: number): Promise<boolean> {
    const row = await this.db.obraSocial.findUnique({
      where: { id: obraSocialId },
      select: { id: true, estado: true },
    });
    return row !== null;
  }

  async findObraSocialEstado(obraSocialId: number): Promise<boolean | null> {
    const row = await this.db.obraSocial.findUnique({
      where: { id: obraSocialId },
      select: { estado: true },
    });
    return row?.estado ?? null;
  }

  async update(id: number, data: UpdatePacienteData): Promise<PacienteDetailRow> {
    return this.db.paciente.update({
      where: { id },
      data,
      include: pacienteDetailInclude,
    });
  }

  async countPacienteServicios(pacienteId: number): Promise<number> {
    return this.db.pacienteServicio.count({ where: { pacienteId } });
  }

  async countVisitas(pacienteId: number): Promise<number> {
    return this.db.visita.count({
      where: { pacienteServicio: { pacienteId } },
    });
  }

  async delete(id: number): Promise<void> {
    await this.db.paciente.delete({ where: { id } });
  }

  async createWithCodigoQr(data: CreatePacienteData): Promise<PacienteDetailRow> {
    return this.db.$transaction(async (tx) => {
      const sequence = await this.resolveMaxCodigoQrSequence(tx);

      return tx.paciente.create({
        data: {
          ...data,
          codigoQr: formatPacienteCodigoQr(sequence + 1),
        },
        include: pacienteDetailInclude,
      });
    });
  }

  async createManyWithCodigoQr(items: CreatePacienteData[]): Promise<number> {
    if (items.length === 0) {
      return 0;
    }

    await this.db.$transaction(async (tx) => {
      let sequence = await this.resolveMaxCodigoQrSequence(tx);

      for (const data of items) {
        sequence += 1;
        await tx.paciente.create({
          data: {
            ...data,
            codigoQr: formatPacienteCodigoQr(sequence),
          },
        });
      }
    });

    return items.length;
  }

  private async resolveMaxCodigoQrSequence(db: Pick<PrismaClient, "paciente">): Promise<number> {
    const pacientes = await db.paciente.findMany({
      select: { codigoQr: true },
    });

    let maxSequence = 0;
    for (const paciente of pacientes) {
      const sequence = parsePacienteCodigoQrSequence(paciente.codigoQr);
      if (sequence !== null && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }

    return maxSequence;
  }
}
