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
import { obtenerVentanaTemporal } from "../../shared/paciente-servicio/obtenerVentanaTemporal.js";
import { asDisponibilidadDto } from "../../shared/paciente-servicio/asDisponibilidadDto.js";

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
    await this.validateServicio(input.servicioId);

    const row = await this.repository.create({
      pacienteId: input.pacienteId,
      servicioId: input.servicioId,
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin ?? null,
      periodoControl: input.periodoControl,
      cantidadPermitida: input.cantidadPermitida,
      cantidadHoras: input.cantidadHoras ?? null,
      modalidadCobro: input.modalidadCobro,
      estado: input.estado,
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
    if (input.servicioId !== undefined) {
      await this.validateServicio(input.servicioId);
    }

    const row = await this.repository.update(id, {
      ...(input.pacienteId !== undefined ? { pacienteId: input.pacienteId } : {}),
      ...(input.servicioId !== undefined ? { servicioId: input.servicioId } : {}),
      ...(input.fechaInicio !== undefined ? { fechaInicio: input.fechaInicio } : {}),
      ...(input.fechaFin !== undefined ? { fechaFin: input.fechaFin } : {}),
      ...(input.periodoControl !== undefined ? { periodoControl: input.periodoControl } : {}),
      ...(input.cantidadPermitida !== undefined
        ? { cantidadPermitida: input.cantidadPermitida }
        : {}),
      ...(input.cantidadHoras !== undefined ? { cantidadHoras: input.cantidadHoras } : {}),
      ...(input.modalidadCobro !== undefined ? { modalidadCobro: input.modalidadCobro } : {}),
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

  private async validateServicio(servicioId: number): Promise<void> {
    const servicio = await this.repository.findServicioById(servicioId);
    if (!servicio) {
      throw AppError.notFound("Servicio no encontrado");
    }
    if (!servicio.estado) {
      throw AppError.conflict("El servicio está inactivo");
    }
  }
}
