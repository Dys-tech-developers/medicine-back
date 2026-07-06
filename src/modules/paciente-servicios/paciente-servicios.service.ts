import { AppError } from "../../core/errors/AppError.js";
import type { PacienteServiciosRepository } from "./paciente-servicios.repository.js";
import type {
  CreatePacienteServicioInput,
  ListPacienteServiciosQuery,
  UpdatePacienteServicioInput,
} from "./paciente-servicios.validation.js";
import type {
  PaginatedPacienteServiciosDto,
  PacienteServicioDisponibilidadDto,
  PacienteServicioDto,
} from "./paciente-servicios.dto.js";
import {
  mapPaginatedPacienteServicios,
  mapPacienteServicioToDto,
} from "./paciente-servicios.mapper.js";
import { PERIODOS_CONTROL } from "../../shared/constants/periodo-control.js";
import type { PeriodoControl } from "../../shared/constants/periodo-control.js";
import { PACIENTE_SERVICIO_ESTADO } from "../../shared/constants/paciente-servicio-estado.js";
import { obtenerVentanaTemporal } from "../../shared/paciente-servicio/obtenerVentanaTemporal.js";
import { asDisponibilidadDto } from "../../shared/paciente-servicio/asDisponibilidadDto.js";
import {
  camposAsignacionFaltantes,
  resolveAsignacionCamposParaRelevo,
} from "../../shared/servicio/reglasAsignacion.js";
import {
  normalizarCoberturaDiaria,
  validarCoberturaDiaria,
} from "../../shared/paciente-servicio/coberturaDiaria.js";

function resolvePrestadorIdsFromInput(input: {
  prestadorId?: number | null | undefined;
  prestadorIds?: number[] | undefined;
}): number[] | undefined {
  if (input.prestadorIds !== undefined) {
    return [...new Set(input.prestadorIds)];
  }
  if (input.prestadorId != null) {
    return [input.prestadorId];
  }
  return undefined;
}

function isPeriodoControl(value: string): value is PeriodoControl {
  return (PERIODOS_CONTROL as readonly string[]).includes(value);
}

export class PacienteServiciosService {
  constructor(private readonly repository: PacienteServiciosRepository) {}

  async list(query: ListPacienteServiciosQuery): Promise<PaginatedPacienteServiciosDto> {
    const result = await this.repository.findPaginated(query.page, query.pageSize, {
      pacienteId: query.pacienteId,
      servicioId: query.servicioId,
      estado: query.estado,
    });
    return mapPaginatedPacienteServicios(result);
  }

  async getById(id: number): Promise<PacienteServicioDto> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw AppError.notFound("Asignación paciente-servicio no encontrada");
    }
    return mapPacienteServicioToDto(row);
  }

  /**
   * Conteo de visitas en la ventana del período actual (día local, semana dominical o mes calendario).
   */
  async getDisponibilidad(
    pacienteServicioId: number,
    referencia: Date = new Date(),
  ): Promise<PacienteServicioDisponibilidadDto> {
    const ps = await this.repository.findParaDisponibilidad(pacienteServicioId);
    if (!ps) {
      throw AppError.notFound("Asignación paciente-servicio no encontrada");
    }
    if (!isPeriodoControl(ps.periodoControl)) {
      throw AppError.badRequest(`Valor de periodoControl no soportado: ${ps.periodoControl}`);
    }
    const periodoControl = ps.periodoControl;
    const { inicio, fin } = obtenerVentanaTemporal(periodoControl, referencia);
    const cantidadUtilizada = await this.repository.countVisitasEnVentana(ps.id, inicio, fin);
    return asDisponibilidadDto({
      pacienteServicioId: ps.id,
      periodoControl,
      cantidadPermitida: ps.cantidadPermitida,
      cantidadUtilizada,
      inicio,
      fin,
    });
  }

  async create(input: CreatePacienteServicioInput): Promise<PacienteServicioDto> {
    await this.validatePaciente(input.pacienteId);
    const servicio = await this.validateServicio(input.servicioId);
    const prestadorIds = resolvePrestadorIdsFromInput(input) ?? [];

    if (servicio.modoRelevo && prestadorIds.length === 0) {
      throw AppError.badRequest(
        "En servicios con modo relevo debe indicar al menos un prestador en prestadorIds.",
      );
    }

    for (const prestadorId of prestadorIds) {
      await this.validatePrestadorParaServicio(prestadorId, input.servicioId);
    }

    const faltantes = camposAsignacionFaltantes(servicio, input);
    if (faltantes.length > 0) {
      throw AppError.badRequest(
        `Campos obligatorios para este servicio: ${faltantes.join(", ")}`,
      );
    }

    const camposResueltos = this.resolverCamposAsignacion(servicio, input);
    const coberturaDiaria = this.resolverCoberturaDiaria(servicio, input);

    this.validateModalidadPorHora(
      camposResueltos.modalidadCobro,
      camposResueltos.cantidadHoras,
      servicio.modoRelevo,
    );

    if (input.estado === PACIENTE_SERVICIO_ESTADO.ACTIVA) {
      await this.assertSinAsignacionActivaDuplicada(input.pacienteId, input.servicioId);
    }

    const usarTablaPuente = input.prestadorIds !== undefined;
    const prestadorId =
      usarTablaPuente || servicio.modoRelevo ? null : (input.prestadorId ?? null);

    const row = await this.repository.create({
      pacienteId: input.pacienteId,
      servicioId: input.servicioId,
      prestadorId,
      ...(usarTablaPuente || servicio.modoRelevo ? { prestadorIds } : {}),
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin ?? null,
      periodoControl: camposResueltos.periodoControl,
      cantidadPermitida: camposResueltos.cantidadPermitida,
      cantidadHoras: camposResueltos.cantidadHoras,
      modalidadCobro: camposResueltos.modalidadCobro,
      estado: input.estado,
      coberturaDiariaInicio: coberturaDiaria.coberturaDiariaInicio,
      coberturaDiariaFin: coberturaDiaria.coberturaDiariaFin,
    });

    return mapPacienteServicioToDto(row);
  }

  async update(id: number, input: UpdatePacienteServicioInput): Promise<PacienteServicioDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw AppError.notFound("Asignación paciente-servicio no encontrada");
    }

    if (input.pacienteId !== undefined) {
      await this.validatePaciente(input.pacienteId);
    }

    const pacienteId = input.pacienteId ?? existing.pacienteId;
    const servicioId = input.servicioId ?? existing.servicioId;
    const servicio = await this.validateServicio(servicioId);

    const prestadorIdsInput = resolvePrestadorIdsFromInput(input);
    if (prestadorIdsInput !== undefined) {
      if (servicio.modoRelevo && prestadorIdsInput.length === 0) {
        throw AppError.badRequest(
          "En servicios con modo relevo debe indicar al menos un prestador en prestadorIds.",
        );
      }
      for (const prestadorId of prestadorIdsInput) {
        await this.validatePrestadorParaServicio(prestadorId, servicioId);
      }
    } else if (input.prestadorId != null) {
      await this.validatePrestadorParaServicio(input.prestadorId, servicioId);
    } else if (
      input.prestadorId === undefined &&
      input.servicioId !== undefined &&
      existing.prestadorId != null
    ) {
      await this.validatePrestadorParaServicio(existing.prestadorId, servicioId);
    }

    await this.validateCupoTrasCambioReglas(existing, input, servicio.modoRelevo);

    const estado = input.estado ?? existing.estado;
    const camposResueltos = this.resolverCamposAsignacion(servicio, {
      periodoControl:
        input.periodoControl ?? (servicio.modoRelevo ? undefined : existing.periodoControl),
      cantidadPermitida:
        input.cantidadPermitida ??
        (servicio.modoRelevo ? undefined : existing.cantidadPermitida),
      modalidadCobro:
        input.modalidadCobro ?? (servicio.modoRelevo ? undefined : existing.modalidadCobro),
      cantidadHoras:
        input.cantidadHoras !== undefined
          ? input.cantidadHoras
          : servicio.modoRelevo
            ? undefined
            : existing.cantidadHoras,
    });

    const coberturaDiaria = this.resolverCoberturaDiaria(servicio, input, existing);

    this.validateModalidadPorHora(
      camposResueltos.modalidadCobro,
      camposResueltos.cantidadHoras,
      servicio.modoRelevo,
    );

    if (estado === PACIENTE_SERVICIO_ESTADO.ACTIVA) {
      await this.assertSinAsignacionActivaDuplicada(pacienteId, servicioId, id);
    }

    const usarTablaPuente = input.prestadorIds !== undefined;
    const prestadorIdUpdate =
      usarTablaPuente || servicio.modoRelevo
        ? null
        : input.prestadorId !== undefined
          ? input.prestadorId
          : undefined;

    const row = await this.repository.update(id, {
      ...(input.pacienteId !== undefined ? { pacienteId: input.pacienteId } : {}),
      ...(input.servicioId !== undefined ? { servicioId: input.servicioId } : {}),
      ...(prestadorIdUpdate !== undefined ? { prestadorId: prestadorIdUpdate } : {}),
      ...(usarTablaPuente ? { prestadorIds: prestadorIdsInput ?? [] } : {}),
      ...(input.fechaInicio !== undefined ? { fechaInicio: input.fechaInicio } : {}),
      ...(input.fechaFin !== undefined ? { fechaFin: input.fechaFin } : {}),
      ...(servicio.modoRelevo || input.periodoControl !== undefined
        ? { periodoControl: camposResueltos.periodoControl }
        : {}),
      ...(servicio.modoRelevo || input.cantidadPermitida !== undefined
        ? { cantidadPermitida: camposResueltos.cantidadPermitida }
        : {}),
      ...(servicio.modoRelevo || input.cantidadHoras !== undefined
        ? { cantidadHoras: camposResueltos.cantidadHoras }
        : {}),
      ...(servicio.modoRelevo || input.modalidadCobro !== undefined
        ? { modalidadCobro: camposResueltos.modalidadCobro }
        : {}),
      ...(input.coberturaDiariaInicio !== undefined ||
      input.coberturaDiariaFin !== undefined ||
      servicio.modoRelevo
        ? {
            coberturaDiariaInicio: coberturaDiaria.coberturaDiariaInicio,
            coberturaDiariaFin: coberturaDiaria.coberturaDiariaFin,
          }
        : {}),
      ...(input.estado !== undefined ? { estado: input.estado } : {}),
    });

    return mapPacienteServicioToDto(row);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw AppError.notFound("Asignación paciente-servicio no encontrada");
    }

    const visitas = await this.repository.countVisitas(id);
    if (visitas > 0) {
      throw AppError.conflict(
        "No se puede eliminar porque tiene visitas registradas",
      );
    }

    await this.repository.delete(id);
  }

  private async validatePaciente(pacienteId: number): Promise<void> {
    const exists = await this.repository.pacienteExists(pacienteId);
    if (!exists) {
      throw AppError.notFound("Paciente no encontrado");
    }
  }

  private async validateServicio(
    servicioId: number,
  ): Promise<{ id: number; estado: boolean; controlHorario: boolean; modoRelevo: boolean }> {
    const servicio = await this.repository.findServicioById(servicioId);
    if (!servicio) {
      throw AppError.notFound("Servicio no encontrado");
    }
    if (!servicio.estado) {
      throw AppError.badRequest("El servicio no está activo.");
    }
    return servicio;
  }

  private resolverCamposAsignacion(
    servicio: { controlHorario: boolean; modoRelevo: boolean },
    input: {
      periodoControl?: string | undefined;
      cantidadPermitida?: number | undefined;
      modalidadCobro?: string | undefined;
      cantidadHoras?: number | null | undefined;
    },
  ): {
    periodoControl: string;
    cantidadPermitida: number;
    modalidadCobro: string;
    cantidadHoras: number | null;
  } {
    const relevo = resolveAsignacionCamposParaRelevo(servicio.modoRelevo);
    if (relevo) {
      return relevo;
    }

    return {
      periodoControl: input.periodoControl!,
      cantidadPermitida: input.cantidadPermitida!,
      modalidadCobro: input.modalidadCobro!,
      cantidadHoras: input.cantidadHoras ?? null,
    };
  }

  private resolverCoberturaDiaria(
    servicio: { modoRelevo: boolean },
    input: {
      coberturaDiariaInicio?: string | null | undefined;
      coberturaDiariaFin?: string | null | undefined;
    },
    existing?: {
      coberturaDiariaInicio: string | null;
      coberturaDiariaFin: string | null;
    },
  ): { coberturaDiariaInicio: string | null; coberturaDiariaFin: string | null } {
    if (!servicio.modoRelevo) {
      return { coberturaDiariaInicio: null, coberturaDiariaFin: null };
    }

    const inicio =
      input.coberturaDiariaInicio !== undefined
        ? input.coberturaDiariaInicio
        : (existing?.coberturaDiariaInicio ?? null);
    const fin =
      input.coberturaDiariaFin !== undefined
        ? input.coberturaDiariaFin
        : (existing?.coberturaDiariaFin ?? null);

    const error = validarCoberturaDiaria(inicio, fin);
    if (error) {
      throw AppError.badRequest(error);
    }

    return normalizarCoberturaDiaria(inicio, fin);
  }

  private validateModalidadPorHora(
    modalidadCobro: string,
    cantidadHoras: number | null | undefined,
    modoRelevo = false,
  ): void {
    if (modoRelevo) {
      return;
    }
    if (modalidadCobro === "por_hora" && (cantidadHoras == null || cantidadHoras < 1)) {
      throw AppError.badRequest(
        "La cantidad de horas es obligatoria y debe ser al menos 1 cuando la modalidad de cobro es por hora.",
      );
    }
  }

  private async assertSinAsignacionActivaDuplicada(
    pacienteId: number,
    servicioId: number,
    excludeId?: number,
  ): Promise<void> {
    const duplicada = await this.repository.findActivaByPacienteYServicio(
      pacienteId,
      servicioId,
      excludeId,
    );
    if (duplicada) {
      throw AppError.conflict("Este paciente ya tiene una asignación activa para ese servicio.");
    }
  }

  private async validateCupoTrasCambioReglas(
    existing: {
      id: number;
      periodoControl: string;
      cantidadPermitida: number;
      modalidadCobro: string;
    },
    input: UpdatePacienteServicioInput,
    modoRelevo = false,
  ): Promise<void> {
    if (modoRelevo) {
      return;
    }

    if (input.periodoControl === undefined && input.cantidadPermitida === undefined) {
      return;
    }

    if (existing.modalidadCobro === "por_hora") {
      return;
    }

    const periodoControl = input.periodoControl ?? existing.periodoControl;
    const cantidadPermitida = input.cantidadPermitida ?? existing.cantidadPermitida;

    if (!isPeriodoControl(periodoControl)) {
      throw AppError.badRequest(`Valor de periodoControl no soportado: ${periodoControl}`);
    }

    const { inicio, fin } = obtenerVentanaTemporal(periodoControl, new Date());
    const cantidadUtilizada = await this.repository.countVisitasEnVentana(existing.id, inicio, fin);

    if (cantidadUtilizada > cantidadPermitida) {
      throw AppError.conflict(
        `Ya hay ${cantidadUtilizada} visitas en el período ${periodoControl} actual; cantidadPermitida no puede ser menor`,
      );
    }
  }

  private async validatePrestadorParaServicio(
    prestadorId: number,
    servicioId: number,
  ): Promise<void> {
    const prestador = await this.repository.findPrestadorById(prestadorId);
    if (!prestador) {
      throw AppError.notFound("Prestador no encontrado");
    }
    if (!prestador.estado) {
      throw AppError.badRequest("El prestador no está activo.");
    }

    const tieneServicio = await this.repository.prestadorTieneServicio(prestadorId, servicioId);
    if (!tieneServicio) {
      throw AppError.badRequest("El prestador no está habilitado para ese servicio.");
    }
  }
}
