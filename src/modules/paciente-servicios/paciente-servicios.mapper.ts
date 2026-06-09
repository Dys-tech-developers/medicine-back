import type { PacienteServicioDto, PaginatedPacienteServiciosDto } from "./paciente-servicios.dto.js";
import type { PaginatedPacienteServicios } from "./paciente-servicios.repository.js";
import type { PacienteServicioDetail } from "../../shared/prisma-includes/paciente-servicio.include.js";
import type { PacienteServicioEstado } from "../../shared/constants/paciente-servicio-estado.js";
import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import type { PeriodoControl } from "../../shared/constants/periodo-control.js";

export function mapPacienteServicioToDto(row: PacienteServicioDetail): PacienteServicioDto {
  return {
    id: row.id,
    pacienteId: row.pacienteId,
    servicioId: row.servicioId,
    prestadorId: row.prestadorId,
    fechaInicio: row.fechaInicio.toISOString(),
    fechaFin: row.fechaFin?.toISOString() ?? null,
    periodoControl: row.periodoControl as PeriodoControl,
    cantidadPermitida: row.cantidadPermitida,
    cantidadHoras: row.cantidadHoras ?? null,
    modalidadCobro: row.modalidadCobro as ModalidadCobro,
    estado: row.estado as PacienteServicioEstado,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    paciente: row.paciente,
    servicio: row.servicio,
    prestador: row.prestador
      ? {
          id: row.prestador.id,
          nombre: row.prestador.user.nombre,
          email: row.prestador.user.email,
        }
      : null,
  };
}

export function mapPaginatedPacienteServicios(
  result: PaginatedPacienteServicios,
): PaginatedPacienteServiciosDto {
  return {
    items: result.items.map(mapPacienteServicioToDto),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}
