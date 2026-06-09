export const PRESTADORES_PLANTILLA_FILENAME = "prestadores_carga_masiva.xlsx";

export const PRESTADORES_PLANTILLA_SHEET = "Prestadores";
export const PRESTADORES_PLANTILLA_CATALOGOS_SHEET = "Catalogos";
export const PRESTADORES_PLANTILLA_INSTRUCCIONES_SHEET = "Instrucciones";

export const PRESTADORES_PLANTILLA_FIRST_DATA_ROW = 2;
export const PRESTADORES_PLANTILLA_DATA_ROW_COUNT = 1000;

export const PRESTADORES_SERVICIO_SIN_ASIGNAR = "sin asignar";

export const PRESTADORES_PLANTILLA_COLUMNAS = [
  "nombre",
  "email",
  "password",
  "telefono",
  "lugar_residencia",
  "documento",
  "matricula",
  "cuit",
  "cbu",
  "regimen_iva",
  "servicio_habilitado",
] as const;
