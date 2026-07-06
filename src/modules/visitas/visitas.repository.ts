import type { Prisma, PrismaClient } from "@prisma/client";
import {
  visitaDetailInclude,
  type VisitaDetail,
} from "../../shared/prisma-includes/visita.include.js";
import { VISITA_ESTADO, VISITA_ESTADOS_CUENTAN_CUPO } from "../../shared/constants/visita-estado.js";

export interface PaginatedVisitas {
  items: VisitaDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListVisitasFilters {
  prestadorId?: number | undefined;
  pacienteServicioId?: number | undefined;
  fechaDesde?: Date | undefined;
  fechaHasta?: Date | undefined;
}

export interface CreateVisitaFinanzasData {
  modalidadCobro: string;
  tipoJornada: string;
  tipoDia: string;
  valorUnitario: Prisma.Decimal;
  valorAplicado: Prisma.Decimal;
}

export interface CreateVisitaData {
  pacienteServicioId: number;
  prestadorId: number;
  estado: string;
  fechaInicio: Date;
  fechaFin: Date | null;
  tiempoMinutos: number | null;
  observaciones: string | null;
  finanzas?: CreateVisitaFinanzasData | undefined;
}

export interface FinalizarVisitaData {
  fechaFin: Date;
  tiempoMinutos: number;
  observaciones: string | null;
  finanzas: CreateVisitaFinanzasData;
  cierreAutomatico?: boolean;
  cierrePorRelevo?: boolean;
  prestadorRelevoId?: number | null;
}

export interface VisitaIniciadaParaCierre {
  id: number;
  pacienteServicioId: number;
  prestadorId: number;
  fechaInicio: Date;
  observaciones: string | null;
  pacienteServicio: {
    cantidadHoras: number | null;
    servicio: {
      controlHorario: boolean;
      modoRelevo: boolean;
    };
  };
}

export interface TramoActivo {
  id: number;
  pacienteServicioId: number;
  prestadorId: number;
  fechaInicio: Date;
  observaciones: string | null;
}

export interface RelevarTramoData {
  pacienteServicioId: number;
  prestadorId: number;
  fechaRelevo: Date;
  visitaAnteriorId: number;
  tiempoMinutosAnterior: number;
  observacionesAnterior: string | null;
  finanzasAnterior: CreateVisitaFinanzasData;
}

export interface PacienteServicioForVisita {
  id: number;
  estado: string;
  servicioId: number;
  prestadorId: number | null;
  modalidadCobro: string;
  periodoControl: string;
  cantidadPermitida: number;
  cantidadHoras: number | null;
  fechaInicio: Date;
  fechaFin: Date | null;
  coberturaDiariaInicio: string | null;
  coberturaDiariaFin: string | null;
  prestadoresAsignados: Array<{ prestadorId: number }>;
  servicio: {
    controlHorario: boolean;
    modoRelevo: boolean;
  };
}

export class VisitasRepository {
  constructor(private readonly db: PrismaClient) {}

  private buildWhere(filters: ListVisitasFilters): Prisma.VisitaWhereInput {
    const where: Prisma.VisitaWhereInput = {};

    if (filters.prestadorId !== undefined) {
      where.prestadorId = filters.prestadorId;
    }

    if (filters.pacienteServicioId !== undefined) {
      where.pacienteServicioId = filters.pacienteServicioId;
    }

    if (filters.fechaDesde !== undefined || filters.fechaHasta !== undefined) {
      where.fechaInicio = {};
      if (filters.fechaDesde !== undefined) {
        where.fechaInicio.gte = filters.fechaDesde;
      }
      if (filters.fechaHasta !== undefined) {
        where.fechaInicio.lte = filters.fechaHasta;
      }
    }

    return where;
  }

  async findPaginated(
    page: number,
    pageSize: number,
    filters: ListVisitasFilters,
  ): Promise<PaginatedVisitas> {
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(filters);

    const [items, total] = await Promise.all([
      this.db.visita.findMany({
        where,
        include: visitaDetailInclude,
        orderBy: { fechaInicio: "desc" },
        skip,
        take: pageSize,
      }),
      this.db.visita.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: number): Promise<VisitaDetail | null> {
    return this.db.visita.findUnique({
      where: { id },
      include: visitaDetailInclude,
    });
  }

  async findVisitaIniciada(
    pacienteServicioId: number,
    prestadorId: number,
  ): Promise<Pick<VisitaDetail, "id" | "fechaInicio" | "estado"> | null> {
    return this.db.visita.findFirst({
      where: {
        pacienteServicioId,
        prestadorId,
        estado: VISITA_ESTADO.INICIADA,
      },
      select: {
        id: true,
        fechaInicio: true,
        estado: true,
      },
    });
  }

  async findTramoActivo(pacienteServicioId: number): Promise<TramoActivo | null> {
    return this.db.visita.findFirst({
      where: {
        pacienteServicioId,
        estado: VISITA_ESTADO.INICIADA,
      },
      select: {
        id: true,
        pacienteServicioId: true,
        prestadorId: true,
        fechaInicio: true,
        observaciones: true,
      },
    });
  }

  async findTramosActivosByPacienteServicioIds(
    pacienteServicioIds: number[],
  ): Promise<
    Array<{
      id: number;
      pacienteServicioId: number;
      prestadorId: number;
      fechaInicio: Date;
      prestador: { user: { nombre: string } };
    }>
  > {
    if (pacienteServicioIds.length === 0) {
      return [];
    }

    return this.db.visita.findMany({
      where: {
        pacienteServicioId: { in: pacienteServicioIds },
        estado: VISITA_ESTADO.INICIADA,
      },
      select: {
        id: true,
        pacienteServicioId: true,
        prestadorId: true,
        fechaInicio: true,
        prestador: {
          select: {
            user: {
              select: { nombre: true },
            },
          },
        },
      },
    });
  }

  async findVisitasIniciadasByPacienteServicioIds(
    pacienteServicioIds: number[],
    prestadorId: number,
  ): Promise<Array<{ id: number; pacienteServicioId: number; fechaInicio: Date; estado: string }>> {
    if (pacienteServicioIds.length === 0) {
      return [];
    }

    return this.db.visita.findMany({
      where: {
        pacienteServicioId: { in: pacienteServicioIds },
        prestadorId,
        estado: VISITA_ESTADO.INICIADA,
      },
      select: {
        id: true,
        pacienteServicioId: true,
        fechaInicio: true,
        estado: true,
      },
    });
  }

  async findVisitasIniciadasParaCierre(filters: {
    prestadorId?: number;
    pacienteServicioId?: number;
    visitaId?: number;
  }): Promise<VisitaIniciadaParaCierre[]> {
    const where: Prisma.VisitaWhereInput = {
      estado: VISITA_ESTADO.INICIADA,
      pacienteServicio: {
        servicio: {
          modoRelevo: false,
        },
      },
      ...(filters.visitaId !== undefined ? { id: filters.visitaId } : {}),
      ...(filters.prestadorId !== undefined ? { prestadorId: filters.prestadorId } : {}),
      ...(filters.pacienteServicioId !== undefined
        ? { pacienteServicioId: filters.pacienteServicioId }
        : {}),
    };

    return this.db.visita.findMany({
      where,
      select: {
        id: true,
        pacienteServicioId: true,
        prestadorId: true,
        fechaInicio: true,
        observaciones: true,
        pacienteServicio: {
          select: {
            cantidadHoras: true,
            servicio: {
              select: {
                controlHorario: true,
                modoRelevo: true,
              },
            },
          },
        },
      },
    });
  }

  async findPrestadorByUserId(userId: number): Promise<{ id: number; estado: boolean } | null> {
    return this.db.prestador.findUnique({
      where: { userId },
      select: { id: true, estado: true },
    });
  }

  async findPacienteServicioById(id: number): Promise<{ id: number; estado: string } | null> {
    return this.db.pacienteServicio.findUnique({
      where: { id },
      select: { id: true, estado: true },
    });
  }

  async findPacienteServicioForVisita(id: number): Promise<PacienteServicioForVisita | null> {
    return this.db.pacienteServicio.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        servicioId: true,
        prestadorId: true,
        modalidadCobro: true,
        periodoControl: true,
        cantidadPermitida: true,
        cantidadHoras: true,
        fechaInicio: true,
        fechaFin: true,
        coberturaDiariaInicio: true,
        coberturaDiariaFin: true,
        prestadoresAsignados: {
          select: { prestadorId: true },
        },
        servicio: {
          select: {
            controlHorario: true,
            modoRelevo: true,
          },
        },
      },
    });
  }

  async findTarifaForVisita(
    servicioId: number,
    modalidadCobro: string,
    tipoJornada: string,
    tipoDia: string,
  ): Promise<{ valor: Prisma.Decimal } | null> {
    return this.db.servicioTarifa.findFirst({
      where: {
        servicioId,
        modalidadCobro,
        tipoJornada,
        tipoDia,
      },
      select: { valor: true },
    });
  }

  async findPrestadorById(id: number): Promise<{ id: number; estado: boolean } | null> {
    return this.db.prestador.findUnique({
      where: { id },
      select: { id: true, estado: true },
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
        estado: { in: VISITA_ESTADOS_CUENTAN_CUPO },
        fechaInicio: { gte: desdeInclusive, lte: hastaInclusive },
        ...(excludeVisitaId !== undefined ? { id: { not: excludeVisitaId } } : {}),
      },
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

  async create(data: CreateVisitaData): Promise<VisitaDetail> {
    return this.db.$transaction(async (tx) => {
      const visita = await tx.visita.create({
        data: {
          pacienteServicioId: data.pacienteServicioId,
          prestadorId: data.prestadorId,
          estado: data.estado,
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          tiempoMinutos: data.tiempoMinutos,
          observaciones: data.observaciones,
          ...(data.finanzas
            ? {
                finanzas: {
                  create: {
                    modalidadCobro: data.finanzas.modalidadCobro,
                    tipoJornada: data.finanzas.tipoJornada,
                    tipoDia: data.finanzas.tipoDia,
                    valorUnitario: data.finanzas.valorUnitario,
                    valorAplicado: data.finanzas.valorAplicado,
                  },
                },
              }
            : {}),
        },
      });

      const detail = await tx.visita.findUnique({
        where: { id: visita.id },
        include: visitaDetailInclude,
      });

      if (!detail) {
        throw new Error("Visita creada pero no encontrada");
      }

      return detail;
    });
  }

  async finalizar(id: number, data: FinalizarVisitaData): Promise<VisitaDetail> {
    return this.db.$transaction(async (tx) => {
      await tx.visita.update({
        where: { id },
        data: {
          estado: VISITA_ESTADO.FINALIZADA,
          fechaFin: data.fechaFin,
          tiempoMinutos: data.tiempoMinutos,
          cierreAutomatico: data.cierreAutomatico ?? false,
          cierrePorRelevo: data.cierrePorRelevo ?? false,
          ...(data.prestadorRelevoId !== undefined
            ? { prestadorRelevoId: data.prestadorRelevoId }
            : {}),
          ...(data.observaciones !== null ? { observaciones: data.observaciones } : {}),
          finanzas: {
            create: {
              modalidadCobro: data.finanzas.modalidadCobro,
              tipoJornada: data.finanzas.tipoJornada,
              tipoDia: data.finanzas.tipoDia,
              valorUnitario: data.finanzas.valorUnitario,
              valorAplicado: data.finanzas.valorAplicado,
            },
          },
        },
      });

      const detail = await tx.visita.findUnique({
        where: { id },
        include: visitaDetailInclude,
      });

      if (!detail) {
        throw new Error("Visita finalizada pero no encontrada");
      }

      return detail;
    });
  }

  async relevarTramo(data: RelevarTramoData): Promise<{ anterior: VisitaDetail; actual: VisitaDetail }> {
    return this.db.$transaction(async (tx) => {
      await tx.visita.update({
        where: { id: data.visitaAnteriorId },
        data: {
          estado: VISITA_ESTADO.FINALIZADA,
          fechaFin: data.fechaRelevo,
          tiempoMinutos: data.tiempoMinutosAnterior,
          cierrePorRelevo: true,
          prestadorRelevoId: data.prestadorId,
          ...(data.observacionesAnterior !== null
            ? { observaciones: data.observacionesAnterior }
            : {}),
          finanzas: {
            create: {
              modalidadCobro: data.finanzasAnterior.modalidadCobro,
              tipoJornada: data.finanzasAnterior.tipoJornada,
              tipoDia: data.finanzasAnterior.tipoDia,
              valorUnitario: data.finanzasAnterior.valorUnitario,
              valorAplicado: data.finanzasAnterior.valorAplicado,
            },
          },
        },
      });

      const actualRow = await tx.visita.create({
        data: {
          pacienteServicioId: data.pacienteServicioId,
          prestadorId: data.prestadorId,
          estado: VISITA_ESTADO.INICIADA,
          fechaInicio: data.fechaRelevo,
          fechaFin: null,
          tiempoMinutos: null,
          observaciones: null,
        },
      });

      const [anterior, actual] = await Promise.all([
        tx.visita.findUnique({
          where: { id: data.visitaAnteriorId },
          include: visitaDetailInclude,
        }),
        tx.visita.findUnique({
          where: { id: actualRow.id },
          include: visitaDetailInclude,
        }),
      ]);

      if (!anterior || !actual) {
        throw new Error("Relevo realizado pero no se pudieron cargar las visitas");
      }

      return { anterior, actual };
    });
  }

  async cancelar(id: number, observaciones?: string | null): Promise<VisitaDetail> {
    return this.db.visita.update({
      where: { id },
      data: {
        estado: VISITA_ESTADO.CANCELADA,
        ...(observaciones !== undefined && observaciones !== null
          ? { observaciones }
          : {}),
      },
      include: visitaDetailInclude,
    });
  }

  async update(id: number, data: Prisma.VisitaUpdateInput): Promise<VisitaDetail> {
    return this.db.visita.update({
      where: { id },
      data,
      include: visitaDetailInclude,
    });
  }

  async delete(id: number): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const consumos = await tx.visitaInsumo.findMany({
        where: { visitaId: id },
        select: { insumoId: true, cantidad: true },
      });

      for (const consumo of consumos) {
        await tx.insumo.update({
          where: { id: consumo.insumoId },
          data: { stockActual: { increment: consumo.cantidad } },
        });
      }

      await tx.visita.delete({ where: { id } });
    });
  }

  async updateFinanzas(
    visitaId: number,
    data: Prisma.VisitaFinanzasUpdateInput,
  ): Promise<VisitaDetail> {
    await this.db.visitaFinanzas.update({
      where: { visitaId },
      data,
    });

    const detail = await this.findById(visitaId);
    if (!detail) {
      throw new Error("Visita no encontrada tras actualizar finanzas");
    }

    return detail;
  }

  async bulkUpdateFinanzas(
    visitaIds: number[],
    buildUpdate: (finanzas: NonNullable<VisitaDetail["finanzas"]>) => Prisma.VisitaFinanzasUpdateInput,
  ): Promise<number> {
    const uniqueIds = [...new Set(visitaIds)];

    return this.db.$transaction(async (tx) => {
      const visitas = await tx.visita.findMany({
        where: { id: { in: uniqueIds } },
        include: { finanzas: true },
      });

      const foundIds = new Set(visitas.map((v) => v.id));
      const missing = uniqueIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new Error(`MISSING:${missing.join(",")}`);
      }

      const sinFinanzas = visitas.filter((v) => v.finanzas === null).map((v) => v.id);
      if (sinFinanzas.length > 0) {
        throw new Error(`NO_FINANZAS:${sinFinanzas.join(",")}`);
      }

      for (const visita of visitas) {
        const finanzas = visita.finanzas;
        if (!finanzas) {
          continue;
        }
        await tx.visitaFinanzas.update({
          where: { visitaId: visita.id },
          data: buildUpdate(finanzas),
        });
      }

      return visitas.length;
    });
  }
}
