import type { Prisma, PrismaClient } from "@prisma/client";
import {
  pacienteServicioDetailInclude,
  type PacienteServicioDetail,
} from "../../shared/prisma-includes/paciente-servicio.include.js";
import type { PacienteServicioEstado } from "../../shared/constants/paciente-servicio-estado.js";

export interface PaginatedPacienteServicios {
  items: PacienteServicioDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListPacienteServiciosFilters {
  pacienteId?: number | undefined;
  servicioId?: number | undefined;
  estado?: PacienteServicioEstado | undefined;
}

export interface CreatePacienteServicioData {
  pacienteId: number;
  servicioId: number;
  prestadorId: number | null;
  fechaInicio: Date;
  fechaFin: Date | null;
  periodoControl: string;
  cantidadPermitida: number;
  cantidadHoras: number | null;
  modalidadCobro: string;
  estado: PacienteServicioEstado;
}

export interface UpdatePacienteServicioData {
  pacienteId?: number | undefined;
  servicioId?: number | undefined;
  prestadorId?: number | null | undefined;
  fechaInicio?: Date | undefined;
  fechaFin?: Date | null | undefined;
  periodoControl?: string | undefined;
  cantidadPermitida?: number | undefined;
  cantidadHoras?: number | null | undefined;
  modalidadCobro?: string | undefined;
  estado?: PacienteServicioEstado | undefined;
}

export class PacienteServiciosRepository {
  constructor(private readonly db: PrismaClient) {}

  private buildWhere(filters: ListPacienteServiciosFilters): Prisma.PacienteServicioWhereInput {
    const where: Prisma.PacienteServicioWhereInput = {};

    if (filters.pacienteId !== undefined) {
      where.pacienteId = filters.pacienteId;
    }
    if (filters.servicioId !== undefined) {
      where.servicioId = filters.servicioId;
    }
    if (filters.estado !== undefined) {
      where.estado = filters.estado;
    }

    return where;
  }

  async findPaginated(
    page: number,
    pageSize: number,
    filters: ListPacienteServiciosFilters,
  ): Promise<PaginatedPacienteServicios> {
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(filters);

    const [items, total] = await Promise.all([
      this.db.pacienteServicio.findMany({
        where,
        include: pacienteServicioDetailInclude,
        orderBy: { id: "desc" },
        skip,
        take: pageSize,
      }),
      this.db.pacienteServicio.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: number): Promise<PacienteServicioDetail | null> {
    return this.db.pacienteServicio.findUnique({
      where: { id },
      include: pacienteServicioDetailInclude,
    });
  }

  async pacienteExists(pacienteId: number): Promise<boolean> {
    const paciente = await this.db.paciente.findUnique({
      where: { id: pacienteId },
      select: { id: true },
    });
    return paciente !== null;
  }

  async findServicioById(id: number): Promise<{ id: number; estado: boolean } | null> {
    return this.db.servicio.findUnique({
      where: { id },
      select: { id: true, estado: true },
    });
  }

  async findPrestadorById(id: number): Promise<{ id: number; estado: boolean } | null> {
    return this.db.prestador.findUnique({
      where: { id },
      select: { id: true, estado: true },
    });
  }

  async prestadorTieneServicio(prestadorId: number, servicioId: number): Promise<boolean> {
    const link = await this.db.prestadorServicio.findUnique({
      where: {
        prestadorId_servicioId: { prestadorId, servicioId },
      },
      select: { prestadorId: true },
    });
    return link !== null;
  }

  async countVisitas(pacienteServicioId: number): Promise<number> {
    return this.db.visita.count({ where: { pacienteServicioId } });
  }

  async findParaDisponibilidad(
    pacienteServicioId: number,
  ): Promise<{
    id: number;
    periodoControl: string;
    cantidadPermitida: number;
  } | null> {
    return this.db.pacienteServicio.findUnique({
      where: { id: pacienteServicioId },
      select: {
        id: true,
        periodoControl: true,
        cantidadPermitida: true,
      },
    });
  }

  async countVisitasEnVentana(
    pacienteServicioId: number,
    desdeInclusive: Date,
    hastaInclusive: Date,
    excludeVisitaId?: number,
  ): Promise<number> {
    return this.db.visita.count({
      where: {
        pacienteServicioId,
        fechaInicio: { gte: desdeInclusive, lte: hastaInclusive },
        ...(excludeVisitaId !== undefined ? { id: { not: excludeVisitaId } } : {}),
      },
    });
  }

  async create(data: CreatePacienteServicioData): Promise<PacienteServicioDetail> {
    return this.db.pacienteServicio.create({
      data,
      include: pacienteServicioDetailInclude,
    });
  }

  async update(id: number, data: UpdatePacienteServicioData): Promise<PacienteServicioDetail> {
    const updateData: Prisma.PacienteServicioUpdateInput = {};

    if (data.pacienteId !== undefined) {
      updateData.paciente = { connect: { id: data.pacienteId } };
    }
    if (data.servicioId !== undefined) {
      updateData.servicio = { connect: { id: data.servicioId } };
    }
    if (data.prestadorId !== undefined) {
      updateData.prestador =
        data.prestadorId === null
          ? { disconnect: true }
          : { connect: { id: data.prestadorId } };
    }
    if (data.fechaInicio !== undefined) {
      updateData.fechaInicio = data.fechaInicio;
    }
    if (data.fechaFin !== undefined) {
      updateData.fechaFin = data.fechaFin;
    }
    if (data.periodoControl !== undefined) {
      updateData.periodoControl = data.periodoControl;
    }
    if (data.cantidadPermitida !== undefined) {
      updateData.cantidadPermitida = data.cantidadPermitida;
    }
    if (data.cantidadHoras !== undefined) {
      updateData.cantidadHoras = data.cantidadHoras;
    }
    if (data.modalidadCobro !== undefined) {
      updateData.modalidadCobro = data.modalidadCobro;
    }
    if (data.estado !== undefined) {
      updateData.estado = data.estado;
    }

    return this.db.pacienteServicio.update({
      where: { id },
      data: updateData,
      include: pacienteServicioDetailInclude,
    });
  }

  async delete(id: number): Promise<void> {
    await this.db.pacienteServicio.delete({ where: { id } });
  }
}
