import { AppError } from "../../core/errors/AppError.js";
import { ROLE } from "../../shared/constants/roles.js";
import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import { buildFinanzasPatch } from "../../shared/visita/buildFinanzasPatch.js";
import {
  calcularValorAplicado,
  resolveFechaFin,
  resolveTipoDia,
  resolveTipoJornada,
} from "../../shared/visita/visitaTarifa.js";
import type { VisitasRepository } from "./visitas.repository.js";
import type {
  BulkUpdateVisitaFinanzasInput,
  CreateVisitaInput,
  ListVisitasQuery,
  UpdateVisitaFinanzasInput,
  UpdateVisitaInput,
} from "./visitas.validation.js";
import type {
  BulkUpdateVisitaFinanzasResultDto,
  PaginatedVisitasDto,
  VisitaDto,
} from "./visitas.dto.js";
import { mapPaginatedVisitas, mapVisitaToDto } from "./visitas.mapper.js";

export interface AuthContext {
  userId: number;
  roles: string[];
}

export class VisitasService {
  constructor(private readonly visitasRepository: VisitasRepository) {}

  async list(auth: AuthContext, query: ListVisitasQuery): Promise<PaginatedVisitasDto> {
    const filters = await this.buildListFilters(auth, query);
    const result = await this.visitasRepository.findPaginated(
      query.page,
      query.pageSize,
      filters,
    );
    return mapPaginatedVisitas(result);
  }

  async getById(auth: AuthContext, id: number): Promise<VisitaDto> {
    const visita = await this.visitasRepository.findById(id);
    if (!visita) {
      throw AppError.notFound("Visita no encontrada");
    }

    await this.ensureCanAccessVisita(auth, visita.prestadorId);
    return mapVisitaToDto(visita);
  }

  async create(auth: AuthContext, input: CreateVisitaInput): Promise<VisitaDto> {
    const prestadorId = await this.resolvePrestadorIdForCreate(auth, input.prestadorId);
    const pacienteServicio = await this.getPacienteServicioForCreate(input.pacienteServicioId);
    await this.validatePrestador(prestadorId);

    const fechaFin = resolveFechaFin(input.fechaInicio, input.tiempoMinutos, input.fechaFin);
    const finanzas = await this.buildFinanzasForCreate(
      pacienteServicio,
      input.fechaInicio,
      input.tiempoMinutos,
    );

    const visita = await this.visitasRepository.create({
      pacienteServicioId: input.pacienteServicioId,
      prestadorId,
      fechaInicio: input.fechaInicio,
      fechaFin,
      tiempoMinutos: input.tiempoMinutos,
      observaciones: input.observaciones ?? null,
      finanzas,
    });

    return mapVisitaToDto(visita);
  }

  async update(auth: AuthContext, id: number, input: UpdateVisitaInput): Promise<VisitaDto> {
    const existing = await this.visitasRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Visita no encontrada");
    }

    await this.ensureCanAccessVisita(auth, existing.prestadorId);

    const isAdmin = auth.roles.includes(ROLE.ADMIN);
    const isPrestadorOnly =
      auth.roles.includes(ROLE.PRESTADOR) && !isAdmin && !auth.roles.includes(ROLE.OPERADOR);

    if (isPrestadorOnly) {
      if (input.pacienteServicioId !== undefined || input.prestadorId !== undefined) {
        throw AppError.forbidden("No podés cambiar el servicio del paciente ni el prestador de la visita");
      }
    }

    if (input.pacienteServicioId !== undefined) {
      await this.validatePacienteServicio(input.pacienteServicioId);
    }

    if (input.prestadorId !== undefined) {
      await this.validatePrestador(input.prestadorId);
    }

    const fechaInicio = input.fechaInicio ?? existing.fechaInicio;
    const tiempoMinutos = input.tiempoMinutos ?? existing.tiempoMinutos;
    const fechaFin =
      input.fechaFin ??
      (input.fechaInicio !== undefined || input.tiempoMinutos !== undefined
        ? resolveFechaFin(fechaInicio, tiempoMinutos)
        : undefined);

    if (fechaFin !== undefined && fechaFin <= fechaInicio) {
      throw AppError.badRequest("fechaFin debe ser posterior a fechaInicio");
    }

    const visita = await this.visitasRepository.update(id, {
      ...(input.pacienteServicioId !== undefined
        ? { pacienteServicioId: input.pacienteServicioId }
        : {}),
      ...(input.prestadorId !== undefined ? { prestadorId: input.prestadorId } : {}),
      ...(input.fechaInicio !== undefined ? { fechaInicio: input.fechaInicio } : {}),
      ...(fechaFin !== undefined ? { fechaFin } : {}),
      ...(input.tiempoMinutos !== undefined ? { tiempoMinutos: input.tiempoMinutos } : {}),
      ...(input.observaciones !== undefined ? { observaciones: input.observaciones } : {}),
    });

    return mapVisitaToDto(visita);
  }

  async updateFinanzas(_auth: AuthContext, id: number, input: UpdateVisitaFinanzasInput): Promise<VisitaDto> {
    const existing = await this.visitasRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Visita no encontrada");
    }

    if (!existing.finanzas) {
      throw AppError.notFound("La visita no tiene datos financieros asociados");
    }

    const visita = await this.visitasRepository.updateFinanzas(
      id,
      buildFinanzasPatch(input, existing.finanzas),
    );
    return mapVisitaToDto(visita);
  }

  async bulkUpdateFinanzas(
    _auth: AuthContext,
    input: BulkUpdateVisitaFinanzasInput,
  ): Promise<BulkUpdateVisitaFinanzasResultDto> {
    const uniqueIds = [...new Set(input.visitaIds)];

    try {
      const actualizadas = await this.visitasRepository.bulkUpdateFinanzas(
        uniqueIds,
        (finanzas) => buildFinanzasPatch(input, finanzas),
      );

      return { actualizadas, visitaIds: uniqueIds };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.startsWith("MISSING:")) {
          const ids = error.message.slice("MISSING:".length);
          throw AppError.notFound(`Visitas no encontradas: ${ids}`);
        }
        if (error.message.startsWith("NO_FINANZAS:")) {
          const ids = error.message.slice("NO_FINANZAS:".length);
          throw AppError.conflict(`Visitas sin datos financieros: ${ids}`);
        }
      }
      throw error;
    }
  }

  async delete(auth: AuthContext, id: number): Promise<void> {
    const existing = await this.visitasRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Visita no encontrada");
    }

    const isAdmin = auth.roles.includes(ROLE.ADMIN);
    if (!isAdmin) {
      const ownPrestadorId = await this.getPrestadorIdForUser(auth.userId);
      if (existing.prestadorId !== ownPrestadorId) {
        throw AppError.forbidden("No podés eliminar visitas de otros prestadores");
      }
    }

    await this.visitasRepository.delete(id);
  }

  private async buildFinanzasForCreate(
    pacienteServicio: { servicioId: number; modalidadCobro: string },
    fechaInicio: Date,
    tiempoMinutos: number,
  ) {
    const tipoJornada = resolveTipoJornada(fechaInicio);
    const tipoDia = resolveTipoDia(fechaInicio);
    const modalidadCobro = pacienteServicio.modalidadCobro as ModalidadCobro;

    const tarifa = await this.visitasRepository.findTarifaForVisita(
      pacienteServicio.servicioId,
      modalidadCobro,
      tipoJornada,
      tipoDia,
    );

    if (!tarifa) {
      throw AppError.conflict(
        `No hay tarifa para modalidad ${modalidadCobro}, jornada ${tipoJornada} y día ${tipoDia}`,
      );
    }

    const valorAplicado = calcularValorAplicado(modalidadCobro, tarifa.valor, tiempoMinutos);

    return {
      modalidadCobro,
      tipoJornada,
      tipoDia,
      valorUnitario: tarifa.valor,
      valorAplicado,
    };
  }

  private async getPacienteServicioForCreate(pacienteServicioId: number) {
    const row = await this.visitasRepository.findPacienteServicioForVisita(pacienteServicioId);
    if (!row) {
      throw AppError.notFound("Asignación paciente-servicio no encontrada");
    }
    return row;
  }

  private async buildListFilters(
    auth: AuthContext,
    query: ListVisitasQuery,
  ): Promise<{
    prestadorId?: number | undefined;
    pacienteServicioId?: number | undefined;
    fechaDesde?: Date | undefined;
    fechaHasta?: Date | undefined;
  }> {
    const isAdminOrOperador =
      auth.roles.includes(ROLE.ADMIN) || auth.roles.includes(ROLE.OPERADOR);

    if (isAdminOrOperador) {
      return {
        prestadorId: query.prestadorId,
        pacienteServicioId: query.pacienteServicioId,
        fechaDesde: query.fechaDesde,
        fechaHasta: query.fechaHasta,
      };
    }

    const ownPrestadorId = await this.getPrestadorIdForUser(auth.userId);
    return {
      prestadorId: ownPrestadorId,
      pacienteServicioId: query.pacienteServicioId,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
    };
  }

  private async resolvePrestadorIdForCreate(
    auth: AuthContext,
    inputPrestadorId: number | undefined,
  ): Promise<number> {
    const isAdmin = auth.roles.includes(ROLE.ADMIN);

    if (isAdmin) {
      if (inputPrestadorId === undefined) {
        throw AppError.badRequest("prestadorId es obligatorio para administradores");
      }
      return inputPrestadorId;
    }

    const ownPrestadorId = await this.getPrestadorIdForUser(auth.userId);

    if (inputPrestadorId !== undefined && inputPrestadorId !== ownPrestadorId) {
      throw AppError.forbidden("No podés registrar visitas para otro prestador");
    }

    return ownPrestadorId;
  }

  private async getPrestadorIdForUser(userId: number): Promise<number> {
    const prestador = await this.visitasRepository.findPrestadorByUserId(userId);
    if (!prestador) {
      throw AppError.forbidden("Tu usuario no tiene un perfil de prestador asociado");
    }
    if (!prestador.estado) {
      throw AppError.forbidden("Tu perfil de prestador está inactivo");
    }
    return prestador.id;
  }

  private async ensureCanAccessVisita(auth: AuthContext, visitaPrestadorId: number): Promise<void> {
    const isAdminOrOperador =
      auth.roles.includes(ROLE.ADMIN) || auth.roles.includes(ROLE.OPERADOR);

    if (isAdminOrOperador) {
      return;
    }

    const ownPrestadorId = await this.getPrestadorIdForUser(auth.userId);
    if (visitaPrestadorId !== ownPrestadorId) {
      throw AppError.forbidden("No tenés acceso a esta visita");
    }
  }

  private async validatePacienteServicio(pacienteServicioId: number): Promise<void> {
    const row = await this.visitasRepository.findPacienteServicioById(pacienteServicioId);
    if (!row) {
      throw AppError.notFound("Asignación paciente-servicio no encontrada");
    }
  }

  private async validatePrestador(prestadorId: number): Promise<void> {
    const prestador = await this.visitasRepository.findPrestadorById(prestadorId);
    if (!prestador) {
      throw AppError.notFound("Prestador no encontrado");
    }
    if (!prestador.estado) {
      throw AppError.conflict("El prestador está inactivo");
    }
  }
}
