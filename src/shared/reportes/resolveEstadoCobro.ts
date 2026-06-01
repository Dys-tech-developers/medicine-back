export type EstadoCobroVisita =
  | "pendiente_facturacion"
  | "facturado_pendiente_pago"
  | "pagado";

export function resolveEstadoCobro(facturado: boolean, pagado: boolean): EstadoCobroVisita {
  if (pagado) {
    return "pagado";
  }
  if (facturado) {
    return "facturado_pendiente_pago";
  }
  return "pendiente_facturacion";
}
