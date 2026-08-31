import { describe, expect, it } from "vitest";
import { servicioImportRowSchema } from "./servicios-import.validation.js";

function baseRow(overrides: Record<string, string> = {}) {
  return {
    nombre: "Enfermería",
    descripcion: "",
    estado: "",
    controlHorario: "",
    modoRelevo: "",
    modalidadCobro: "por_hora",
    tipoJornada: "diurno",
    tipoDia: "habil",
    valor: "1500",
    ...overrides,
  };
}

describe("servicioImportRowSchema - control_horario", () => {
  it("deja controlHorario en false cuando la celda está vacía", () => {
    const result = servicioImportRowSchema.parse(baseRow({ controlHorario: "" }));

    expect(result.controlHorario).toBe(false);
  });

  it("parsea 'si' como true", () => {
    const result = servicioImportRowSchema.parse(baseRow({ controlHorario: "si" }));

    expect(result.controlHorario).toBe(true);
  });

  it("parsea 'no' como false", () => {
    const result = servicioImportRowSchema.parse(baseRow({ controlHorario: "no" }));

    expect(result.controlHorario).toBe(false);
  });

  it("acepta 'SI' en mayúsculas como true", () => {
    const result = servicioImportRowSchema.parse(baseRow({ controlHorario: "SI" }));

    expect(result.controlHorario).toBe(true);
  });

  it("rechaza valores inválidos como 'true'", () => {
    const result = servicioImportRowSchema.safeParse(baseRow({ controlHorario: "true" }));

    expect(result.success).toBe(false);
  });

  it("no confunde el default de estado (true) con controlHorario (false)", () => {
    const result = servicioImportRowSchema.parse(
      baseRow({
        estado: "",
        controlHorario: "",
        modoRelevo: "",
      }),
    );

    expect(result.estado).toBe(true);
    expect(result.controlHorario).toBe(false);
    expect(result.modoRelevo).toBe(false);
  });
});
