import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
import type { ServiciosService } from "../../servicios/servicios.service.js";
import { SERVICIOS_PLANTILLA_COLUMNAS, SERVICIOS_PLANTILLA_SHEET } from "./servicios-plantilla.constants.js";
import { ServiciosImportService } from "./servicios-import.service.js";

async function buildExcelBuffer(
  rows: Array<Partial<Record<(typeof SERVICIOS_PLANTILLA_COLUMNAS)[number], string | number>>>,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(SERVICIOS_PLANTILLA_SHEET);

  SERVICIOS_PLANTILLA_COLUMNAS.forEach((header, index) => {
    sheet.getCell(1, index + 1).value = header;
  });

  rows.forEach((row, rowIndex) => {
    SERVICIOS_PLANTILLA_COLUMNAS.forEach((header, colIndex) => {
      const value = row[header];
      if (value !== undefined) {
        sheet.getCell(rowIndex + 2, colIndex + 1).value = value;
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

describe("ServiciosImportService - control_horario", () => {
  it("crea el servicio con controlHorario=false si la columna viene vacía", async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const service = new ServiciosImportService({ create } as unknown as ServiciosService);

    const buffer = await buildExcelBuffer([
      {
        nombre: "Kinesiología",
        estado: "si",
        modalidad_cobro: "por_hora",
        tipo_jornada: "diurno",
        tipo_dia: "habil",
        valor: 2000,
      },
    ]);

    const result = await service.importFromExcel(buffer);

    expect(result.creados).toBe(1);
    expect(result.errores).toEqual([]);
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Kinesiología",
        controlHorario: false,
        modoRelevo: false,
        estado: true,
      }),
    );
  });

  it("crea el servicio con controlHorario=true solo cuando la celda es 'si'", async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const service = new ServiciosImportService({ create } as unknown as ServiciosService);

    const buffer = await buildExcelBuffer([
      {
        nombre: "Guardia 12hs",
        control_horario: "si",
        modo_relevo: "no",
        modalidad_cobro: "por_hora",
        tipo_jornada: "nocturno",
        tipo_dia: "habil",
        valor: 3500,
      },
    ]);

    const result = await service.importFromExcel(buffer);

    expect(result.creados).toBe(1);
    expect(result.errores).toEqual([]);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Guardia 12hs",
        controlHorario: true,
        modoRelevo: false,
      }),
    );
  });

  it("crea varios servicios respetando si/no/vacío en control_horario", async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const service = new ServiciosImportService({ create } as unknown as ServiciosService);

    const buffer = await buildExcelBuffer([
      {
        nombre: "Servicio A",
        control_horario: "si",
        modalidad_cobro: "por_servicio",
        tipo_jornada: "diurno",
        tipo_dia: "habil",
        valor: 1000,
      },
      {
        nombre: "Servicio B",
        control_horario: "no",
        modalidad_cobro: "por_servicio",
        tipo_jornada: "diurno",
        tipo_dia: "habil",
        valor: 1000,
      },
      {
        nombre: "Servicio C",
        modalidad_cobro: "por_servicio",
        tipo_jornada: "diurno",
        tipo_dia: "habil",
        valor: 1000,
      },
    ]);

    const result = await service.importFromExcel(buffer);

    expect(result.creados).toBe(3);
    expect(result.errores).toEqual([]);
    expect(create).toHaveBeenCalledTimes(3);
    expect(create.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ controlHorario: true }));
    expect(create.mock.calls[1]?.[0]).toEqual(expect.objectContaining({ controlHorario: false }));
    expect(create.mock.calls[2]?.[0]).toEqual(expect.objectContaining({ controlHorario: false }));
  });
});
