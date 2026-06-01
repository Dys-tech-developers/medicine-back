import type { Prisma, PrismaClient } from "@prisma/client";
import {
  historiaClinicaDetailInclude,
  historiaClinicaWithPacienteInclude,
  type HistoriaClinicaDetail,
  type HistoriaClinicaWithPaciente,
} from "../../shared/prisma-includes/historia-clinica.include.js";

export interface PaginatedHistoriasClinicas {
  items: HistoriaClinicaWithPaciente[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateHistoriaClinicaData {
  pacienteId: number;
  fechaCreacion: Date;
  antecedentes: string | null;
  diagnosticoInicial: string | null;
  medicacion: string | null;
  alergias: string | null;
  observaciones: string | null;
}

export class HistoriasClinicasRepository {
  constructor(private readonly db: PrismaClient) {}

  async findPaginated(
    page: number,
    pageSize: number,
    pacienteId?: number,
  ): Promise<PaginatedHistoriasClinicas> {
    const skip = (page - 1) * pageSize;
    const where: Prisma.HistoriaClinicaWhereInput =
      pacienteId !== undefined ? { pacienteId } : {};

    const [items, total] = await Promise.all([
      this.db.historiaClinica.findMany({
        where,
        include: historiaClinicaWithPacienteInclude,
        orderBy: { id: "desc" },
        skip,
        take: pageSize,
      }),
      this.db.historiaClinica.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: number): Promise<HistoriaClinicaDetail | null> {
    return this.db.historiaClinica.findUnique({
      where: { id },
      include: historiaClinicaDetailInclude,
    });
  }

  async findByPacienteId(pacienteId: number): Promise<HistoriaClinicaDetail | null> {
    return this.db.historiaClinica.findUnique({
      where: { pacienteId },
      include: historiaClinicaDetailInclude,
    });
  }

  async pacienteExists(pacienteId: number): Promise<boolean> {
    const paciente = await this.db.paciente.findUnique({
      where: { id: pacienteId },
      select: { id: true },
    });
    return paciente !== null;
  }

  async create(data: CreateHistoriaClinicaData): Promise<HistoriaClinicaWithPaciente> {
    return this.db.historiaClinica.create({
      data,
      include: historiaClinicaWithPacienteInclude,
    });
  }

  async update(id: number, data: Prisma.HistoriaClinicaUpdateInput): Promise<HistoriaClinicaWithPaciente> {
    return this.db.historiaClinica.update({
      where: { id },
      data,
      include: historiaClinicaWithPacienteInclude,
    });
  }

  async delete(id: number): Promise<void> {
    await this.db.historiaClinica.delete({ where: { id } });
  }
}
