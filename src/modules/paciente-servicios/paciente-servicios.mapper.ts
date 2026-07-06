import type {
  PacienteServicioDto,
  PacienteServicioPrestadorResumenDto,
  PaginatedPacienteServiciosDto,
} from "./paciente-servicios.dto.js";
import type { PaginatedPacienteServicios } from "./paciente-servicios.repository.js";
import type { PacienteServicioDetail } from "../../shared/prisma-includes/paciente-servicio.include.js";
import type { PacienteServicioEstado } from "../../shared/constants/paciente-servicio-estado.js";
import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import type { PeriodoControl } from "../../shared/constants/periodo-control.js";
import { resolvePrestadoresAsignadosIds } from "../../shared/paciente-servicio/resolvePrestadoresAsignados.js";
import { buildReglasAsignacion } from "../../shared/servicio/reglasAsignacion.js";

function mapPrestadorResumen(
  prestador: PacienteServicioDetail["prestador"],
): PacienteServicioPrestadorResumenDto | null {
  if (!prestador) {
    return null;
  }
  return {
    id: prestador.id,
    nombre: prestador.user.nombre,
    email: prestador.user.email,
  };
}

function mapPrestadoresAsignados(
  row: PacienteServicioDetail,
): PacienteServicioPrestadorResumenDto[] {
  if (row.prestadoresAsignados.length > 0) {
    return row.prestadoresAsignados.map((link) => ({
      id: link.prestador.id,
      nombre: link.prestador.user.nombre,
      email: link.prestador.user.email,
    }));
  }

  const legacy = mapPrestadorResumen(row.prestador);
  return legacy ? [legacy] : [];
}

export function mapPacienteServicioToDto(row: PacienteServicioDetail): PacienteServicioDto {
  const prestadoresAsignados = mapPrestadoresAsignados(row);
  const prestadorIds = resolvePrestadoresAsignadosIds(row);

  return {
    id: row.id,
    pacienteId: row.pacienteId,
    servicioId: row.servicioId,
    prestadorId: row.prestadorId,
    prestadorIds,
    fechaInicio: row.fechaInicio.toISOString(),
    fechaFin: row.fechaFin?.toISOString() ?? null,
    periodoControl: row.periodoControl as PeriodoControl,
    cantidadPermitida: row.cantidadPermitida,
    cantidadHoras: row.cantidadHoras ?? null,
    modalidadCobro: row.modalidadCobro as ModalidadCobro,
    estado: row.estado as PacienteServicioEstado,
    coberturaDiariaInicio: row.coberturaDiariaInicio,
    coberturaDiariaFin: row.coberturaDiariaFin,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    paciente: row.paciente,
    servicio: {
      ...row.servicio,
      reglasAsignacion: buildReglasAsignacion(row.servicio),
    },
    prestador: mapPrestadorResumen(row.prestador),
    prestadoresAsignados,
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
