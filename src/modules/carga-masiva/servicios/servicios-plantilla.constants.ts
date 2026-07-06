export const SERVICIOS_PLANTILLA_FILENAME = "servicios_carga_masiva.xlsx";

export const SERVICIOS_PLANTILLA_SHEET = "Servicios";
export const SERVICIOS_PLANTILLA_CATALOGOS_SHEET = "Catalogos";
export const SERVICIOS_PLANTILLA_INSTRUCCIONES_SHEET = "Instrucciones";

export const SERVICIOS_PLANTILLA_FIRST_DATA_ROW = 2;
export const SERVICIOS_PLANTILLA_DATA_ROW_COUNT = 1000;

export const SERVICIOS_PLANTILLA_BOOLEANOS = ["si", "no"] as const;

export const SERVICIOS_PLANTILLA_COLUMNAS = [
  "nombre",
  "descripcion",
  "estado",
  "control_horario",
  "modo_relevo",
  "modalidad_cobro",
  "tipo_jornada",
  "tipo_dia",
  "valor",
] as const;
