export const VISITA_ESTADOS = ["iniciada", "finalizada", "cancelada"] as const;

export type VisitaEstado = (typeof VISITA_ESTADOS)[number];

export const VISITA_ESTADO = {
  INICIADA: "iniciada",
  FINALIZADA: "finalizada",
  CANCELADA: "cancelada",
} as const satisfies Record<string, VisitaEstado>;

/** Estados que consumen cupo en el período de control. */
export const VISITA_ESTADOS_CUENTAN_CUPO: VisitaEstado[] = [
  VISITA_ESTADO.INICIADA,
  VISITA_ESTADO.FINALIZADA,
];
