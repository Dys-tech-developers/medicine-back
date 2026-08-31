import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { LocalidadesRepository } from "../../localidades/localidades.repository.js";
import type { ObrasSocialesRepository } from "../../obras-sociales/obras-sociales.repository.js";
import type { PacientesRepository } from "../../pacientes/pacientes.repository.js";
import { PacientesImportService } from "./pacientes-import.service.js";

const REAL_XLSX = path.resolve("docs/pacientes_carga_masiva (2).xlsx");

function buildService(overrides?: {
  obrasSociales?: Array<{ id: number; nombre: string; codigo: string; estado: boolean }>;
  localidades?: Array<{ id: number; nombre: string }>;
  defaultObraSocialId?: number | null;
}) {
  const createManyWithCodigoQr = vi
    .fn()
    .mockImplementation(async (items: unknown[]) => items.length);
  const findActivaIdByCodigo = vi.fn().mockResolvedValue(overrides?.defaultObraSocialId ?? null);

  const pacientesRepository = {
    createManyWithCodigoQr,
  } as unknown as PacientesRepository;

  const obrasSocialesRepository = {
    findAllActivasOrderedByNombre: vi.fn().mockResolvedValue(
      overrides?.obrasSociales ?? [
        { id: 1, nombre: "OSDE", codigo: "OSDE", estado: true },
        { id: 2, nombre: "OSFATLyF", codigo: "OSFATLyF", estado: true },
        { id: 3, nombre: "OSPE", codigo: "OSPE", estado: true },
        { id: 4, nombre: "Particular", codigo: "PART", estado: true },
        { id: 5, nombre: "MEDIFE", codigo: "MEDIFE", estado: true },
      ],
    ),
    findActivaIdByCodigo,
  } as unknown as ObrasSocialesRepository;

  const localidadesRepository = {
    findAllOrderedByNombre: vi.fn().mockResolvedValue(
      overrides?.localidades ?? [{ id: 1, nombre: "Chivilcoy" }],
    ),
  } as unknown as LocalidadesRepository;

  return {
    service: new PacientesImportService(
      pacientesRepository,
      obrasSocialesRepository,
      localidadesRepository,
    ),
    createManyWithCodigoQr,
    findActivaIdByCodigo,
  };
}

describe("PacientesImportService - archivo real", () => {
  it("importa el Excel de docs sin exigir obra social default si todas las filas traen OS", async () => {
    if (!fs.existsSync(REAL_XLSX)) {
      return;
    }

    const { service, createManyWithCodigoQr, findActivaIdByCodigo } = buildService({
      defaultObraSocialId: null,
    });

    const result = await service.importFromExcel(fs.readFileSync(REAL_XLSX));

    expect(result.totalFilas).toBe(14);
    expect(result.creados).toBe(14);
    expect(result.errores).toEqual([]);
    expect(findActivaIdByCodigo).not.toHaveBeenCalled();
    expect(createManyWithCodigoQr).toHaveBeenCalledOnce();
  });

  it("sigue exigiendo obra social default solo cuando alguna fila no trae OS", async () => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Pacientes");
    sheet.addRow([
      "obra_social",
      "nombre",
      "apellido",
      "numero_documento",
      "fecha_nacimiento",
      "sexo",
      "telefono",
      "direccion",
      "localidad",
      "numero_afiliado",
    ]);
    sheet.addRow(["", "Ana", "Perez", "30111222", "1990-01-01", "F", "111", "Calle 1", "Chivilcoy", ""]);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const { service } = buildService({ defaultObraSocialId: null });

    await expect(service.importFromExcel(buffer)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("obra social por defecto"),
    });
  });

  it("si hay OS default configurada, importa la fila sin OS usando ese id", async () => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Pacientes");
    sheet.addRow([
      "obra_social",
      "nombre",
      "apellido",
      "numero_documento",
      "fecha_nacimiento",
      "sexo",
      "telefono",
      "direccion",
      "localidad",
      "numero_afiliado",
    ]);
    sheet.addRow(["", "Ana", "Perez", "30111222", "1990-01-01", "F", "111", "Calle 1", "Chivilcoy", ""]);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const { service, createManyWithCodigoQr, findActivaIdByCodigo } = buildService({
      defaultObraSocialId: 99,
    });

    const result = await service.importFromExcel(buffer);

    expect(result.creados).toBe(1);
    expect(findActivaIdByCodigo).toHaveBeenCalled();
    expect(createManyWithCodigoQr).toHaveBeenCalledWith([
      expect.objectContaining({ obraSocialId: 99, nombre: "Ana" }),
    ]);
  });
});
