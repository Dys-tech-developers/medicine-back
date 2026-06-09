export const PACIENTES_PLANTILLA_FILENAME = "pacientes_carga_masiva.xlsx";

export const PACIENTES_PLANTILLA_SHEET = "Pacientes";
export const PACIENTES_PLANTILLA_CATALOGOS_SHEET = "Catalogos";
export const PACIENTES_PLANTILLA_INSTRUCCIONES_SHEET = "Instrucciones";

/** Primera fila editable (fila 1 = encabezados; desde fila 2 el operador carga). */
export const PACIENTES_PLANTILLA_FIRST_DATA_ROW = 2;

/** Cantidad de filas con validación de datos en la hoja Pacientes. */
export const PACIENTES_PLANTILLA_DATA_ROW_COUNT = 1000;

export const PACIENTES_PLANTILLA_COLUMNAS = [
  "obra_social",
  "nombre",
  "apellido",
  "numero_documento",
  "fecha_nacimiento",
  "sexo",
  "telefono",
  "direccion",
  "localidad",
  "numero_afiliado",
] as const;

export const PACIENTES_PLANTILLA_SEXOS = ["M", "F", "X"] as const;
