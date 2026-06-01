import { formatMontoReporte, toNumberAgregado } from "./formatReporteMontos.js";

export interface RawResumenFinancieroRow {
  total_generado: number | string | null;
  pendiente_facturacion: number | string | null;
  facturado_pendiente_pago: number | string | null;
  pagado: number | string | null;
  cantidad_pendiente_facturacion: number | bigint | null;
  cantidad_facturado_pendiente_pago: number | bigint | null;
  cantidad_pagado: number | bigint | null;
}

export interface ResumenFinancieroDto {
  totalGenerado: string;
  pendienteFacturacion: string;
  facturadoPendientePago: string;
  pagado: string;
  cantidadPendienteFacturacion: number;
  cantidadFacturadoPendientePago: number;
  cantidadPagado: number;
}

export function mapResumenFinancieroRow(row: RawResumenFinancieroRow): ResumenFinancieroDto {
  return {
    totalGenerado: formatMontoReporte(row.total_generado),
    pendienteFacturacion: formatMontoReporte(row.pendiente_facturacion),
    facturadoPendientePago: formatMontoReporte(row.facturado_pendiente_pago),
    pagado: formatMontoReporte(row.pagado),
    cantidadPendienteFacturacion: toNumberAgregado(row.cantidad_pendiente_facturacion),
    cantidadFacturadoPendientePago: toNumberAgregado(row.cantidad_facturado_pendiente_pago),
    cantidadPagado: toNumberAgregado(row.cantidad_pagado),
  };
}
