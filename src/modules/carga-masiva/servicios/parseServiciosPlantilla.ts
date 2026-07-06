import ExcelJS from "exceljs";
import type { CellValue } from "exceljs";
import { AppError } from "../../../core/errors/AppError.js";
import {
  SERVICIOS_PLANTILLA_COLUMNAS,
  SERVICIOS_PLANTILLA_DATA_ROW_COUNT,
  SERVICIOS_PLANTILLA_FIRST_DATA_ROW,
  SERVICIOS_PLANTILLA_SHEET,
} from "./servicios-plantilla.constants.js";

export interface ServicioPlantillaRawRow {
  nombre: string;
  descripcion: string;
  estado: string;
  controlHorario: string;
  modoRelevo: string;
  modalidadCobro: string;
  tipoJornada: string;
  tipoDia: string;
  valor: string;
}

export interface ServicioPlantillaParsedRow {
  fila: number;
  values: ServicioPlantillaRawRow;
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
  return SERVICIOS_PLANTILLA_COLUMNAS.map((_, index) =>
    cellToString(sheet.getRow(1).getCell(index + 1).value).toLowerCase(),
  );
}

export async function parseServiciosPlantilla(buffer: Buffer): Promise<ServicioPlantillaParsedRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);

  const sheet = workbook.getWorksheet(SERVICIOS_PLANTILLA_SHEET);
  if (!sheet) {
    throw AppError.badRequest(
      `No se encontró la hoja "${SERVICIOS_PLANTILLA_SHEET}". Usá la plantilla generada por el sistema.`,
    );
  }

  const headers = readHeaders(sheet);
  const expectedHeaders = SERVICIOS_PLANTILLA_COLUMNAS.map((column) => column.toLowerCase());
  const headersMatch = expectedHeaders.every((expected, index) => headers[index] === expected);

  if (!headersMatch) {
    throw AppError.badRequest(
      "Los encabezados no coinciden con la plantilla. Descargá nuevamente el Excel modelo.",
    );
  }

  const rows: ServicioPlantillaParsedRow[] = [];
  const lastRow = Math.min(
    sheet.rowCount,
    SERVICIOS_PLANTILLA_FIRST_DATA_ROW + SERVICIOS_PLANTILLA_DATA_ROW_COUNT - 1,
  );

  for (let rowNumber = SERVICIOS_PLANTILLA_FIRST_DATA_ROW; rowNumber <= lastRow; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const rawValues = SERVICIOS_PLANTILLA_COLUMNAS.map((_, index) =>
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
        estado: rawValues[2] ?? "",
        controlHorario: rawValues[3] ?? "",
        modoRelevo: rawValues[4] ?? "",
        modalidadCobro: rawValues[5] ?? "",
        tipoJornada: rawValues[6] ?? "",
        tipoDia: rawValues[7] ?? "",
        valor: rawValues[8] ?? "",
      },
    });
  }

  return rows;
}
