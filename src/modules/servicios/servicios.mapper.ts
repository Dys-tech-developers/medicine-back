import type { Servicio } from "@prisma/client";
import type {
  PaginatedServiciosDto,
  ServicioConTarifasDto,
  ServicioDto,
  ServicioPacienteAsignadoDto,
} from "./servicios.dto.js";
import type { PacienteServicioEstado } from "../../shared/constants/paciente-servicio-estado.js";
import type { PaginatedServicios, ServicioWithTarifas } from "./servicios.repository.js";
import type { ServicioWithTarifasRow } from "../../shared/prisma-includes/servicio.include.js";
import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import type { PeriodoControl } from "../../shared/constants/periodo-control.js";
import { mapServicioTarifaToDto } from "../servicio-tarifas/servicio-tarifas.mapper.js";
import { mapTarifasPorModalidadCobro } from "../../shared/servicio/tarifasPorModalidad.js";

export function mapServicioToDto(servicio: Servicio): ServicioDto {
  return {
    id: servicio.id,
    nombre: servicio.nombre,
    descripcion: servicio.descripcion,
    estado: servicio.estado,
    createdAt: servicio.createdAt.toISOString(),
  };
}

function mapPacienteAsignado(
  row: ServicioWithTarifasRow["pacienteServicios"][number],
  tarifasServicio: ServicioWithTarifasRow["tarifas"],
): ServicioPacienteAsignadoDto {
  return {
    pacienteServicioId: row.id,
    pacienteId: row.paciente.id,
    nombre: row.paciente.nombre,
    apellido: row.paciente.apellido,
    numeroDocumento: row.paciente.numeroDocumento,
    codigoQr: row.paciente.codigoQr,
    modalidadCobro: row.modalidadCobro as ModalidadCobro,
    periodoControl: row.periodoControl as PeriodoControl,
    cantidadPermitida: row.cantidadPermitida,
    cantidadHoras: row.cantidadHoras ?? null,
    estado: row.estado as PacienteServicioEstado,
    fechaInicio: row.fechaInicio.toISOString(),
    fechaFin: row.fechaFin?.toISOString() ?? null,
    tarifas: mapTarifasPorModalidadCobro(tarifasServicio, row.modalidadCobro),
  };
}

export function mapServicioConTarifasToDto(result: ServicioWithTarifas): ServicioConTarifasDto {
  return {
    ...mapServicioToDto(result.servicio),
    tarifas: result.tarifas.map(mapServicioTarifaToDto),
    pacientes: [],
  };
}

export function mapServicioWithTarifasRowToDto(row: ServicioWithTarifasRow): ServicioConTarifasDto {
  return {
    ...mapServicioToDto(row),
    tarifas: row.tarifas.map(mapServicioTarifaToDto),
    pacientes: row.pacienteServicios.map((ps) => mapPacienteAsignado(ps, row.tarifas)),
  };
}

export function mapPaginatedServicios(result: PaginatedServicios): PaginatedServiciosDto {
  return {
    items: result.items.map(mapServicioWithTarifasRowToDto),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}
