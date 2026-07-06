import ExcelJS from "exceljs";
import type { CellValue } from "exceljs";
import { AppError } from "../../../core/errors/AppError.js";
import {
  STOCK_PLANTILLA_COLUMNAS,
  STOCK_PLANTILLA_DATA_ROW_COUNT,
  STOCK_PLANTILLA_FIRST_DATA_ROW,
  STOCK_PLANTILLA_SHEET,
} from "./stock-plantilla.constants.js";

export interface StockPlantillaRawRow {
  nombre: string;
  descripcion: string;
  codigo: string;
  stockActual: string;
  stockMinimo: string;
  unidadMedida: string;
  requiereVencimiento: string;
  fechaVencimiento: string | Date;
  estado: string;
}

export interface StockPlantillaParsedRow {
  fila: number;
  values: StockPlantillaRawRow;
}

function cellToString(value: CellValue | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
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

function cellToDateOrString(value: CellValue | undefined): string | Date {
  if (value instanceof Date) {
    return value;
  }

  return cellToString(value);
}

function isRowEmpty(values: string[]): boolean {
  return values.every((value) => value.length === 0);
}

function readHeaders(sheet: ExcelJS.Worksheet): string[] {
  return STOCK_PLANTILLA_COLUMNAS.map((_, index) =>
    cellToString(sheet.getRow(1).getCell(index + 1).value).toLowerCase(),
  );
}

export async function parseStockPlantilla(buffer: Buffer): Promise<StockPlantillaParsedRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);

  const sheet = workbook.getWorksheet(STOCK_PLANTILLA_SHEET);
  if (!sheet) {
    throw AppError.badRequest(
      `No se encontró la hoja "${STOCK_PLANTILLA_SHEET}". Usá la plantilla generada por el sistema.`,
    );
  }

  const headers = readHeaders(sheet);
  const expectedHeaders = STOCK_PLANTILLA_COLUMNAS.map((column) => column.toLowerCase());
  const headersMatch = expectedHeaders.every((expected, index) => headers[index] === expected);

  if (!headersMatch) {
    throw AppError.badRequest(
      "Los encabezados no coinciden con la plantilla. Descargá nuevamente el Excel modelo.",
    );
  }

  const rows: StockPlantillaParsedRow[] = [];
  const lastRow = Math.min(
    sheet.rowCount,
    STOCK_PLANTILLA_FIRST_DATA_ROW + STOCK_PLANTILLA_DATA_ROW_COUNT - 1,
  );

  for (let rowNumber = STOCK_PLANTILLA_FIRST_DATA_ROW; rowNumber <= lastRow; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const rawValues = STOCK_PLANTILLA_COLUMNAS.map((_, index) =>
      cellToString(row.getCell(index + 1).value),
    );

    if (isRowEmpty(rawValues)) {
      continue;
    }

    rows.push({
      fila: rowNumber,
      values: {
        nombre: rawValues[0] ?? "",
        descripcion: rawValues[1] ?? "",
        codigo: rawValues[2] ?? "",
        stockActual: rawValues[3] ?? "",
        stockMinimo: rawValues[4] ?? "",
        unidadMedida: rawValues[5] ?? "",
        requiereVencimiento: rawValues[6] ?? "",
        fechaVencimiento: cellToDateOrString(row.getCell(8).value),
        estado: rawValues[8] ?? "",
      },
    });
  }

  return rows;
}
