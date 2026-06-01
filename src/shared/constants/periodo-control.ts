export const PERIODOS_CONTROL = ["diario", "semanal", "mensual"] as const;

export type PeriodoControl = (typeof PERIODOS_CONTROL)[number];
