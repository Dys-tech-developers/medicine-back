export interface HistoriaClinicaContentFields {
  antecedentes?: string | null;
  diagnosticoInicial?: string | null;
  medicacion?: string | null;
  alergias?: string | null;
  observaciones?: string | null;
}

export function hasClinicalData(fields: HistoriaClinicaContentFields): boolean {
  return [
    fields.antecedentes,
    fields.diagnosticoInicial,
    fields.medicacion,
    fields.alergias,
    fields.observaciones,
  ].some((value) => typeof value === "string" && value.trim().length > 0);
}

export const HISTORIA_CLINICA_SIN_DATOS_MESSAGE =
  "Completá al menos un dato clínico: antecedentes, diagnóstico, medicación, alergias u observaciones.";
