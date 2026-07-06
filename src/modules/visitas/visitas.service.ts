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
import {
  acotarTiempoMinutos,
  buildObservacionesCierreAutomatico,
  calcularFechaLimiteVisita,
  calcularFechaLimiteVisitaOpcional,
  estaVisitaVencida,
} from "../../shared/visita/visitaLimite.js";
import { visitaScheduler } from "../../shared/visita/visitaScheduler.js";
import { assertCupoDisponibleParaVisita } from "../../shared/paciente-servicio/assertCupoDisponible.js";
import { resolvePrestadoresAsignadosIds } from "../../shared/paciente-servicio/resolvePrestadoresAsignados.js";
import {
  estaDentroVentanaCoberturaDiaria,
  tieneVentanaDiariaConfigurada,
} from "../../shared/paciente-servicio/coberturaDiaria.js";
import { assertFechaDentroVigenciaAsignacion } from "../../shared/paciente-servicio/assertFechaDentroVigencia.js";
import type {
  PacienteServicioForVisita,
  VisitaIniciadaParaCierre,
  VisitasRepository,
} from "./visitas.repository.js";
import type {
  BulkUpdateVisitaFinanzasInput,
  CreateVisitaInput,
  GestionarTramoAdminInput,
  FinalizarVisitaInput,
  IniciarVisitaInput,
  ListVisitasQuery,
  RelevarVisitaInput,
  UpdateVisitaFinanzasInput,
  UpdateVisitaInput,
  VisitaPendienteQuery,
} from "./visitas.validation.js";
import type {
  BulkUpdateVisitaFinanzasResultDto,
  PaginatedVisitasDto,
  RelevarVisitaDto,
  GestionarTramoAdminDto,
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
    const pacienteServicio = await this.getPacienteServicioForVisita(query.pacienteServicioId);

    if (pacienteServicio.servicio.modoRelevo) {
      const tramoActivo = await this.visitasRepository.findTramoActivo(query.pacienteServicioId);
      const coberturaActiva =
        tramoActivo !== null
          ? {
              visitaId: tramoActivo.id,
              prestadorId: tramoActivo.prestadorId,
              fechaInicio: tramoActivo.fechaInicio.toISOString(),
            }
          : null;

      const visitaPropia =
        tramoActivo !== null && tramoActivo.prestadorId === prestadorId ? tramoActivo : null;

      return {
        tieneVisitaPendiente: visitaPropia !== null,
        visita:
          visitaPropia !== null
            ? {
                id: visitaPropia.id,
                fechaInicio: visitaPropia.fechaInicio.toISOString(),
                estado: VISITA_ESTADO.INICIADA,
                fechaLimite: null,
              }
            : null,
        visitasCerradasAutomaticamente: 0,
        modoRelevo: true,
        coberturaActiva,
      };
    }

    const { cerradas: visitasCerradasAutomaticamente } = await this.cerrarVisitasVencidas({
      prestadorId,
      pacienteServicioId: query.pacienteServicioId,
    });

    const visita = await this.visitasRepository.findVisitaIniciada(
      query.pacienteServicioId,
      prestadorId,
    );

    if (!visita) {
      return { tieneVisitaPendiente: false, visita: null, visitasCerradasAutomaticamente };
    }

    const fechaLimite = calcularFechaLimiteVisitaOpcional(
      visita.fechaInicio,
      pacienteServicio.cantidadHoras,
    );

    return {
      tieneVisitaPendiente: true,
      visita: {
        id: visita.id,
        fechaInicio: visita.fechaInicio.toISOString(),
        estado: VISITA_ESTADO.INICIADA,
        fechaLimite: fechaLimite?.toISOString() ?? null,
      },
      visitasCerradasAutomaticamente,
    };
  }

  /**
   * Cierra visitas iniciadas que superaron `cantidadHoras` de su asignación.
   * Usado como respaldo al consultar y desde el cron interno.
   */
  async cerrarVisitasVencidas(filters: {
    prestadorId?: number;
    pacienteServicioId?: number;
    visitaId?: number;
    referencia?: Date;
  }): Promise<{ cerradas: number; visitaIds: number[] }> {
    const referencia = filters.referencia ?? new Date();
    const candidatas = await this.visitasRepository.findVisitasIniciadasParaCierre({
      prestadorId: filters.prestadorId,
      pacienteServicioId: filters.pacienteServicioId,
      visitaId: filters.visitaId,
    });

    const visitaIds: number[] = [];
    for (const visita of candidatas) {
      const cerrada = await this.cerrarVisitaVencidaSiCorresponde(visita, referencia);
      if (cerrada) {
        visitaIds.push(visita.id);
      }
    }
    return { cerradas: visitaIds.length, visitaIds };
  }

  async iniciar(auth: AuthContext, input: IniciarVisitaInput): Promise<VisitaDto> {
    const prestadorId = await this.resolvePrestadorIdForCreate(auth, undefined);
    const pacienteServicio = await this.getPacienteServicioForVisita(input.pacienteServicioId);
    this.ensureServicioNoModoRelevo(pacienteServicio.servicio.modoRelevo, "iniciar");
    this.ensureServicioConControlHorario(pacienteServicio.servicio.controlHorario);
    this.ensureCantidadHorasParaControlHorario(pacienteServicio.cantidadHoras);
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

    this.programarCierreAutomatico(visita.id, fechaInicio, pacienteServicio.cantidadHoras);

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

    if (existing.pacienteServicio.servicio.modoRelevo) {
      throw AppError.conflict(
        "En modo relevo la cuidadora no puede finalizar sola; el cierre ocurre con el relevo",
      );
    }

    const fechaFin = new Date();
    if (fechaFin <= existing.fechaInicio) {
      throw AppError.badRequest("fechaFin debe ser posterior a fechaInicio");
    }

    const pacienteServicio = await this.getPacienteServicioForVisita(existing.pacienteServicioId);
    const tiempoMinutos = acotarTiempoMinutos(
      calcularTiempoMinutosEntre(existing.fechaInicio, fechaFin),
      pacienteServicio.cantidadHoras,
    );
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
      cierreAutomatico: false,
    });

    visitaScheduler.clear(id);

    return mapVisitaToDto(visita);
  }

  async relevar(auth: AuthContext, input: RelevarVisitaInput): Promise<RelevarVisitaDto> {
    const prestadorId = await this.resolvePrestadorIdForCreate(auth, undefined);
    const pacienteServicio = await this.getPacienteServicioForVisita(input.pacienteServicioId);

    if (!pacienteServicio.servicio.modoRelevo) {
      throw AppError.conflict(
        "Este servicio no usa modo relevo; usá iniciar/finalizar o POST /visitas",
      );
    }

    this.ensurePacienteServicioActiva(pacienteServicio.estado);
    await this.validatePrestador(prestadorId);
    await this.ensurePrestadorAsignadoParaRelevo(pacienteServicio, prestadorId);

    const fechaRelevo = new Date();
    this.ensureFechaDentroVigenciaAsignacion(pacienteServicio, fechaRelevo);
    this.ensureDentroVentanaCoberturaDiaria(pacienteServicio, fechaRelevo);

    const tramoActivo = await this.visitasRepository.findTramoActivo(input.pacienteServicioId);

    if (tramoActivo && tramoActivo.prestadorId === prestadorId) {
      throw AppError.conflict("Ya tenés el tramo activo en esta asignación");
    }

    if (!tramoActivo) {
      const visita = await this.visitasRepository.create({
        pacienteServicioId: input.pacienteServicioId,
        prestadorId,
        estado: VISITA_ESTADO.INICIADA,
        fechaInicio: fechaRelevo,
        fechaFin: null,
        tiempoMinutos: null,
        observaciones: null,
      });

      return {
        huboRelevo: false,
        visitaAnterior: null,
        visita: mapVisitaToDto(visita),
      };
    }

    const tiempoMinutos = calcularTiempoMinutosEntre(tramoActivo.fechaInicio, fechaRelevo);
    const finanzasAnterior = await this.buildFinanzasForCreate(
      pacienteServicio,
      tramoActivo.fechaInicio,
      tiempoMinutos,
    );

    const { anterior, actual } = await this.visitasRepository.relevarTramo({
      pacienteServicioId: input.pacienteServicioId,
      prestadorId,
      fechaRelevo,
      visitaAnteriorId: tramoActivo.id,
      tiempoMinutosAnterior: tiempoMinutos,
      observacionesAnterior: tramoActivo.observaciones,
      finanzasAnterior,
    });

    return {
      huboRelevo: true,
      visitaAnterior: mapVisitaToDto(anterior),
      visita: mapVisitaToDto(actual),
    };
  }

  async gestionarTramoAdmin(
    auth: AuthContext,
    input: GestionarTramoAdminInput,
  ): Promise<GestionarTramoAdminDto> {
    if (!auth.roles.includes(ROLE.ADMIN)) {
      throw AppError.forbidden("Solo un administrador puede gestionar tramos de cobertura");
    }

    switch (input.accion) {
      case "iniciar": {
        const visita = await this.iniciarTramoAdmin(input);
        return { accion: "iniciar", visita };
      }
      case "finalizar": {
        const visita = await this.finalizarTramoAdmin(input.visitaId!, input);
        return { accion: "finalizar", visita };
      }
      case "cancelar": {
        const visita = await this.cancelarTramoAdmin(input.visitaId!, input);
        return { accion: "cancelar", visita };
      }
    }
  }

  private async iniciarTramoAdmin(input: GestionarTramoAdminInput): Promise<VisitaDto> {
    const pacienteServicioId = input.pacienteServicioId!;
    const prestadorId = input.prestadorId!;

    const pacienteServicio = await this.getPacienteServicioForVisita(pacienteServicioId);
    if (!pacienteServicio.servicio.modoRelevo) {
      throw AppError.conflict("Este endpoint de gestión es solo para servicios en modo relevo");
    }

    this.ensurePacienteServicioActiva(pacienteServicio.estado);
    await this.validatePrestador(prestadorId);
    await this.ensurePrestadorAsignadoParaRelevo(pacienteServicio, prestadorId);

    const fechaInicio = new Date();
    this.ensureFechaDentroVigenciaAsignacion(pacienteServicio, fechaInicio);
    this.ensureDentroVentanaCoberturaDiaria(pacienteServicio, fechaInicio);

    const tramoActivo = await this.visitasRepository.findTramoActivo(pacienteServicioId);
    if (tramoActivo) {
      throw AppError.conflict(
        "Ya hay un tramo activo en esta asignación; finalizalo o cancelalo antes de iniciar otro",
      );
    }

    const visita = await this.visitasRepository.create({
      pacienteServicioId,
      prestadorId,
      estado: VISITA_ESTADO.INICIADA,
      fechaInicio,
      fechaFin: null,
      tiempoMinutos: null,
      observaciones: input.observaciones ?? null,
    });

    return mapVisitaToDto(visita);
  }

  private async finalizarTramoAdmin(
    id: number,
    input: { observaciones?: string | null | undefined },
  ): Promise<VisitaDto> {
    const existing = await this.visitasRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Visita no encontrada");
    }

    if (existing.estado !== VISITA_ESTADO.INICIADA) {
      throw AppError.conflict("Solo se pueden finalizar tramos en estado iniciada");
    }

    if (!existing.pacienteServicio.servicio.modoRelevo) {
      throw AppError.conflict(
        "Este endpoint de gestión es solo para tramos en modo relevo",
      );
    }

    const fechaFin = new Date();
    if (fechaFin <= existing.fechaInicio) {
      throw AppError.badRequest("fechaFin debe ser posterior a fechaInicio");
    }

    const pacienteServicio = await this.getPacienteServicioForVisita(existing.pacienteServicioId);
    const tiempoMinutos = calcularTiempoMinutosEntre(existing.fechaInicio, fechaFin);
    const finanzas = await this.buildFinanzasForCreate(
      pacienteServicio,
      existing.fechaInicio,
      tiempoMinutos,
    );

    const observaciones = this.buildObservacionesCierreAdministrativo(
      existing.observaciones,
      input.observaciones,
    );

    const visita = await this.visitasRepository.finalizar(id, {
      fechaFin,
      tiempoMinutos,
      observaciones,
      finanzas,
      cierreAutomatico: false,
      cierrePorRelevo: false,
    });

    return mapVisitaToDto(visita);
  }

  private async cancelarTramoAdmin(
    id: number,
    input: { observaciones?: string | null | undefined },
  ): Promise<VisitaDto> {
    const existing = await this.visitasRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Visita no encontrada");
    }

    if (existing.estado !== VISITA_ESTADO.INICIADA) {
      throw AppError.conflict("Solo se pueden cancelar tramos en estado iniciada");
    }

    if (!existing.pacienteServicio.servicio.modoRelevo) {
      throw AppError.conflict(
        "Este endpoint de gestión es solo para tramos en modo relevo",
      );
    }

    const observaciones = this.buildObservacionesCancelacionAdministrativa(
      existing.observaciones,
      input.observaciones,
    );

    const visita = await this.visitasRepository.cancelar(id, observaciones);
    visitaScheduler.clear(id);
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
    visitaScheduler.clear(id);
    return mapVisitaToDto(visita);
  }

  async create(auth: AuthContext, input: CreateVisitaInput): Promise<VisitaDto> {
    const prestadorId = await this.resolvePrestadorIdForCreate(auth, input.prestadorId);
    const pacienteServicio = await this.getPacienteServicioForVisita(input.pacienteServicioId);
    this.ensureServicioNoModoRelevo(pacienteServicio.servicio.modoRelevo, "registrar");
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
    if (!auth.roles.includes(ROLE.ADMIN)) {
      throw AppError.forbidden("Solo un administrador puede eliminar visitas");
    }

    const existing = await this.visitasRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Visita no encontrada");
    }

    if (existing.estado === VISITA_ESTADO.INICIADA) {
      throw AppError.conflict(
        "No se puede eliminar una visita iniciada; finalizala o cancelala primero",
      );
    }

    if (existing.finanzas?.facturado || existing.finanzas?.pagado) {
      throw AppError.conflict(
        "No se puede eliminar una visita facturada o pagada; desmarcá el estado de cobro antes de eliminarla",
      );
    }

    visitaScheduler.clear(id);
    await this.visitasRepository.delete(id);
  }

  private async cerrarVisitaVencidaSiCorresponde(
    visita: VisitaIniciadaParaCierre,
    referencia: Date,
  ): Promise<boolean> {
    if (!visita.pacienteServicio.servicio.controlHorario) {
      return false;
    }

    if (visita.pacienteServicio.servicio.modoRelevo) {
      return false;
    }

    const { cantidadHoras } = visita.pacienteServicio;
    if (!estaVisitaVencida(visita.fechaInicio, cantidadHoras, referencia)) {
      return false;
    }

    if (cantidadHoras == null) {
      return false;
    }

    const fechaFin = calcularFechaLimiteVisita(visita.fechaInicio, cantidadHoras);
    const tiempoMinutos = calcularTiempoMinutosEntre(visita.fechaInicio, fechaFin);
    const pacienteServicio = await this.getPacienteServicioForVisita(visita.pacienteServicioId);
    const finanzas = await this.buildFinanzasForCreate(
      pacienteServicio,
      visita.fechaInicio,
      tiempoMinutos,
    );

    await this.visitasRepository.finalizar(visita.id, {
      fechaFin,
      tiempoMinutos,
      observaciones: buildObservacionesCierreAutomatico(visita.observaciones),
      finanzas,
      cierreAutomatico: true,
    });

    visitaScheduler.clear(visita.id);

    return true;
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
      "id" | "periodoControl" | "cantidadPermitida" | "modalidadCobro" | "servicio"
    >,
    fechaReferencia: Date,
    excludeVisitaId?: number,
  ): Promise<void> {
    if (pacienteServicio.servicio.modoRelevo) {
      return;
    }

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

  private ensureCantidadHorasParaControlHorario(cantidadHoras: number | null): void {
    if (cantidadHoras == null || cantidadHoras < 1) {
      throw AppError.conflict(
        "La asignación no tiene cantidad de horas configurada; no se puede iniciar una visita con control horario",
      );
    }
  }

  private programarCierreAutomatico(
    visitaId: number,
    fechaInicio: Date,
    cantidadHoras: number | null,
  ): void {
    if (cantidadHoras == null) {
      return;
    }
    visitaScheduler.schedule(visitaId, calcularFechaLimiteVisita(fechaInicio, cantidadHoras));
  }

  private ensureServicioSinControlHorario(controlHorario: boolean): void {
    if (controlHorario) {
      throw AppError.conflict(
        "Este servicio tiene control horario; usá POST /visitas/iniciar y POST /visitas/:id/finalizar",
      );
    }
  }

  private ensureDentroVentanaCoberturaDiaria(
    pacienteServicio: Pick<
      PacienteServicioForVisita,
      "coberturaDiariaInicio" | "coberturaDiariaFin"
    >,
    referencia: Date,
  ): void {
    if (
      !tieneVentanaDiariaConfigurada(
        pacienteServicio.coberturaDiariaInicio,
        pacienteServicio.coberturaDiariaFin,
      )
    ) {
      return;
    }

    if (
      !estaDentroVentanaCoberturaDiaria(
        pacienteServicio.coberturaDiariaInicio,
        pacienteServicio.coberturaDiariaFin,
        referencia,
      )
    ) {
      throw AppError.conflict(
        `Fuera del horario de cobertura autorizado (${pacienteServicio.coberturaDiariaInicio}–${pacienteServicio.coberturaDiariaFin})`,
      );
    }
  }

  private buildObservacionesCierreAdministrativo(
    existing: string | null,
    input: string | null | undefined,
  ): string | null {
    if (input !== undefined && input !== null && input.trim() !== "") {
      return input;
    }
    const nota = "Cierre administrativo del tramo de cobertura.";
    return existing ? `${existing}\n${nota}` : nota;
  }

  private buildObservacionesCancelacionAdministrativa(
    existing: string | null,
    input: string | null | undefined,
  ): string | null {
    if (input !== undefined && input !== null && input.trim() !== "") {
      return input;
    }
    const nota = "Cancelación administrativa del tramo de cobertura.";
    return existing ? `${existing}\n${nota}` : nota;
  }

  private ensureServicioNoModoRelevo(modoRelevo: boolean, accion: string): void {
    if (modoRelevo) {
      throw AppError.conflict(
        `Este servicio usa modo relevo; usá POST /visitas/relevar para ${accion} cobertura`,
      );
    }
  }

  private async ensurePrestadorAsignadoParaRelevo(
    pacienteServicio: PacienteServicioForVisita,
    prestadorId: number,
  ): Promise<void> {
    const asignados = resolvePrestadoresAsignadosIds(pacienteServicio);
    if (asignados.length === 0) {
      throw AppError.conflict(
        "La asignación no tiene prestadores habilitados configurados",
      );
    }
    if (!asignados.includes(prestadorId)) {
      throw AppError.forbidden("No estás habilitada para cubrir esta asignación");
    }
  }

  private async ensurePrestadorPuedeIniciarVisita(
    pacienteServicio: PacienteServicioForVisita,
    prestadorId: number,
  ): Promise<void> {
    const asignados = resolvePrestadoresAsignadosIds(pacienteServicio);
    if (asignados.length > 0) {
      if (!asignados.includes(prestadorId)) {
        throw AppError.forbidden(
          "No podés iniciar una visita: no estás en la lista de prestadores de esta asignación",
        );
      }
      return;
    }

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
