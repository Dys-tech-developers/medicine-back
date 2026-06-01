export const MODALIDADES_COBRO = ["por_servicio", "por_hora", "por_dia"] as const;

export type ModalidadCobro = (typeof MODALIDADES_COBRO)[number];
