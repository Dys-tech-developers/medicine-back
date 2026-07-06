import ExcelJS from "exceljs";
import type { Worksheet } from "exceljs";
import {
  STOCK_PLANTILLA_BOOLEANOS,
  STOCK_PLANTILLA_CATALOGOS_SHEET,
  STOCK_PLANTILLA_COLUMNAS,
  STOCK_PLANTILLA_DATA_ROW_COUNT,
  STOCK_PLANTILLA_FIRST_DATA_ROW,
  STOCK_PLANTILLA_INSTRUCCIONES_SHEET,
  STOCK_PLANTILLA_SHEET,
  STOCK_PLANTILLA_UNIDADES_MEDIDA,
} from "./stock-plantilla.constants.js";

interface ListDataValidation {
  type: "list";
  allowBlank: boolean;
  formulae: string[];
  showErrorMessage?: boolean;
  errorTitle?: string;
  error?: string;
}

interface WorksheetDataValidations {
  add(address: string, validation: ListDataValidation): void;
}

type WorksheetWithValidations = Worksheet & {
  dataValidations: WorksheetDataValidations;
};

function catalogRange(column: string, itemCount: number, startRow = 2): string {
  const endRow = startRow + itemCount - 1;
  return `${STOCK_PLANTILLA_CATALOGOS_SHEET}!$${column}$${startRow}:$${column}$${endRow}`;
}

function addListValidation(
  sheet: ExcelJS.Worksheet,
  columnLetter: string,
  formulae: string[],
  allowBlank = false,
): void {
  const firstRow = STOCK_PLANTILLA_FIRST_DATA_ROW;
  const lastRow = firstRow + STOCK_PLANTILLA_DATA_ROW_COUNT - 1;
  const range = `${columnLetter}${firstRow}:${columnLetter}${lastRow}`;

  (sheet as WorksheetWithValidations).dataValidations.add(range, {
    type: "list",
    allowBlank,
    formulae,
    showErrorMessage: true,
    errorTitle: "Valor no permitido",
    error: "Elegí un valor de la lista desplegable.",
  });
}

function buildCatalogosSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet(STOCK_PLANTILLA_CATALOGOS_SHEET);
  sheet.state = "veryHidden";

  sheet.getCell("A1").value = "unidad_medida";
  sheet.getCell("B1").value = "requiere_vencimiento";
  sheet.getCell("C1").value = "estado";

  const maxRows = Math.max(
    STOCK_PLANTILLA_UNIDADES_MEDIDA.length,
    STOCK_PLANTILLA_BOOLEANOS.length,
  );

  for (let i = 0; i < maxRows; i++) {
    const row = i + 2;
    const unidad = STOCK_PLANTILLA_UNIDADES_MEDIDA[i];
    const booleano = STOCK_PLANTILLA_BOOLEANOS[i];

    if (unidad !== undefined) {
      sheet.getCell(`A${row}`).value = unidad;
    }
    if (booleano !== undefined) {
      sheet.getCell(`B${row}`).value = booleano;
      sheet.getCell(`C${row}`).value = booleano;
    }
  }
}

function buildInstruccionesSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet(STOCK_PLANTILLA_INSTRUCCIONES_SHEET);
  sheet.getColumn(1).width = 100;

  const lines = [
    "Carga masiva de stock (insumos)",
    "",
    "1. Completá las filas desde la fila 2 en adelante.",
    "2. codigo debe ser único por insumo.",
    "3. stock_actual y stock_minimo: enteros mayores o iguales a 0 (vacío = 0).",
    "4. requiere_vencimiento y estado: usá 'si' o 'no' (vacío = no para vencimiento, si para estado).",
    "5. Si requiere_vencimiento es 'si', completá fecha_vencimiento en formato AAAA-MM-DD.",
    "6. No modifiques los encabezados ni la hoja Catalogos.",
  ];

  lines.forEach((line, index) => {
    sheet.getCell(`A${index + 1}`).value = line;
  });
}

function buildStockSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet(STOCK_PLANTILLA_SHEET);

  STOCK_PLANTILLA_COLUMNAS.forEach((header, index) => {
    const column = sheet.getColumn(index + 1);
    column.width =
      header === "descripcion"
        ? 36
        : header === "nombre"
          ? 28
          : header === "fecha_vencimiento"
            ? 20
            : 18;
    sheet.getCell(1, index + 1).value = header;
  });

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };

  addListValidation(sheet, "F", [catalogRange("A", STOCK_PLANTILLA_UNIDADES_MEDIDA.length)]);
  addListValidation(sheet, "G", [catalogRange("B", STOCK_PLANTILLA_BOOLEANOS.length)], true);
  addListValidation(sheet, "I", [catalogRange("C", STOCK_PLANTILLA_BOOLEANOS.length)], true);

  sheet.views = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];
}

export async function buildStockPlantillaWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "medicine-back";
  workbook.created = new Date();

  buildCatalogosSheet(workbook);
  buildStockSheet(workbook);
  buildInstruccionesSheet(workbook);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
