import ExcelJS from "exceljs";
import type { Worksheet } from "exceljs";
import { MODALIDADES_COBRO } from "../../../shared/constants/modalidad-cobro.js";
import { TIPOS_DIA, TIPOS_JORNADA } from "../../../shared/constants/tarifa.js";
import {
  SERVICIOS_PLANTILLA_BOOLEANOS,
  SERVICIOS_PLANTILLA_CATALOGOS_SHEET,
  SERVICIOS_PLANTILLA_COLUMNAS,
  SERVICIOS_PLANTILLA_DATA_ROW_COUNT,
  SERVICIOS_PLANTILLA_FIRST_DATA_ROW,
  SERVICIOS_PLANTILLA_INSTRUCCIONES_SHEET,
  SERVICIOS_PLANTILLA_SHEET,
} from "./servicios-plantilla.constants.js";

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
  return `${SERVICIOS_PLANTILLA_CATALOGOS_SHEET}!$${column}$${startRow}:$${column}$${endRow}`;
}

function addListValidation(
  sheet: ExcelJS.Worksheet,
  columnLetter: string,
  formulae: string[],
  allowBlank = false,
): void {
  const firstRow = SERVICIOS_PLANTILLA_FIRST_DATA_ROW;
  const lastRow = firstRow + SERVICIOS_PLANTILLA_DATA_ROW_COUNT - 1;
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
  const sheet = workbook.addWorksheet(SERVICIOS_PLANTILLA_CATALOGOS_SHEET);
  sheet.state = "veryHidden";

  sheet.getCell("A1").value = "estado";
  sheet.getCell("B1").value = "control_horario";
  sheet.getCell("C1").value = "modo_relevo";
  sheet.getCell("D1").value = "modalidad_cobro";
  sheet.getCell("E1").value = "tipo_jornada";
  sheet.getCell("F1").value = "tipo_dia";

  const maxRows = Math.max(
    SERVICIOS_PLANTILLA_BOOLEANOS.length,
    MODALIDADES_COBRO.length,
    TIPOS_JORNADA.length,
    TIPOS_DIA.length,
  );

  for (let i = 0; i < maxRows; i++) {
    const row = i + 2;
    const booleano = SERVICIOS_PLANTILLA_BOOLEANOS[i];
    const modalidad = MODALIDADES_COBRO[i];
    const jornada = TIPOS_JORNADA[i];
    const dia = TIPOS_DIA[i];

    if (booleano !== undefined) {
      sheet.getCell(`A${row}`).value = booleano;
      sheet.getCell(`B${row}`).value = booleano;
      sheet.getCell(`C${row}`).value = booleano;
    }
    if (modalidad !== undefined) {
      sheet.getCell(`D${row}`).value = modalidad;
    }
    if (jornada !== undefined) {
      sheet.getCell(`E${row}`).value = jornada;
    }
    if (dia !== undefined) {
      sheet.getCell(`F${row}`).value = dia;
    }
  }
}

function buildInstruccionesSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet(SERVICIOS_PLANTILLA_INSTRUCCIONES_SHEET);
  sheet.getColumn(1).width = 100;

  const lines = [
    "Carga masiva de servicios",
    "",
    "1. Completá las filas desde la fila 2 en adelante.",
    "2. Repetí el mismo nombre en varias filas para cargar varias tarifas del mismo servicio.",
    "3. En filas adicionales del mismo servicio, los datos de descripción, estado, control_horario y modo_relevo deben coincidir con la primera fila del grupo.",
    "4. control_horario y modo_relevo no pueden ser 'si' al mismo tiempo.",
    "5. Cada combinación modalidad_cobro + tipo_jornada + tipo_dia debe ser única dentro del mismo servicio.",
    "6. estado, control_horario y modo_relevo: usá 'si' o 'no' (vacío = si para estado, no para control_horario y modo_relevo).",
    "7. No modifiques los encabezados ni la hoja Catalogos.",
  ];

  lines.forEach((line, index) => {
    sheet.getCell(`A${index + 1}`).value = line;
  });
}

function buildServiciosSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet(SERVICIOS_PLANTILLA_SHEET);

  SERVICIOS_PLANTILLA_COLUMNAS.forEach((header, index) => {
    const column = sheet.getColumn(index + 1);
    column.width =
      header === "descripcion"
        ? 36
        : header === "nombre"
          ? 24
          : header === "valor"
            ? 14
            : 18;
    sheet.getCell(1, index + 1).value = header;
  });

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };

  addListValidation(sheet, "C", [catalogRange("A", SERVICIOS_PLANTILLA_BOOLEANOS.length)], true);
  addListValidation(sheet, "D", [catalogRange("B", SERVICIOS_PLANTILLA_BOOLEANOS.length)], true);
  addListValidation(sheet, "E", [catalogRange("C", SERVICIOS_PLANTILLA_BOOLEANOS.length)], true);
  addListValidation(sheet, "F", [catalogRange("D", MODALIDADES_COBRO.length)]);
  addListValidation(sheet, "G", [catalogRange("E", TIPOS_JORNADA.length)]);
  addListValidation(sheet, "H", [catalogRange("F", TIPOS_DIA.length)]);

  sheet.views = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];
}

export async function buildServiciosPlantillaWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "medicine-back";
  workbook.created = new Date();

  buildCatalogosSheet(workbook);
  buildServiciosSheet(workbook);
  buildInstruccionesSheet(workbook);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
