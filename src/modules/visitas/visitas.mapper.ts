import type {
  VisitaDto,
  PaginatedVisitasDto,
  VisitaFinanzasDto,
  VisitaInsumoResumenDto,
} from "./visitas.dto.js";
import type { PaginatedVisitas } from "./visitas.repository.js";
import type { VisitaDetail } from "../../shared/prisma-includes/visita.include.js";
import type { VisitaFinanzas } from "@prisma/client";
import type { ModalidadCobro } from "../../shared/constants/modalidad-cobro.js";
import type { TipoDia, TipoJornada } from "../../shared/constants/tarifa.js";
import type { VisitaEstado } from "../../shared/constants/visita-estado.js";

function mapInsumosResumen(visita: VisitaDetail): VisitaInsumoResumenDto[] {
  return visita.insumos.map((row) => ({
    id: row.id,
    insumoId: row.insumoId,
    cantidad: row.cantidad,
    insumoNombre: row.insumo.nombre,
    insumoCodigo: row.insumo.codigo,
  }));
}

function mapFinanzasToDto(finanzas: VisitaFinanzas): VisitaFinanzasDto {
  return {
    id: finanzas.id,
    visitaId: finanzas.visitaId,
    modalidadCobro: finanzas.modalidadCobro as ModalidadCobro,
    tipoJornada: finanzas.tipoJornada as TipoJornada,
    tipoDia: finanzas.tipoDia as TipoDia,
    valorUnitario: finanzas.valorUnitario.toString(),
    valorAplicado: finanzas.valorAplicado.toString(),
    facturado: finanzas.facturado,
    pagado: finanzas.pagado,
    fechaFacturacion: finanzas.fechaFacturacion?.toISOString() ?? null,
    fechaPago: finanzas.fechaPago?.toISOString() ?? null,
    observaciones: finanzas.observaciones,
    createdAt: finanzas.createdAt.toISOString(),
    updatedAt: finanzas.updatedAt.toISOString(),
  };
}

export function mapVisitaToDto(visita: VisitaDetail): VisitaDto {
  return {
    id: visita.id,
    pacienteServicioId: visita.pacienteServicioId,
    prestadorId: visita.prestadorId,
    estado: visita.estado as VisitaEstado,
    fechaInicio: visita.fechaInicio.toISOString(),
    fechaFin: visita.fechaFin?.toISOString() ?? null,
    tiempoMinutos: visita.tiempoMinutos,
    observaciones: visita.observaciones,
    cierreAutomatico: visita.cierreAutomatico,
    cierrePorRelevo: visita.cierrePorRelevo,
    prestadorRelevoId: visita.prestadorRelevoId,
    createdAt: visita.createdAt.toISOString(),
    updatedAt: visita.updatedAt.toISOString(),
    pacienteServicio: {
      id: visita.pacienteServicio.id,
      estado: visita.pacienteServicio.estado,
      paciente: visita.pacienteServicio.paciente,
      servicio: visita.pacienteServicio.servicio,
    },
    prestador: {
      id: visita.prestador.id,
      nombre: visita.prestador.user.nombre,
      email: visita.prestador.user.email,
    },
    insumos: mapInsumosResumen(visita),
    finanzas: visita.finanzas ? mapFinanzasToDto(visita.finanzas) : null,
  };
}

export function mapPaginatedVisitas(result: PaginatedVisitas): PaginatedVisitasDto {
  return {
    items: result.items.map(mapVisitaToDto),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}
