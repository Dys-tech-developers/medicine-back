/**
 * Días no laborables con fines turísticos (decreto anual del Poder Ejecutivo).
 * Actualizar al publicarse el calendario del año siguiente.
 */
const PUENTES_TURISTICOS_POR_ANIO: Readonly<Record<number, readonly string[]>> = {
  2026: ["2026-03-23", "2026-07-10", "2026-12-07"],
};

export function getPuentesTuristicosForYear(year: number): readonly string[] {
  return PUENTES_TURISTICOS_POR_ANIO[year] ?? [];
}
