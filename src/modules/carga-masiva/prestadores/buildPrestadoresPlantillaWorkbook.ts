import ExcelJS from "exceljs";
import type { Worksheet } from "exceljs";
import { REGIMENES_IVA } from "../../../shared/constants/regimen-iva.js";
import {
  PRESTADORES_PLANTILLA_CATALOGOS_SHEET,
  PRESTADORES_PLANTILLA_COLUMNAS,
  PRESTADORES_PLANTILLA_DATA_ROW_COUNT,
  PRESTADORES_PLANTILLA_FIRST_DATA_ROW,
  PRESTADORES_PLANTILLA_INSTRUCCIONES_SHEET,
  PRESTADORES_PLANTILLA_SHEET,
  PRESTADORES_SERVICIO_SIN_ASIGNAR,
} from "./prestadores-plantilla.constants.js";

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

export interface PrestadoresPlantillaCatalogos {
  servicios: string[];
}

function catalogRange(column: string, itemCount: number, startRow = 2): string {
  const endRow = startRow + itemCount - 1;
  return `${PRESTADORES_PLANTILLA_CATALOGOS_SHEET}!$${column}$${startRow}:$${column}$${endRow}`;
}

function addListValidation(
  sheet: ExcelJS.Worksheet,
  columnLetter: string,
  formulae: string[],
): void {
  const firstRow = PRESTADORES_PLANTILLA_FIRST_DATA_ROW;
  const lastRow = firstRow + PRESTADORES_PLANTILLA_DATA_ROW_COUNT - 1;
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
  catalogos: PrestadoresPlantillaCatalogos,
): void {
  const sheet = workbook.addWorksheet(PRESTADORES_PLANTILLA_CATALOGOS_SHEET);
  sheet.state = "veryHidden";

  sheet.getCell("A1").value = "regimen_iva";
  sheet.getCell("B1").value = "servicio_habilitado";

  const serviciosHabilitados = [PRESTADORES_SERVICIO_SIN_ASIGNAR, ...catalogos.servicios];
  const maxRows = Math.max(REGIMENES_IVA.length, serviciosHabilitados.length);

  for (let i = 0; i < maxRows; i++) {
    const row = i + 2;
    const regimenIva = REGIMENES_IVA[i];
    const servicio = serviciosHabilitados[i];

    if (regimenIva !== undefined) {
      sheet.getCell(`A${row}`).value = regimenIva;
    }
    if (servicio !== undefined) {
      sheet.getCell(`B${row}`).value = servicio;
    }
  }
}

function buildInstruccionesSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet(PRESTADORES_PLANTILLA_INSTRUCCIONES_SHEET);
  sheet.getColumn(1).width = 95;

  const lines = [
    "Carga masiva de prestadores",
    "",
    "1. Completá las filas desde la fila 2 en adelante.",
    "2. Columnas con lista desplegable: regimen_iva, servicio_habilitado.",
    "3. servicio_habilitado: elegí un servicio activo o 'sin asignar'.",
    "4. Los prestadores se crean activos por defecto.",
    "5. password: mínimo 10 caracteres (contraseña inicial del usuario).",
    "6. No modifiques los encabezados ni la hoja Catalogos.",
  ];

  lines.forEach((line, index) => {
    sheet.getCell(`A${index + 1}`).value = line;
  });
}

function buildPrestadoresSheet(
  workbook: ExcelJS.Workbook,
  catalogos: PrestadoresPlantillaCatalogos,
): void {
  const sheet = workbook.addWorksheet(PRESTADORES_PLANTILLA_SHEET);
  const serviciosHabilitados = [PRESTADORES_SERVICIO_SIN_ASIGNAR, ...catalogos.servicios];

  PRESTADORES_PLANTILLA_COLUMNAS.forEach((header, index) => {
    const column = sheet.getColumn(index + 1);
    column.width =
      header === "lugar_residencia" || header === "email" || header === "cbu"
        ? 32
        : header === "password"
          ? 24
          : 18;
    sheet.getCell(1, index + 1).value = header;
  });

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };

  addListValidation(sheet, "J", [catalogRange("A", REGIMENES_IVA.length)]);
  addListValidation(sheet, "K", [catalogRange("B", serviciosHabilitados.length)]);

  sheet.views = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];
}

export async function buildPrestadoresPlantillaWorkbook(
  catalogos: PrestadoresPlantillaCatalogos,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "medicine-back";
  workbook.created = new Date();

  buildCatalogosSheet(workbook, catalogos);
  buildPrestadoresSheet(workbook, catalogos);
  buildInstruccionesSheet(workbook);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
