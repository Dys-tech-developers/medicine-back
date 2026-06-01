import {
  formatMontoReporte,
  minutosAHoras,
  toNumberAgregado,
} from "./formatReporteMontos.js";
import {
  mapResumenFinancieroRow,
  type RawResumenFinancieroRow,
  type ResumenFinancieroDto,
} from "./mapResumenFinancieroRow.js";

export interface PrestadorEstadoCuentaDto {
  cantidadVisitas: number;
  horasTrabajadas: number;
  finanzas: ResumenFinancieroDto;
  montoPagado: string;
  montoPendiente: string;
}

const EMPTY_RESUMEN_ROW: RawResumenFinancieroRow = {
  total_generado: 0,
  pendiente_facturacion: 0,
  facturado_pendiente_pago: 0,
  pagado: 0,
  cantidad_pendiente_facturacion: 0,
  cantidad_facturado_pendiente_pago: 0,
  cantidad_pagado: 0,
};

export function computeMontoPendiente(finanzas: ResumenFinancieroDto): string {
  const total = Number(finanzas.totalGenerado);
  const pagado = Number(finanzas.pagado);
  return formatMontoReporte(total - pagado);
}

export function mapEstadoCuentaFromResumenRow(
  row: RawResumenFinancieroRow & { cantidad_visitas?: number | bigint | null; tiempo_minutos_total?: number | bigint | null },
): PrestadorEstadoCuentaDto {
  const tiempoMinutos = toNumberAgregado(row.tiempo_minutos_total);
  const finanzas = mapResumenFinancieroRow(row);

  return {
    cantidadVisitas: toNumberAgregado(row.cantidad_visitas),
    horasTrabajadas: minutosAHoras(tiempoMinutos),
    finanzas,
    montoPagado: finanzas.pagado,
    montoPendiente: computeMontoPendiente(finanzas),
  };
}

export function emptyEstadoCuentaPrestador(): PrestadorEstadoCuentaDto {
  return mapEstadoCuentaFromResumenRow({
    ...EMPTY_RESUMEN_ROW,
    cantidad_visitas: 0,
    tiempo_minutos_total: 0,
  });
}
