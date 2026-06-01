export const PACIENTE_SERVICIO_ESTADOS = ["activa", "suspendida", "finalizada"] as const;

export type PacienteServicioEstado = (typeof PACIENTE_SERVICIO_ESTADOS)[number];

export const PACIENTE_SERVICIO_ESTADO = {
  ACTIVA: "activa",
  SUSPENDIDA: "suspendida",
  FINALIZADA: "finalizada",
} as const satisfies Record<string, PacienteServicioEstado>;
