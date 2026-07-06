/** IDs de prestadores habilitados en la asignación (tabla puente o `prestadorId` legacy). */
export function resolvePrestadoresAsignadosIds(asignacion: {
  prestadorId: number | null;
  prestadoresAsignados: Array<{ prestadorId: number }>;
}): number[] {
  if (asignacion.prestadoresAsignados.length > 0) {
    return asignacion.prestadoresAsignados.map((row) => row.prestadorId);
  }
  if (asignacion.prestadorId != null) {
    return [asignacion.prestadorId];
  }
  return [];
}
