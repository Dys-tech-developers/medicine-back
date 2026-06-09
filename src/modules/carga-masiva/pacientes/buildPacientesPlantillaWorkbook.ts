import ExcelJS from "exceljs";
import type { Worksheet } from "exceljs";
import {
  PACIENTES_PLANTILLA_CATALOGOS_SHEET,
  PACIENTES_PLANTILLA_COLUMNAS,
  PACIENTES_PLANTILLA_DATA_ROW_COUNT,
  PACIENTES_PLANTILLA_FIRST_DATA_ROW,
  PACIENTES_PLANTILLA_INSTRUCCIONES_SHEET,
  PACIENTES_PLANTILLA_SEXOS,
  PACIENTES_PLANTILLA_SHEET,
} from "./pacientes-plantilla.constants.js";

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

export interface PacientesPlantillaCatalogos {
  obrasSociales: string[];
  localidades: string[];
}

function catalogRange(column: string, itemCount: number, startRow = 2): string {
  const endRow = startRow + itemCount - 1;
  return `${PACIENTES_PLANTILLA_CATALOGOS_SHEET}!$${column}$${startRow}:$${column}$${endRow}`;
}

function addListValidation(
  sheet: ExcelJS.Worksheet,
  columnLetter: string,
  formulae: string[],
): void {
  const firstRow = PACIENTES_PLANTILLA_FIRST_DATA_ROW;
  const lastRow = firstRow + PACIENTES_PLANTILLA_DATA_ROW_COUNT - 1;
  const range = `${columnLetter}${firstRow}:${columnLetter}${lastRow}`;

  (sheet as WorksheetWithValidations).dataValidations.add(range, {
    type: "list",
    allowBlank: false,
    formulae,
    showErrorMessage: true,
    errorTitle: "Valor no permitido",
    error: "Elegí un valor de la lista desplegable.",
  });
}

function buildCatalogosSheet(
  workbook: ExcelJS.Workbook,
  catalogos: PacientesPlantillaCatalogos,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(PACIENTES_PLANTILLA_CATALOGOS_SHEET);
  sheet.state = "veryHidden";

  sheet.getCell("A1").value = "obra_social";
  sheet.getCell("B1").value = "localidad";
  sheet.getCell("C1").value = "sexo";

  const maxRows = Math.max(
    catalogos.obrasSociales.length,
    catalogos.localidades.length,
    PACIENTES_PLANTILLA_SEXOS.length,
  );

  for (let i = 0; i < maxRows; i++) {
    const row = i + 2;
    const obraSocial = catalogos.obrasSociales[i];
    const localidad = catalogos.localidades[i];
    const sexo = PACIENTES_PLANTILLA_SEXOS[i];

    if (obraSocial !== undefined) {
      sheet.getCell(`A${row}`).value = obraSocial;
    }
    if (localidad !== undefined) {
      sheet.getCell(`B${row}`).value = localidad;
    }
    if (sexo !== undefined) {
      sheet.getCell(`C${row}`).value = sexo;
    }
  }

  return sheet;
}

function buildInstruccionesSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet(PACIENTES_PLANTILLA_INSTRUCCIONES_SHEET);
  sheet.getColumn(1).width = 90;

  const lines = [
    "Carga masiva de pacientes",
    "",
    "1. Completá las filas desde la fila 2 en adelante.",
    "2. Columnas con lista desplegable: obra_social, sexo, localidad.",
    "3. fecha_nacimiento: formato AAAA-MM-DD (ej. 1990-06-12).",
    "4. sexo: M, F o X.",
    "5. No modifiques los encabezados ni la hoja Catalogos.",
    "6. El código QR se genera automáticamente al importar el archivo.",
  ];

  lines.forEach((line, index) => {
    sheet.getCell(`A${index + 1}`).value = line;
  });
}

function buildPacientesSheet(
  workbook: ExcelJS.Workbook,
  catalogos: PacientesPlantillaCatalogos,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(PACIENTES_PLANTILLA_SHEET);

  PACIENTES_PLANTILLA_COLUMNAS.forEach((header, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = header === "direccion" ? 36 : header === "obra_social" ? 28 : 18;
    sheet.getCell(1, index + 1).value = header;
  });

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };

  addListValidation(sheet, "A", [catalogRange("A", catalogos.obrasSociales.length)]);
  addListValidation(sheet, "F", [catalogRange("C", PACIENTES_PLANTILLA_SEXOS.length)]);
  addListValidation(sheet, "I", [catalogRange("B", catalogos.localidades.length)]);

  sheet.views = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];

  return sheet;
}

export async function buildPacientesPlantillaWorkbook(
  catalogos: PacientesPlantillaCatalogos,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "medicine-back";
  workbook.created = new Date();

  buildCatalogosSheet(workbook, catalogos);
  buildPacientesSheet(workbook, catalogos);
  buildInstruccionesSheet(workbook);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
