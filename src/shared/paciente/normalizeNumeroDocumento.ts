/** Normaliza DNI/documento: trim y quita espacios y puntos. */
export function normalizeNumeroDocumento(value: string): string {
  return value.trim().replace(/[\s.]/g, "");
}
