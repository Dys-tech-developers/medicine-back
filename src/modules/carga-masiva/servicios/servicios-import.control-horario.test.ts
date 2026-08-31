import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
import type { ServiciosService } from "../../servicios/servicios.service.js";
import { buildServiciosPlantillaWorkbook } from "./buildServiciosPlantillaWorkbook.js";
import { parseServiciosPlantilla } from "./parseServiciosPlantilla.js";
import { ServiciosImportService } from "./servicios-import.service.js";
import {
  SERVICIOS_PLANTILLA_COLUMNAS,
  SERVICIOS_PLANTILLA_FIRST_DATA_ROW,
  SERVICIOS_PLANTILLA_SHEET,
} from "./servicios-plantilla.constants.js";

const CONTROL_HORARIO_COL =
  SERVICIOS_PLANTILLA_COLUMNAS.indexOf("control_horario") + 1;
const ESTADO_COL = SERVICIOS_PLANTILLA_COLUMNAS.indexOf("estado") + 1;

async function fillPlantillaRow(
  buffer: Buffer,
  values: Partial<Record<(typeof SERVICIOS_PLANTILLA_COLUMNAS)[number], ExcelJS.CellValue>>,
  rowNumber = SERVICIOS_PLANTILLA_FIRST_DATA_ROW,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);
  const sheet = workbook.getWorksheet(SERVICIOS_PLANTILLA_SHEET);
  if (!sheet) {
    throw new Error(`No se encontró la hoja ${SERVICIOS_PLANTILLA_SHEET}`);
  }

  SERVICIOS_PLANTILLA_COLUMNAS.forEach((header, index) => {
    const value = values[header];
    if (value !== undefined) {
      sheet.getCell(rowNumber, index + 1).value = value;
    }
  });

  const out = await workbook.xlsx.writeBuffer();
  return Buffer.from(out);
}

function createImportService() {
  const create = vi.fn().mockResolvedValue({ id: 1 });
  const service = new ServiciosImportService({ create } as unknown as ServiciosService);
  return { create, service };
}

describe("control_horario - certeza de que el sistema no inventa true", () => {
  it("la plantilla oficial no trae filas con control_horario precargado", async () => {
    const buffer = await buildServiciosPlantillaWorkbook();
    const rows = await parseServiciosPlantilla(buffer);

    expect(rows).toEqual([]);
  });

  it("usando la plantilla oficial, celda vacía crea controlHorario=false", async () => {
    const plantilla = await buildServiciosPlantillaWorkbook();
    const buffer = await fillPlantillaRow(plantilla, {
      nombre: "Servicio plantilla",
      estado: "si",
      modalidad_cobro: "por_hora",
      tipo_jornada: "diurno",
      tipo_dia: "habil",
      valor: 1200,
    });

    const { create, service } = createImportService();
    const result = await service.importFromExcel(buffer);

    expect(result.creados).toBe(1);
    expect(result.errores).toEqual([]);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ controlHorario: false }),
    );
  });

  it("estado='si' no se filtra ni se copia a control_horario", async () => {
    const plantilla = await buildServiciosPlantillaWorkbook();
    const buffer = await fillPlantillaRow(plantilla, {
      nombre: "Solo estado si",
      estado: "si",
      modalidad_cobro: "por_servicio",
      tipo_jornada: "diurno",
      tipo_dia: "habil",
      valor: 900,
    });

    const parsed = await parseServiciosPlantilla(buffer);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.values.estado).toBe("si");
    expect(parsed[0]?.values.controlHorario).toBe("");

    const { create, service } = createImportService();
    await service.importFromExcel(buffer);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: true,
        controlHorario: false,
      }),
    );
  });

  it("boolean nativo true de Excel no se importa como controlHorario=true silencioso", async () => {
    const plantilla = await buildServiciosPlantillaWorkbook();
    const buffer = await fillPlantillaRow(plantilla, {
      nombre: "Boolean true",
      control_horario: true,
      modalidad_cobro: "por_hora",
      tipo_jornada: "diurno",
      tipo_dia: "habil",
      valor: 1000,
    });

    const parsed = await parseServiciosPlantilla(buffer);
    expect(parsed[0]?.values.controlHorario).toBe("true");

    const { create, service } = createImportService();
    const result = await service.importFromExcel(buffer);

    expect(result.creados).toBe(0);
    expect(create).not.toHaveBeenCalled();
    expect(result.errores.some((e) => e.campo === "control_horario")).toBe(true);
  });

  it("número 1 en control_horario no se importa como true", async () => {
    const plantilla = await buildServiciosPlantillaWorkbook();
    const buffer = await fillPlantillaRow(plantilla, {
      nombre: "Numero 1",
      control_horario: 1,
      modalidad_cobro: "por_hora",
      tipo_jornada: "diurno",
      tipo_dia: "habil",
      valor: 1000,
    });

    const { create, service } = createImportService();
    const result = await service.importFromExcel(buffer);

    expect(result.creados).toBe(0);
    expect(create).not.toHaveBeenCalled();
    expect(result.errores.some((e) => e.campo === "control_horario")).toBe(true);
  });

  it("espacios en blanco en control_horario equivalen a vacío => false", async () => {
    const plantilla = await buildServiciosPlantillaWorkbook();
    const buffer = await fillPlantillaRow(plantilla, {
      nombre: "Espacios",
      control_horario: "   ",
      modalidad_cobro: "por_hora",
      tipo_jornada: "diurno",
      tipo_dia: "habil",
      valor: 1000,
    });

    const { create, service } = createImportService();
    const result = await service.importFromExcel(buffer);

    expect(result.creados).toBe(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ controlHorario: false }),
    );
  });

  it("fórmula con resultado 'si' sí deja controlHorario=true (dato explícito del Excel)", async () => {
    const plantilla = await buildServiciosPlantillaWorkbook();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(plantilla as never);
    const sheet = workbook.getWorksheet(SERVICIOS_PLANTILLA_SHEET)!;

    sheet.getCell(SERVICIOS_PLANTILLA_FIRST_DATA_ROW, 1).value = "Con formula";
    sheet.getCell(SERVICIOS_PLANTILLA_FIRST_DATA_ROW, ESTADO_COL).value = "si";
    sheet.getCell(SERVICIOS_PLANTILLA_FIRST_DATA_ROW, CONTROL_HORARIO_COL).value = {
      formula: '"si"',
      result: "si",
    };
    sheet.getCell(SERVICIOS_PLANTILLA_FIRST_DATA_ROW, 6).value = "por_hora";
    sheet.getCell(SERVICIOS_PLANTILLA_FIRST_DATA_ROW, 7).value = "diurno";
    sheet.getCell(SERVICIOS_PLANTILLA_FIRST_DATA_ROW, 8).value = "habil";
    sheet.getCell(SERVICIOS_PLANTILLA_FIRST_DATA_ROW, 9).value = 1000;

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const { create, service } = createImportService();
    const result = await service.importFromExcel(buffer);

    expect(result.creados).toBe(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ controlHorario: true }),
    );
  });

  it("única forma de crear con controlHorario=true es texto 'si' en esa columna", async () => {
    const casosQueDebenSerFalseOError: Array<{
      label: string;
      controlHorario: ExcelJS.CellValue;
      expectCreate: boolean;
      expectValue?: boolean;
    }> = [
      { label: "vacio", controlHorario: null, expectCreate: true, expectValue: false },
      { label: "no", controlHorario: "no", expectCreate: true, expectValue: false },
      { label: "NO", controlHorario: "NO", expectCreate: true, expectValue: false },
      { label: "true", controlHorario: "true", expectCreate: false },
      { label: "false", controlHorario: "false", expectCreate: false },
      { label: "1", controlHorario: "1", expectCreate: false },
      { label: "0", controlHorario: "0", expectCreate: false },
      { label: "verdadero", controlHorario: "verdadero", expectCreate: false },
    ];

    for (const caso of casosQueDebenSerFalseOError) {
      const plantilla = await buildServiciosPlantillaWorkbook();
      const buffer = await fillPlantillaRow(plantilla, {
        nombre: `Caso ${caso.label}`,
        control_horario: caso.controlHorario,
        modalidad_cobro: "por_hora",
        tipo_jornada: "diurno",
        tipo_dia: "habil",
        valor: 1000,
      });

      const { create, service } = createImportService();
      const result = await service.importFromExcel(buffer);

      if (caso.expectCreate) {
        expect(result.creados, caso.label).toBe(1);
        expect(create.mock.calls[0]?.[0].controlHorario, caso.label).toBe(caso.expectValue);
      } else {
        expect(result.creados, caso.label).toBe(0);
        expect(create, caso.label).not.toHaveBeenCalled();
      }
    }

    const plantillaSi = await buildServiciosPlantillaWorkbook();
    const bufferSi = await fillPlantillaRow(plantillaSi, {
      nombre: "Caso si",
      control_horario: "si",
      modalidad_cobro: "por_hora",
      tipo_jornada: "diurno",
      tipo_dia: "habil",
      valor: 1000,
    });
    const { create, service } = createImportService();
    await service.importFromExcel(bufferSi);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ controlHorario: true }),
    );
  });
});
