import { AppError } from "../../core/errors/AppError.js";
import { PACIENTE_SERVICIO_ESTADO } from "../../shared/constants/paciente-servicio-estado.js";
import { ROLE } from "../../shared/constants/roles.js";
import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import { buildFinanzasPatch } from "../../shared/visita/buildFinanzasPatch.js";
import { VISITA_ESTADO } from "../../shared/constants/visita-estado.js";
import {
  calcularTiempoMinutosEntre,
  calcularValorAplicado,
  resolveFechaFin,
  resolveTipoDia,
  resolveTipoJornada,
} from "../../shared/visita/visitaTarifa.js";
import { assertCupoDisponibleParaVisita } from "../../shared/paciente-servicio/assertCupoDisponible.js";
import { assertFechaDentroVigenciaAsignacion } from "../../shared/paciente-servicio/assertFechaDentroVigencia.js";
import type { PacienteServicioForVisita, VisitasRepository } from "./visitas.repository.js";
import type {
  BulkUpdateVisitaFinanzasInput,
  CreateVisitaInput,
  FinalizarVisitaInput,
  IniciarVisitaInput,
  ListVisitasQuery,
  UpdateVisitaFinanzasInput,
  UpdateVisitaInput,
  VisitaPendienteQuery,
} from "./visitas.validation.js";
import type {
  BulkUpdateVisitaFinanzasResultDto,
  PaginatedVisitasDto,
  VisitaDto,
  VisitaPendienteDto,
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

  async getPendiente(auth: AuthContext, query: VisitaPendienteQuery): Promise<VisitaPendienteDto> {
    const prestadorId = await this.resolvePrestadorIdForCreate(auth, undefined);
    const visita = await this.visitasRepository.findVisitaIniciada(
      query.pacienteServicioId,
      prestadorId,
    );

    if (!visita) {
      return { tieneVisitaPendiente: false, visita: null };
    }

    return {
      tieneVisitaPendiente: true,
      visita: {
        id: visita.id,
        fechaInicio: visita.fechaInicio.toISOString(),
        estado: VISITA_ESTADO.INICIADA,
      },
    };
  }

  async iniciar(auth: AuthContext, input: IniciarVisitaInput): Promise<VisitaDto> {
    const prestadorId = await this.resolvePrestadorIdForCreate(auth, undefined);
    const pacienteServicio = await this.getPacienteServicioForVisita(input.pacienteServicioId);
    this.ensureServicioConControlHorario(pacienteServicio.servicio.controlHorario);
    this.ensurePacienteServicioActiva(pacienteServicio.estado);
    await this.validatePrestador(prestadorId);
    await this.ensurePrestadorPuedeIniciarVisita(pacienteServicio, prestadorId);

    const fechaInicio = new Date();
    this.ensureFechaDentroVigenciaAsignacion(pacienteServicio, fechaInicio);
    await this.ensureCupoDisponible(pacienteServicio, fechaInicio);

    const visitaIniciada = await this.visitasRepository.findVisitaIniciada(
      input.pacienteServicioId,
      prestadorId,
    );
    if (visitaIniciada) {
      throw AppError.conflict(
        "Ya tenés una visita iniciada para esta asignación; finalizala antes de iniciar otra",
      );
    }

    const visita = await this.visitasRepository.create({
      pacienteServicioId: input.pacienteServicioId,
      prestadorId,
      estado: VISITA_ESTADO.INICIADA,
      fechaInicio,
      fechaFin: null,
      tiempoMinutos: null,
      observaciones: null,
    });

    return mapVisitaToDto(visita);
  }

  async finalizar(
    auth: AuthContext,
    id: number,
    input: FinalizarVisitaInput,
  ): Promise<VisitaDto> {
    const existing = await this.visitasRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Visita no encontrada");
    }

    await this.ensureCanAccessVisita(auth, existing.prestadorId);

    if (existing.estado !== VISITA_ESTADO.INICIADA) {
      throw AppError.conflict("Solo se pueden finalizar visitas en estado iniciada");
    }

    if (!existing.pacienteServicio.servicio.controlHorario) {
      throw AppError.conflict("Este servicio no utiliza control horario por doble escaneo");
    }

    const fechaFin = new Date();
    if (fechaFin <= existing.fechaInicio) {
      throw AppError.badRequest("fechaFin debe ser posterior a fechaInicio");
    }

    const tiempoMinutos = calcularTiempoMinutosEntre(existing.fechaInicio, fechaFin);
    const pacienteServicio = await this.getPacienteServicioForVisita(existing.pacienteServicioId);
    const finanzas = await this.buildFinanzasForCreate(
      pacienteServicio,
      existing.fechaInicio,
      tiempoMinutos,
    );

    const observaciones =
      input.observaciones !== undefined ? input.observaciones : existing.observaciones;

    const visita = await this.visitasRepository.finalizar(id, {
      fechaFin,
      tiempoMinutos,
      observaciones,
      finanzas,
    });

    return mapVisitaToDto(visita);
  }

  async cancelar(auth: AuthContext, id: number): Promise<VisitaDto> {
    if (!auth.roles.includes(ROLE.ADMIN)) {
      throw AppError.forbidden("Solo un administrador puede cancelar visitas");
    }

    const existing = await this.visitasRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Visita no encontrada");
    }

    if (existing.estado !== VISITA_ESTADO.INICIADA) {
      throw AppError.conflict("Solo se pueden cancelar visitas en estado iniciada");
    }

    const visita = await this.visitasRepository.cancelar(id);
    return mapVisitaToDto(visita);
  }

  async create(auth: AuthContext, input: CreateVisitaInput): Promise<VisitaDto> {
    const prestadorId = await this.resolvePrestadorIdForCreate(auth, input.prestadorId);
    const pacienteServicio = await this.getPacienteServicioForVisita(input.pacienteServicioId);
    this.ensureServicioSinControlHorario(pacienteServicio.servicio.controlHorario);
    this.ensurePacienteServicioActiva(pacienteServicio.estado);
    await this.validatePrestador(prestadorId);
    await this.ensurePrestadorPuedeIniciarVisita(pacienteServicio, prestadorId);
    this.ensureFechaDentroVigenciaAsignacion(pacienteServicio, input.fechaInicio);
    await this.ensureCupoDisponible(pacienteServicio, input.fechaInicio);

    const fechaFin = resolveFechaFin(input.fechaInicio, input.tiempoMinutos, input.fechaFin);
    const finanzas = await this.buildFinanzasForCreate(
      pacienteServicio,
      input.fechaInicio,
      input.tiempoMinutos,
    );

    const visita = await this.visitasRepository.create({
      pacienteServicioId: input.pacienteServicioId,
      prestadorId,
      estado: VISITA_ESTADO.FINALIZADA,
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

    if (input.prestadorId !== undefined) {
      await this.validatePrestador(input.prestadorId);
    }

    if (input.pacienteServicioId !== undefined || input.prestadorId !== undefined) {
      const pacienteServicioId = input.pacienteServicioId ?? existing.pacienteServicioId;
      const prestadorId = input.prestadorId ?? existing.prestadorId;
      const pacienteServicio = await this.getPacienteServicioForVisita(pacienteServicioId);
      this.ensurePacienteServicioActiva(pacienteServicio.estado);
      await this.ensurePrestadorPuedeIniciarVisita(pacienteServicio, prestadorId);
    }

    if (existing.estado === VISITA_ESTADO.INICIADA) {
      throw AppError.conflict(
        "No se puede editar una visita iniciada; finalizala o pedí que un administrador la cancele",
      );
    }

    if (existing.estado === VISITA_ESTADO.CANCELADA) {
      throw AppError.conflict("No se puede editar una visita cancelada");
    }

    const fechaInicio = input.fechaInicio ?? existing.fechaInicio;
    const tiempoMinutos = input.tiempoMinutos ?? existing.tiempoMinutos ?? 1;
    const fechaFin =
      input.fechaFin ??
      (input.fechaInicio !== undefined || input.tiempoMinutos !== undefined
        ? resolveFechaFin(fechaInicio, tiempoMinutos)
        : undefined);

    if (fechaFin !== undefined && fechaFin <= fechaInicio) {
      throw AppError.badRequest("fechaFin debe ser posterior a fechaInicio");
    }

    if (input.pacienteServicioId !== undefined || input.fechaInicio !== undefined) {
      const pacienteServicioId = input.pacienteServicioId ?? existing.pacienteServicioId;
      const pacienteServicio = await this.getPacienteServicioForVisita(pacienteServicioId);
      this.ensurePacienteServicioActiva(pacienteServicio.estado);
      this.ensureFechaDentroVigenciaAsignacion(pacienteServicio, fechaInicio);
      await this.ensureCupoDisponible(pacienteServicio, fechaInicio, id);
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

    if (existing.estado === VISITA_ESTADO.INICIADA) {
      throw AppError.conflict(
        "No se puede eliminar una visita iniciada; finalizala o cancelala (solo administrador)",
      );
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

  private async getPacienteServicioForVisita(pacienteServicioId: number) {
    const row = await this.visitasRepository.findPacienteServicioForVisita(pacienteServicioId);
    if (!row) {
      throw AppError.notFound("Asignación paciente-servicio no encontrada");
    }
    return row;
  }

  private ensurePacienteServicioActiva(estado: string): void {
    if (estado === PACIENTE_SERVICIO_ESTADO.ACTIVA) {
      return;
    }

    if (estado === PACIENTE_SERVICIO_ESTADO.SUSPENDIDA) {
      throw AppError.conflict("La asignación paciente-servicio está suspendida");
    }

    if (estado === PACIENTE_SERVICIO_ESTADO.FINALIZADA) {
      throw AppError.conflict("La asignación paciente-servicio está finalizada");
    }

    throw AppError.conflict("La asignación paciente-servicio no está activa");
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

  private async validatePrestador(prestadorId: number): Promise<void> {
    const prestador = await this.visitasRepository.findPrestadorById(prestadorId);
    if (!prestador) {
      throw AppError.notFound("Prestador no encontrado");
    }
    if (!prestador.estado) {
      throw AppError.conflict("El prestador está inactivo");
    }
  }

  private ensureFechaDentroVigenciaAsignacion(
    pacienteServicio: Pick<PacienteServicioForVisita, "fechaInicio" | "fechaFin">,
    fechaVisita: Date,
  ): void {
    assertFechaDentroVigenciaAsignacion(
      fechaVisita,
      pacienteServicio.fechaInicio,
      pacienteServicio.fechaFin,
    );
  }

  private async ensureCupoDisponible(
    pacienteServicio: Pick<
      PacienteServicioForVisita,
      "id" | "periodoControl" | "cantidadPermitida" | "modalidadCobro"
    >,
    fechaReferencia: Date,
    excludeVisitaId?: number,
  ): Promise<void> {
    await assertCupoDisponibleParaVisita({
      pacienteServicioId: pacienteServicio.id,
      periodoControl: pacienteServicio.periodoControl,
      cantidadPermitida: pacienteServicio.cantidadPermitida,
      modalidadCobro: pacienteServicio.modalidadCobro,
      fechaReferencia,
      countVisitasEnVentana: (psId, desde, hasta, excludeId) =>
        this.visitasRepository.countVisitasEnVentana(psId, desde, hasta, excludeId),
      excludeVisitaId,
    });
  }

  private ensureServicioConControlHorario(controlHorario: boolean): void {
    if (!controlHorario) {
      throw AppError.conflict(
        "Este servicio no tiene control horario; registrá la visita con POST /visitas",
      );
    }
  }

  private ensureServicioSinControlHorario(controlHorario: boolean): void {
    if (controlHorario) {
      throw AppError.conflict(
        "Este servicio tiene control horario; usá POST /visitas/iniciar y POST /visitas/:id/finalizar",
      );
    }
  }

  private async ensurePrestadorPuedeIniciarVisita(
    pacienteServicio: { prestadorId: number | null; servicioId: number },
    prestadorId: number,
  ): Promise<void> {
    if (pacienteServicio.prestadorId != null) {
      if (pacienteServicio.prestadorId !== prestadorId) {
        throw AppError.forbidden(
          "No podés iniciar una visita: no sos el prestador asignado a esta asignación paciente-servicio",
        );
      }
      return;
    }

    const tieneServicio = await this.visitasRepository.prestadorTieneServicio(
      prestadorId,
      pacienteServicio.servicioId,
    );
    if (!tieneServicio) {
      throw AppError.forbidden(
        "No podés iniciar una visita: no tenés habilitado el servicio de esta asignación",
      );
    }
  }
}
