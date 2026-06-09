import ExcelJS from "exceljs";
import type { CellValue } from "exceljs";
import { AppError } from "../../../core/errors/AppError.js";
import {
  PACIENTES_PLANTILLA_COLUMNAS,
  PACIENTES_PLANTILLA_DATA_ROW_COUNT,
  PACIENTES_PLANTILLA_FIRST_DATA_ROW,
  PACIENTES_PLANTILLA_SHEET,
} from "./pacientes-plantilla.constants.js";
export interface PacientePlantillaRawRow {
  obraSocial: string;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  fechaNacimiento: string | Date;
  sexo: string;
  telefono: string;
  direccion: string;
  localidad: string;
  numeroAfiliado: string;
}

export interface PacientePlantillaParsedRow {
  fila: number;
  values: PacientePlantillaRawRow;
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

function isRowEmpty(values: string[]): boolean {
  return values.every((value) => value.length === 0);
}

function readHeaders(sheet: ExcelJS.Worksheet): string[] {
  return PACIENTES_PLANTILLA_COLUMNAS.map((_, index) =>
    cellToString(sheet.getRow(1).getCell(index + 1).value).toLowerCase(),
  );
}

export async function parsePacientesPlantilla(buffer: Buffer): Promise<PacientePlantillaParsedRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);

  const sheet = workbook.getWorksheet(PACIENTES_PLANTILLA_SHEET);
  if (!sheet) {
    throw AppError.badRequest(
      `No se encontró la hoja "${PACIENTES_PLANTILLA_SHEET}". Usá la plantilla generada por el sistema.`,
    );
  }

  const headers = readHeaders(sheet);
  const expectedHeaders = PACIENTES_PLANTILLA_COLUMNAS.map((column) => column.toLowerCase());
  const headersMatch = expectedHeaders.every((expected, index) => headers[index] === expected);

  if (!headersMatch) {
    throw AppError.badRequest(
      "Los encabezados no coinciden con la plantilla. Descargá nuevamente el Excel modelo.",
    );
  }

  const rows: PacientePlantillaParsedRow[] = [];
  const lastRow = Math.min(sheet.rowCount, PACIENTES_PLANTILLA_FIRST_DATA_ROW + PACIENTES_PLANTILLA_DATA_ROW_COUNT - 1);

  for (let rowNumber = PACIENTES_PLANTILLA_FIRST_DATA_ROW; rowNumber <= lastRow; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const fechaNacimientoValue = row.getCell(5).value;
    const fechaNacimiento =
      fechaNacimientoValue instanceof Date
        ? fechaNacimientoValue
        : cellToString(fechaNacimientoValue as CellValue | undefined);

    const rawValues = [
      cellToString(row.getCell(1).value),
      cellToString(row.getCell(2).value),
      cellToString(row.getCell(3).value),
      cellToString(row.getCell(4).value),
      cellToString(row.getCell(6).value),
      cellToString(row.getCell(7).value),
      cellToString(row.getCell(8).value),
      cellToString(row.getCell(9).value),
      cellToString(row.getCell(10).value),
    ];

    const rowValues = [
      rawValues[0] ?? "",
      rawValues[1] ?? "",
      rawValues[2] ?? "",
      rawValues[3] ?? "",
      typeof fechaNacimiento === "string" ? fechaNacimiento : "",
      rawValues[4] ?? "",
      rawValues[5] ?? "",
      rawValues[6] ?? "",
      rawValues[7] ?? "",
      rawValues[8] ?? "",
    ];

    if (isRowEmpty(rowValues)) {
      continue;
    }

    rows.push({
      fila: rowNumber,
      values: {
        obraSocial: rawValues[0] ?? "",
        nombre: rawValues[1] ?? "",
        apellido: rawValues[2] ?? "",
        numeroDocumento: rawValues[3] ?? "",
        fechaNacimiento,
        sexo: rawValues[4] ?? "",
        telefono: rawValues[5] ?? "",
        direccion: rawValues[6] ?? "",
        localidad: rawValues[7] ?? "",
        numeroAfiliado: rawValues[8] ?? "",
      },
    });
  }

  return rows;
}
