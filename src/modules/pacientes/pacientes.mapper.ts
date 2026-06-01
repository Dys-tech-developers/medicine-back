import type { ObraSocial } from "@prisma/client";
import type {
  PacienteDto,
  PacienteListItemDto,
  PacienteObraSocialDto,
  PacienteServicioAsignadoDto,
  PaginatedPacientesDto,
} from "./pacientes.dto.js";
import type { PaginatedPacientes } from "./pacientes.repository.js";
import type {
  PacienteDetailRow,
  PacienteWithObraSocialRow,
} from "../../shared/prisma-includes/paciente.include.js";
import type { PacienteServicioEstado } from "../../shared/constants/paciente-servicio-estado.js";
import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import type { PeriodoControl } from "../../shared/constants/periodo-control.js";
import { mapTarifasPorModalidadCobro } from "../../shared/servicio/tarifasPorModalidad.js";

function mapServiciosAsignados(row: PacienteDetailRow): PacienteServicioAsignadoDto[] {
  return row.servicios.map((asignacion) => ({
    pacienteServicioId: asignacion.id,
    servicioId: asignacion.servicio.id,
    servicioNombre: asignacion.servicio.nombre,
    modalidadCobro: asignacion.modalidadCobro as ModalidadCobro,
    periodoControl: asignacion.periodoControl as PeriodoControl,
    cantidadPermitida: asignacion.cantidadPermitida,
    cantidadHoras: asignacion.cantidadHoras ?? null,
    estado: asignacion.estado as PacienteServicioEstado,
    fechaInicio: asignacion.fechaInicio.toISOString(),
    fechaFin: asignacion.fechaFin?.toISOString() ?? null,
    tarifas: mapTarifasPorModalidadCobro(asignacion.servicio.tarifas, asignacion.modalidadCobro),
  }));
}

function mapObraSocial(obraSocial: ObraSocial): PacienteObraSocialDto {
  return {
    id: obraSocial.id,
    nombre: obraSocial.nombre,
    codigo: obraSocial.codigo,
    estado: obraSocial.estado,
  };
}

function mapPacienteBaseFields(
  paciente: PacienteWithObraSocialRow | PacienteDetailRow,
): PacienteListItemDto {
  return {
    id: paciente.id,
    obraSocial: mapObraSocial(paciente.obraSocial),
    nombre: paciente.nombre,
    apellido: paciente.apellido,
    numeroDocumento: paciente.numeroDocumento,
    codigoQr: paciente.codigoQr,
    fechaNacimiento: paciente.fechaNacimiento.toISOString(),
    sexo: paciente.sexo,
    telefono: paciente.telefono,
    direccion: paciente.direccion,
    numeroAfiliado: paciente.numeroAfiliado,
    createdAt: paciente.createdAt.toISOString(),
  };
}

export function mapPacienteToListItem(paciente: PacienteWithObraSocialRow): PacienteListItemDto {
  return mapPacienteBaseFields(paciente);
}

export function mapPaginatedPacientes(result: PaginatedPacientes): PaginatedPacientesDto {
  return {
    items: result.items.map(mapPacienteToListItem),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}

export function mapPacienteToDto(paciente: PacienteDetailRow, qrDataUrl: string): PacienteDto {
  return {
    ...mapPacienteBaseFields(paciente),
    updatedAt: paciente.updatedAt.toISOString(),
    qrDataUrl,
    servicios: mapServiciosAsignados(paciente),
  };
}
