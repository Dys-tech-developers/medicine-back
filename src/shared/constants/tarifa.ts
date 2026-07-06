export const TIPOS_JORNADA = ["diurno", "nocturno"] as const;
export const TIPOS_DIA = ["habil", "no_habil"] as const;

export type TipoJornada = (typeof TIPOS_JORNADA)[number];
export type TipoDia = (typeof TIPOS_DIA)[number];
