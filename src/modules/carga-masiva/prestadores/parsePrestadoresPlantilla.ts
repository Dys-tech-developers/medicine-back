import ExcelJS from "exceljs";
import type { CellValue } from "exceljs";
import { AppError } from "../../../core/errors/AppError.js";
import {
  PRESTADORES_PLANTILLA_COLUMNAS,
  PRESTADORES_PLANTILLA_DATA_ROW_COUNT,
  PRESTADORES_PLANTILLA_FIRST_DATA_ROW,
  PRESTADORES_PLANTILLA_SHEET,
} from "./prestadores-plantilla.constants.js";

export interface PrestadorPlantillaRawRow {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  lugarResidencia: string;
  documento: string;
  matricula: string;
  cuit: string;
  cbu: string;
  regimenIva: string;
  servicioHabilitado: string;
}

export interface PrestadorPlantillaParsedRow {
  fila: number;
  values: PrestadorPlantillaRawRow;
}

function cellToString(value: CellValue | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    if ("result" in value && value.result !== undefined && value.result !== null) {
      return cellToString(value.result as CellValue);
    }
    if ("text" in value && value.text !== undefined) {
      return String(value.text).trim();
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("").trim();
    }
  }

  return String(value).trim();
}

function isRowEmpty(values: string[]): boolean {
  return values.every((value) => value.length === 0);
}

function readHeaders(sheet: ExcelJS.Worksheet): string[] {
  return PRESTADORES_PLANTILLA_COLUMNAS.map((_, index) =>
    cellToString(sheet.getRow(1).getCell(index + 1).value).toLowerCase(),
  );
}

export async function parsePrestadoresPlantilla(buffer: Buffer): Promise<PrestadorPlantillaParsedRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);

  const sheet = workbook.getWorksheet(PRESTADORES_PLANTILLA_SHEET);
  if (!sheet) {
    throw AppError.badRequest(
      `No se encontró la hoja "${PRESTADORES_PLANTILLA_SHEET}". Usá la plantilla generada por el sistema.`,
    );
  }

  const headers = readHeaders(sheet);
  const expectedHeaders = PRESTADORES_PLANTILLA_COLUMNAS.map((column) => column.toLowerCase());
  const headersMatch = expectedHeaders.every((expected, index) => headers[index] === expected);

  if (!headersMatch) {
    throw AppError.badRequest(
      "Los encabezados no coinciden con la plantilla. Descargá nuevamente el Excel modelo.",
    );
  }

  const rows: PrestadorPlantillaParsedRow[] = [];
  const lastRow = Math.min(
    sheet.rowCount,
    PRESTADORES_PLANTILLA_FIRST_DATA_ROW + PRESTADORES_PLANTILLA_DATA_ROW_COUNT - 1,
  );

  for (let rowNumber = PRESTADORES_PLANTILLA_FIRST_DATA_ROW; rowNumber <= lastRow; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const rawValues = PRESTADORES_PLANTILLA_COLUMNAS.map((_, index) =>
      cellToString(row.getCell(index + 1).value),
    );

    if (isRowEmpty(rawValues)) {
      continue;
    }

    rows.push({
      fila: rowNumber,
      values: {
        nombre: rawValues[0] ?? "",
        email: rawValues[1] ?? "",
        password: rawValues[2] ?? "",
        telefono: rawValues[3] ?? "",
        lugarResidencia: rawValues[4] ?? "",
        documento: rawValues[5] ?? "",
        matricula: rawValues[6] ?? "",
        cuit: rawValues[7] ?? "",
        cbu: rawValues[8] ?? "",
        regimenIva: rawValues[9] ?? "",
        servicioHabilitado: rawValues[10] ?? "",
      },
    });
  }

  return rows;
}
