/** Clave case-insensitive para deduplicar (trim + espacios colapsados + minúsculas). */
export function normalizeLocalidadKey(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Nombre persistido: trim y un solo espacio entre palabras. */
export function formatLocalidadNombre(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ");
}
