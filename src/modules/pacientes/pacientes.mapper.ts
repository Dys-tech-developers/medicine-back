import type { ObraSocial } from "@prisma/client";
import type {
  PacienteDto,
  PacienteListItemDto,
  PacienteObraSocialDto,
  PacienteServicioAsignadoDto,
  PaginatedPacientesDto,
  PrestadorAsignadoResumenDto,
} from "./pacientes.dto.js";
import type { PaginatedPacientes } from "./pacientes.repository.js";
import type {
  PacienteDetailRow,
  PacienteListRow,
  PacienteWithObraSocialRow,
} from "../../shared/prisma-includes/paciente.include.js";
import type { PacienteServicioEstado } from "../../shared/constants/paciente-servicio-estado.js";
import { PACIENTE_SERVICIO_ESTADO } from "../../shared/constants/paciente-servicio-estado.js";
import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import type { PeriodoControl } from "../../shared/constants/periodo-control.js";
import { mapTarifasPorModalidadCobro } from "../../shared/servicio/tarifasPorModalidad.js";
import { buildReglasAsignacion } from "../../shared/servicio/reglasAsignacion.js";

function mapPrestadoresAsignados(
  asignacion: PacienteDetailRow["servicios"][number],
): PrestadorAsignadoResumenDto[] {
  if (asignacion.prestadoresAsignados.length > 0) {
    return asignacion.prestadoresAsignados.map((link) => ({
      id: link.prestador.id,
      nombre: link.prestador.user.nombre,
    }));
  }

  if (asignacion.prestador) {
    return [
      {
        id: asignacion.prestador.id,
        nombre: asignacion.prestador.user.nombre,
      },
    ];
  }

  return [];
}

function mapServiciosAsignados(row: PacienteDetailRow): PacienteServicioAsignadoDto[] {
  return row.servicios.map((asignacion) => ({
    pacienteServicioId: asignacion.id,
    servicioId: asignacion.servicio.id,
    servicioNombre: asignacion.servicio.nombre,
    controlHorario: asignacion.servicio.controlHorario,
    modoRelevo: asignacion.servicio.modoRelevo,
    reglasAsignacion: buildReglasAsignacion(asignacion.servicio),
    prestadoresAsignados: mapPrestadoresAsignados(asignacion),
    coberturaDiariaInicio: asignacion.coberturaDiariaInicio,
    coberturaDiariaFin: asignacion.coberturaDiariaFin,
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
): Omit<
  PacienteListItemDto,
  "tieneHistoriaClinica" | "serviciosActivosCount" | "serviciosActivosNombres"
> {
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
    localidad: paciente.localidad,
    numeroAfiliado: paciente.numeroAfiliado,
    createdAt: paciente.createdAt.toISOString(),
  };
}

export function mapPacienteToListItem(paciente: PacienteListRow): PacienteListItemDto {
  return {
    ...mapPacienteBaseFields(paciente),
    tieneHistoriaClinica: paciente.historiaClinica !== null,
    serviciosActivosCount: paciente._count.servicios,
    serviciosActivosNombres: paciente.servicios.map((asignacion) => asignacion.servicio.nombre),
  };
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
  const serviciosActivos = paciente.servicios.filter(
    (asignacion) => asignacion.estado === PACIENTE_SERVICIO_ESTADO.ACTIVA,
  );

  return {
    ...mapPacienteBaseFields(paciente),
    updatedAt: paciente.updatedAt.toISOString(),
    qrDataUrl,
    servicios: mapServiciosAsignados(paciente),
    tieneHistoriaClinica: paciente.historiaClinica !== null,
    serviciosActivosCount: serviciosActivos.length,
    serviciosActivosNombres: serviciosActivos.slice(0, 3).map((a) => a.servicio.nombre),
  };
}
