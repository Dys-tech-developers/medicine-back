const MINUTOS_POR_HORA = 60;
const DECIMALES_HORAS = 2;
const DECIMALES_MONTO = 2;

export function minutosAHoras(tiempoMinutos: number): number {
  const horas = tiempoMinutos / MINUTOS_POR_HORA;
  const factor = 10 ** DECIMALES_HORAS;
  return Math.round(horas * factor) / factor;
}

export function formatMontoReporte(valor: number | string | bigint | null | undefined): string {
  const n = Number(valor ?? 0);
  if (!Number.isFinite(n)) {
    return "0.00";
  }
  return n.toFixed(DECIMALES_MONTO);
}

export function toNumberAgregado(valor: number | string | bigint | null | undefined): number {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}
