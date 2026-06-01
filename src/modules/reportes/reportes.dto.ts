import type { PeriodoControl } from "../../shared/constants/periodo-control.js";
import type { ResumenFinancieroDto } from "../../shared/reportes/mapResumenFinancieroRow.js";

export interface ReporteMetaDto {
  fechaDesde: string | null;
  fechaHasta: string | null;
  periodo: PeriodoControl | null;
  prestadorId: number | null;
  servicioId: number | null;
  facturado: boolean | null;
  pagado: boolean | null;
}

export interface ReportePrestadorItemDto {
  prestadorId: number;
  cantidadVisitas: number;
  horasTrabajadas: number;
  finanzas: ResumenFinancieroDto;
}

export interface ReporteServicioItemDto {
  servicioId: number;
  nombreServicio: string;
  cantidadVisitas: number;
  horasTotales: number;
  finanzas: ResumenFinancieroDto;
}

export interface ReportePrestadoresResponseDto {
  items: ReportePrestadorItemDto[];
  meta: ReporteMetaDto;
  resumen: ResumenFinancieroDto;
}

export interface ReporteServiciosResponseDto {
  items: ReporteServicioItemDto[];
  meta: ReporteMetaDto;
  resumen: ResumenFinancieroDto;
}

export interface ReporteVisitaFinanzasItemDto {
  valorAplicado: string;
  facturado: boolean;
  pagado: boolean;
  fechaFacturacion: string | null;
  fechaPago: string | null;
  estadoCobro: "pendiente_facturacion" | "facturado_pendiente_pago" | "pagado";
}

export interface ReporteVisitaItemDto {
  id: number;
  fechaInicio: string;
  tiempoMinutos: number;
  horas: number;
  prestadorId: number;
  prestadorNombre: string;
  servicioId: number;
  servicioNombre: string;
  pacienteId: number;
  pacienteNombre: string;
  pacienteApellido: string;
  finanzas: ReporteVisitaFinanzasItemDto;
}

export interface ReporteVisitasResponseDto {
  items: ReporteVisitaItemDto[];
  total: number;
  page: number;
  pageSize: number;
  meta: ReporteMetaDto;
  resumen: ResumenFinancieroDto;
}
