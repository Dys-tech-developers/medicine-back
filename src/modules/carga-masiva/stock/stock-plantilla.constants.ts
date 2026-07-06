export const STOCK_PLANTILLA_FILENAME = "stock_carga_masiva.xlsx";

export const STOCK_PLANTILLA_SHEET = "Stock";
export const STOCK_PLANTILLA_CATALOGOS_SHEET = "Catalogos";
export const STOCK_PLANTILLA_INSTRUCCIONES_SHEET = "Instrucciones";

export const STOCK_PLANTILLA_FIRST_DATA_ROW = 2;
export const STOCK_PLANTILLA_DATA_ROW_COUNT = 1000;

export const STOCK_PLANTILLA_BOOLEANOS = ["si", "no"] as const;

export const STOCK_PLANTILLA_UNIDADES_MEDIDA = [
  "unidad",
  "caja",
  "frasco",
  "bolsa",
  "par",
  "metro",
  "litro",
  "kg",
  "ml",
] as const;

export const STOCK_PLANTILLA_COLUMNAS = [
  "nombre",
  "descripcion",
  "codigo",
  "stock_actual",
  "stock_minimo",
  "unidad_medida",
  "requiere_vencimiento",
  "fecha_vencimiento",
  "estado",
] as const;
