export const REGIMENES_IVA = [
  "monotributo",
  "responsable_inscripto",
  "exento",
] as const;

export type RegimenIva = (typeof REGIMENES_IVA)[number];
