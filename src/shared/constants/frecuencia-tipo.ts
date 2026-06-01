export const FRECUENCIA_TIPOS = ["diaria", "semanal", "mensual", "por_horas"] as const;

export type FrecuenciaTipo = (typeof FRECUENCIA_TIPOS)[number];
